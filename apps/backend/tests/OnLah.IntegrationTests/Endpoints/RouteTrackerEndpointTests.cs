using System.Net;
using System.Net.Http.Json;
using Microsoft.Extensions.DependencyInjection;
using NSubstitute;
using OnLah.Application.BusArrivals;
using OnLah.Application.RouteTracker;
using OnLah.Domain.BusNetwork;
using OnLah.Domain.BusStops;
using OnLah.Domain.Common;
using OnLah.Infrastructure.Persistence;
using OnLah.IntegrationTests.Common;
using Xunit;

namespace OnLah.IntegrationTests.Endpoints;

public sealed class RouteTrackerEndpointTests(ApiFactory factory) : IClassFixture<ApiFactory>
{
    private const string Url = "/api/v1/route-tracker?busStopCode=90003&serviceNo=TRK1";

    private readonly HttpClient _client = factory.CreateClient();

    [Fact]
    public async Task GetRouteTracker_KnownStopAndService_ReturnsStopsBusAndStopsAway()
    {
        await SeedAsync();
        ReturnLiveBus();

        var response = await _client.GetAsync(Url);
        var body = await response.Content.ReadFromJsonAsync<TrackerBody>();

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("live", body!.Status);
        Assert.Equal(2, body.UserStopIndex);
        Assert.Equal(3, body.Stops.Count);
        Assert.Equal("Terminus", body.Destination.Description);
        Assert.Equal(2, body.Buses[0].StopsAway);
        Assert.Equal("90001", body.Buses[0].NearestStopCode);
    }

    [Fact]
    public async Task GetRouteTracker_LiveData_IsNotCacheable()
    {
        await SeedAsync();
        ReturnLiveBus();

        var response = await _client.GetAsync(Url);

        Assert.True(response.Headers.CacheControl?.NoStore);
    }

    [Theory]
    [InlineData("busStopCode=9003&serviceNo=TRK1")]
    [InlineData("busStopCode=abcde&serviceNo=TRK1")]
    [InlineData("busStopCode=90003&serviceNo=T-1")]
    [InlineData("busStopCode=90003&serviceNo=TRK1&direction=3")]
    [InlineData("busStopCode=90003&serviceNo=TRK1&direction=0")]
    [InlineData("busStopCode=90003&serviceNo=TRK1&direction=-1")]
    [InlineData("busStopCode=90003&serviceNo=ABCDEFGHIJK")]
    [InlineData("busStopCode=%D9%A9%D9%A0%D9%A0%D9%A0%D9%A3&serviceNo=TRK1")]
    [InlineData("busStopCode=90003%0A&serviceNo=TRK1")]
    [InlineData("busStopCode=90003&serviceNo=TRK1%0A")]
    public async Task GetRouteTracker_InvalidInput_Returns422(string query)
    {
        var response = await _client.GetAsync($"/api/v1/route-tracker?{query}");

        Assert.Equal(HttpStatusCode.UnprocessableEntity, response.StatusCode);
    }

    [Fact]
    public async Task GetRouteTracker_UnknownService_Returns404()
    {
        var response = await _client.GetAsync("/api/v1/route-tracker?busStopCode=90003&serviceNo=NOSUCH9");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task GetRouteTracker_StopNotOnTheService_Returns404()
    {
        await SeedAsync();

        var response = await _client.GetAsync("/api/v1/route-tracker?busStopCode=12345&serviceNo=TRK1");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task GetRouteTracker_LtaUnavailable_Returns502()
    {
        await SeedAsync();
        factory.LtaLiveArrivalClient.GetLiveArrivalsAsync("90003", Arg.Any<CancellationToken>())
            .Returns(DomainError.Unavailable("BusArrival"));

        var response = await _client.GetAsync(Url);

        Assert.Equal(HttpStatusCode.BadGateway, response.StatusCode);
    }

    private void ReturnLiveBus() =>
        factory.LtaLiveArrivalClient.GetLiveArrivalsAsync("90003", Arg.Any<CancellationToken>())
            .Returns(new List<LiveServiceArrival>
            {
                new("TRK1",
                [
                    new LiveBus(DateTimeOffset.UtcNow.AddMinutes(6), true, new GeoPoint(1.3011, 103.8), null, 1,
                        CrowdLevel.SeatsAvailable, true, BusType.SingleDeck),
                ]),
            });

    private async Task SeedAsync()
    {
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<OnLahDbContext>();
        if (db.BusRoutes.Any(r => r.ServiceNo == "TRK1"))
            return;

        db.BusStops.AddRange(
            BusStop.Create("90001", "Road", "Start", 1.3010, 103.8),
            BusStop.Create("90002", "Road", "Middle", 1.3030, 103.8),
            BusStop.Create("90003", "Road", "Terminus", 1.3050, 103.8));
        db.BusRoutes.AddRange(
            Route(1, "90001"), Route(2, "90002"), Route(3, "90003"));
        await db.SaveChangesAsync();
    }

    private static BusRoute Route(int sequence, string stopCode) =>
        BusRoute.Create("TRK1", 1, sequence, stopCode, "SBST", sequence * 0.4, "0000", "2359", "0000", "2359", "0000", "2359");

    private sealed record TrackerBody(
        string Status,
        int UserStopIndex,
        StopBody Destination,
        IReadOnlyList<StopBody> Stops,
        IReadOnlyList<BusBody> Buses);

    private sealed record StopBody(string BusStopCode, string Description);

    private sealed record BusBody(int? StopsAway, string? NearestStopCode);
}
