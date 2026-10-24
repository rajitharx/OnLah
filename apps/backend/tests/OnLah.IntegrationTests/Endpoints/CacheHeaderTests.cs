using System.Net;
using Microsoft.Extensions.DependencyInjection;
using NSubstitute;
using OnLah.Application.Common.Interfaces;
using OnLah.Application.TrainAlerts;
using OnLah.Domain.BusNetwork;
using OnLah.Domain.BusStops;
using OnLah.Domain.Common;
using OnLah.Infrastructure.Persistence;
using OnLah.IntegrationTests.Common;
using Xunit;

namespace OnLah.IntegrationTests.Endpoints;

public sealed class CacheHeaderTests(ApiFactory factory) : IClassFixture<ApiFactory>
{
    private readonly HttpClient _client = factory.CreateClient();

    [Fact]
    public async Task GetBusService_Found_IsPubliclyCachedForAnHour()
    {
        await SeedAsync();

        var response = await _client.GetAsync("/api/v1/bus-services/102M");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        AssertPublicForAnHour(response);
    }

    [Fact]
    public async Task GetBusService_NotFound_IsNotCached()
    {
        var response = await _client.GetAsync("/api/v1/bus-services/NOSUCH9");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        Assert.Null(response.Headers.CacheControl);
    }

    [Fact]
    public async Task GetBusService_InvalidServiceNumber_IsNotCached()
    {
        var response = await _client.GetAsync("/api/v1/bus-services/10-2");

        Assert.Equal(HttpStatusCode.UnprocessableEntity, response.StatusCode);
        Assert.Null(response.Headers.CacheControl);
    }

    [Fact]
    public async Task SearchBusStops_ValidQuery_IsPubliclyCachedForAnHour()
    {
        var response = await _client.GetAsync("/api/v1/bus-stops/search?query=seletar");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        AssertPublicForAnHour(response);
    }

    [Fact]
    public async Task SearchBusStops_InvalidQuery_IsNotCached()
    {
        var response = await _client.GetAsync("/api/v1/bus-stops/search?query=a");

        Assert.Equal(HttpStatusCode.UnprocessableEntity, response.StatusCode);
        Assert.Null(response.Headers.CacheControl);
    }

    [Fact]
    public async Task GetNearbyBusStops_ValidLocation_IsPrivatelyCachedForAnHour()
    {
        var response = await _client.GetAsync("/api/v1/bus-stops/nearby?lat=1.39&lng=103.87&radiusMeters=500");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var cacheControl = response.Headers.CacheControl;
        Assert.NotNull(cacheControl);
        Assert.True(cacheControl.Private);
        Assert.False(cacheControl.Public);
        Assert.False(cacheControl.NoStore);
        Assert.Equal(TimeSpan.FromHours(1), cacheControl.MaxAge);
    }

    [Fact]
    public async Task GetNearbyBusStops_InvalidLocation_IsNotCached()
    {
        var response = await _client.GetAsync("/api/v1/bus-stops/nearby?lat=95&lng=103.87&radiusMeters=500");

        Assert.Equal(HttpStatusCode.UnprocessableEntity, response.StatusCode);
        Assert.Null(response.Headers.CacheControl);
    }

    [Fact]
    public async Task GetTrainAlerts_Success_IsNoStore()
    {
        factory.LtaTrainAlertClient.GetAlertsAsync(Arg.Any<CancellationToken>())
            .Returns(Result.Success(new TrainAlertsResult(TrainServiceStatus.Normal, [])));

        var response = await _client.GetAsync("/api/v1/train-alerts");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.True(response.Headers.CacheControl?.NoStore);
    }

    [Fact]
    public async Task GetBusArrivals_InvalidStop_IsNoStore()
    {
        var response = await _client.GetAsync("/api/v1/bus-arrivals?stopCode=abc");

        Assert.Equal(HttpStatusCode.UnprocessableEntity, response.StatusCode);
        Assert.True(response.Headers.CacheControl?.NoStore);
    }

    [Fact]
    public async Task GetRouteTracker_InvalidRequest_IsNoStore()
    {
        var response = await _client.GetAsync("/api/v1/route-tracker?busStopCode=abc&serviceNo=10-2");

        Assert.Equal(HttpStatusCode.UnprocessableEntity, response.StatusCode);
        Assert.True(response.Headers.CacheControl?.NoStore);
    }

    [Fact]
    public async Task GetBusService_FromAllowedOrigin_StillCarriesCacheControl()
    {
        await SeedAsync();
        using var request = new HttpRequestMessage(HttpMethod.Get, "/api/v1/bus-services/102M");
        request.Headers.Add("Origin", "http://localhost:5173");

        var response = await _client.SendAsync(request);

        Assert.Equal("http://localhost:5173", response.Headers.GetValues("Access-Control-Allow-Origin").Single());
        AssertPublicForAnHour(response);
    }

    private static void AssertPublicForAnHour(HttpResponseMessage response)
    {
        var cacheControl = response.Headers.CacheControl;
        Assert.NotNull(cacheControl);
        Assert.True(cacheControl.Public);
        Assert.False(cacheControl.Private);
        Assert.False(cacheControl.NoStore);
        Assert.Equal(TimeSpan.FromHours(1), cacheControl.MaxAge);
    }

    private async Task SeedAsync()
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
}
