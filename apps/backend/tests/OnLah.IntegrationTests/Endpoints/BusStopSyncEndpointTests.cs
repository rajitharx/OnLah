using System.Net;
using System.Net.Http.Json;
using Microsoft.Extensions.DependencyInjection;
using NSubstitute;
using OnLah.Application.Common.Interfaces;
using OnLah.Domain.BusStops;
using OnLah.Infrastructure.Persistence;
using OnLah.IntegrationTests.Common;
using Xunit;

namespace OnLah.IntegrationTests.Endpoints;

public sealed class BusStopSyncEndpointTests(ApiFactory factory) : IClassFixture<ApiFactory>
{
    private const string SyncPath = "/api/v1/admin/bus-stops/sync";

    private readonly HttpClient _client = factory.CreateClient();

    [Fact]
    public async Task SyncBusStops_NoAdminKey_Returns401()
    {
        var response = await _client.PostAsync(SyncPath, null);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task SyncBusStops_WrongAdminKey_Returns401()
    {
        using var request = new HttpRequestMessage(HttpMethod.Post, SyncPath);
        request.Headers.Add("X-Admin-Key", "not-the-key");

        var response = await _client.SendAsync(request);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task SyncBusStops_CorrectAdminKey_SyncsStopsAndReturnsCount()
    {
        factory.LtaBusStopClient.GetAllStopsAsync(Arg.Any<CancellationToken>()).Returns(StreamOf(
            new LtaBusStop("83139", "Sengkang Av 2", "Blk 123", 1.39, 103.89),
            new LtaBusStop("01012", "Victoria St", "Hotel Grand", 1.29, 103.85)));

        using var request = new HttpRequestMessage(HttpMethod.Post, SyncPath);
        request.Headers.Add("X-Admin-Key", ApiFactory.AdminKey);

        var response = await _client.SendAsync(request);
        var body = await response.Content.ReadFromJsonAsync<SyncBody>();

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal(2, body!.StopsSynced);
    }

    [Fact]
    public async Task SyncBusStops_LtaFails_Returns502()
    {
        factory.LtaBusStopClient.GetAllStopsAsync(Arg.Any<CancellationToken>()).Returns(Throwing(new HttpRequestException("boom")));

        var response = await SendSyncAsync();

        Assert.Equal(HttpStatusCode.BadGateway, response.StatusCode);
    }

    [Fact]
    public async Task SyncBusStops_Cancelled_IsNotReportedAsBadGateway()
    {
        factory.LtaBusStopClient.GetAllStopsAsync(Arg.Any<CancellationToken>()).Returns(Throwing(new OperationCanceledException()));

        var response = await SendSyncAsync();

        Assert.NotEqual(HttpStatusCode.BadGateway, response.StatusCode);
    }

    private Task<HttpResponseMessage> SendSyncAsync()
    {
        var request = new HttpRequestMessage(HttpMethod.Post, SyncPath);
        request.Headers.Add("X-Admin-Key", ApiFactory.AdminKey);
        return _client.SendAsync(request);
    }

    private static async IAsyncEnumerable<LtaBusStop> Throwing(Exception exception)
    {
        await Task.CompletedTask;
        throw exception;
#pragma warning disable CS0162
        yield break;
#pragma warning restore CS0162
    }

    [Fact]
    public async Task SyncBusStops_LtaReturnsNoStops_Returns502AndKeepsStoredStops()
    {
        await SeedStopAsync("83139");
        factory.LtaBusStopClient.GetAllStopsAsync(Arg.Any<CancellationToken>()).Returns(StreamOf());

        var response = await _client.SendAsync(AdminSyncRequest());

        Assert.Equal(HttpStatusCode.BadGateway, response.StatusCode);
        using var scope = factory.Services.CreateScope();
        Assert.True(await scope.ServiceProvider.GetRequiredService<IBusStopRepository>().CountAsync() > 0);
    }

    [Fact]
    public async Task SyncBusStops_AnotherSyncIsWriting_Returns409()
    {
        factory.LtaBusStopClient.GetAllStopsAsync(Arg.Any<CancellationToken>()).Returns(StreamOf(
            new LtaBusStop("83139", "Sengkang Av 2", "Blk 123", 1.39, 103.89),
            new LtaBusStop("01012", "Victoria St", "Hotel Grand", 1.29, 103.85)));
        await using var heldLock = await SyncLockHolder.HoldAsync(factory, SyncLocks.BusStops);

        var response = await _client.SendAsync(AdminSyncRequest());

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
    }

    private static HttpRequestMessage AdminSyncRequest()
    {
        var request = new HttpRequestMessage(HttpMethod.Post, SyncPath);
        request.Headers.Add("X-Admin-Key", ApiFactory.AdminKey);
        return request;
    }

    private async Task SeedStopAsync(string code)
    {
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<OnLahDbContext>();
        if (await db.BusStops.FindAsync(code) is null)
        {
            db.BusStops.Add(BusStop.Create(code, "Victoria St", "Seeded stop", 1.29, 103.85));
            await db.SaveChangesAsync();
        }
    }

    private sealed record SyncBody(int StopsSynced);

    private static async IAsyncEnumerable<LtaBusStop> StreamOf(params LtaBusStop[] stops)
    {
        foreach (var stop in stops)
            yield return stop;
        await Task.CompletedTask;
    }
}
