using System.Net;
using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using NSubstitute;
using OnLah.Application.Common.Interfaces;
using OnLah.Domain.BusNetwork;
using OnLah.Domain.BusStops;
using OnLah.Infrastructure.Persistence;
using OnLah.IntegrationTests.Common;
using Xunit;

namespace OnLah.IntegrationTests.Endpoints;

public sealed class BusServiceEndpointTests(ApiFactory factory) : IClassFixture<ApiFactory>
{
    private readonly HttpClient _client = factory.CreateClient();

    [Fact]
    public async Task GetBusService_UnknownService_Returns404()
    {
        var response = await _client.GetAsync("/api/v1/bus-services/NOSUCH9");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task GetBusService_InvalidServiceNumber_Returns422()
    {
        var response = await _client.GetAsync("/api/v1/bus-services/10-2");

        Assert.Equal(HttpStatusCode.UnprocessableEntity, response.StatusCode);
    }

    [Theory]
    [InlineData("12345678901")]
    [InlineData("197%0A")]
    public async Task GetBusService_ServiceNumberTooLongOrWithNewline_Returns422(string serviceNo)
    {
        var response = await _client.GetAsync($"/api/v1/bus-services/{serviceNo}");

        Assert.Equal(HttpStatusCode.UnprocessableEntity, response.StatusCode);
    }

    [Fact]
    public async Task GetBusService_KnownServiceInLowercase_Returns200WithDirectionAndHours()
    {
        await SeedService102Async();

        var body = await _client.GetFromJsonAsync<ServiceBody>("/api/v1/bus-services/102m");

        Assert.NotNull(body);
        Assert.Equal("102M", body.ServiceNo);
        var direction = Assert.Single(body.Directions);
        Assert.True(direction.IsLoop);
        Assert.Equal("05:30", direction.Hours.Weekday!.First);
        Assert.Equal("9-11", direction.Frequency.AmPeak);
    }

    [Fact]
    public async Task GetBusService_ServicePublishedInLowercase_Returns200()
    {
        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<OnLahDbContext>();
            db.BusServices.Add(BusService.Create("10e", 1, "SBST", "TRUNK", "64009", "64009", "9-11", "09-13", "10-12", "12-16", null));
            await db.SaveChangesAsync();
        }

        var body = await _client.GetFromJsonAsync<ServiceBody>("/api/v1/bus-services/10e");

        Assert.Equal("10e", body!.ServiceNo);
    }

    [Fact]
    public async Task SyncBusNetwork_LtaFails_Returns502()
    {
        factory.LtaBusNetworkClient.GetAllServicesAsync(Arg.Any<CancellationToken>())
            .Returns(Throwing<BusService>(new HttpRequestException("boom")));

        var response = await SendSyncAsync();

        Assert.Equal(HttpStatusCode.BadGateway, response.StatusCode);
    }

    [Fact]
    public async Task SyncBusNetwork_Cancelled_IsNotReportedAsBadGateway()
    {
        factory.LtaBusNetworkClient.GetAllServicesAsync(Arg.Any<CancellationToken>())
            .Returns(Throwing<BusService>(new OperationCanceledException()));

        var response = await SendSyncAsync();

        Assert.NotEqual(HttpStatusCode.BadGateway, response.StatusCode);
    }

    [Fact]
    public async Task SyncBusNetwork_NoAdminKey_Returns401()
    {
        var response = await _client.PostAsync("/api/v1/admin/bus-network/sync", null);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task SyncBusNetwork_CorrectAdminKey_ReturnsCounts()
    {
        await ClearBusNetworkAsync();
        factory.LtaBusNetworkClient.GetAllServicesAsync(Arg.Any<CancellationToken>())
            .Returns(StreamOf(BusService.Create("102M", 1, "SBST", "TRUNK", "64009", "64009", "9-11", "09-13", "10-12", "12-16", null)));
        factory.LtaBusNetworkClient.GetAllRoutesAsync(Arg.Any<CancellationToken>())
            .Returns(StreamOf(BusRoute.Create("102M", 1, 1, "64009", "SBST", 0, "0530", "2355", "0530", "2355", "-", "")));

        using var request = new HttpRequestMessage(HttpMethod.Post, "/api/v1/admin/bus-network/sync");
        request.Headers.Add("X-Admin-Key", ApiFactory.AdminKey);
        var response = await _client.SendAsync(request);
        var body = await response.Content.ReadFromJsonAsync<SyncBody>();

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal(1, body!.ServicesSynced);
        Assert.Equal(1, body.RoutesSynced);
    }

    private Task<HttpResponseMessage> SendSyncAsync()
    {
        var request = new HttpRequestMessage(HttpMethod.Post, "/api/v1/admin/bus-network/sync");
        request.Headers.Add("X-Admin-Key", ApiFactory.AdminKey);
        return _client.SendAsync(request);
    }

    private static async IAsyncEnumerable<T> Throwing<T>(Exception exception)
    {
        await Task.CompletedTask;
        throw exception;
#pragma warning disable CS0162
        yield break;
#pragma warning restore CS0162
    }

    [Fact]
    public async Task SyncBusNetwork_AnotherSyncIsWriting_Returns409()
    {
        await ClearBusNetworkAsync();
        factory.LtaBusNetworkClient.GetAllServicesAsync(Arg.Any<CancellationToken>())
            .Returns(StreamOf(BusService.Create("102M", 1, "SBST", "TRUNK", "64009", "64009", "9-11", "09-13", "10-12", "12-16", null)));
        factory.LtaBusNetworkClient.GetAllRoutesAsync(Arg.Any<CancellationToken>())
            .Returns(StreamOf(BusRoute.Create("102M", 1, 1, "64009", "SBST", 0, "0530", "2355", "0530", "2355", "-", "")));
        await using var heldLock = await SyncLockHolder.HoldAsync(factory, SyncLocks.BusNetwork);

        using var request = new HttpRequestMessage(HttpMethod.Post, "/api/v1/admin/bus-network/sync");
        request.Headers.Add("X-Admin-Key", ApiFactory.AdminKey);
        var response = await _client.SendAsync(request);

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
    }

    // A sync that would shrink the stored network by more than 20% is refused, so rows left by other tests must go first.
    private async Task ClearBusNetworkAsync()
    {
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<OnLahDbContext>();
        await db.BusRoutes.ExecuteDeleteAsync();
        await db.BusServices.ExecuteDeleteAsync();
    }

    private async Task SeedService102Async()
    {
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<OnLahDbContext>();
        if (db.BusServices.Any(s => s.ServiceNo == "102M"))
            return;
        db.BusStops.Add(BusStop.Create("64009", "Seletar Aerospace Dr", "Opp Seletar Stn", 1.39, 103.87));
        db.BusServices.Add(BusService.Create("102M", 1, "SBST", "TRUNK", "64009", "64009", "9-11", "09-13", "10-12", "12-16", "Seletar Aerospace Dr"));
        db.BusRoutes.Add(BusRoute.Create("102M", 1, 1, "64009", "SBST", 0, "0530", "2355", "0530", "2355", "-", ""));
        await db.SaveChangesAsync();
    }

    private static async IAsyncEnumerable<T> StreamOf<T>(params T[] items)
    {
        foreach (var item in items)
            yield return item;
        await Task.CompletedTask;
    }

    private sealed record ServiceBody(string ServiceNo, IReadOnlyList<DirectionBody> Directions);

    private sealed record DirectionBody(bool IsLoop, HoursBody Hours, FrequencyBody Frequency);

    private sealed record HoursBody(RangeBody? Weekday);

    private sealed record RangeBody(string First, string Last);

    private sealed record FrequencyBody(string? AmPeak);

    private sealed record SyncBody(int ServicesSynced, int RoutesSynced);
}
