using System.Net;
using System.Net.Http.Json;
using OnLah.IntegrationTests.Common;
using Xunit;

namespace OnLah.IntegrationTests.Endpoints;

public sealed class BusStopQueryEndpointTests(ApiFactory factory) : IClassFixture<ApiFactory>
{
    private readonly HttpClient _client = factory.CreateClient();

    [Fact]
    public async Task NearbyStops_RadiusAboveLimit_Returns422()
    {
        var response = await _client.GetAsync("/api/v1/bus-stops/nearby?lat=1.39&lng=103.89&radiusMeters=6000");

        Assert.Equal(HttpStatusCode.UnprocessableEntity, response.StatusCode);
    }

    [Fact]
    public async Task NearbyStops_EmptyDatabase_Returns200WithEmptyList()
    {
        var stops = await _client.GetFromJsonAsync<List<object>>(
            "/api/v1/bus-stops/nearby?lat=1.39&lng=103.89&radiusMeters=500");

        Assert.NotNull(stops);
        Assert.Empty(stops);
    }

    [Fact]
    public async Task SearchStops_QueryTooShort_Returns422()
    {
        var response = await _client.GetAsync("/api/v1/bus-stops/search?query=8");

        Assert.Equal(HttpStatusCode.UnprocessableEntity, response.StatusCode);
    }

    [Fact]
    public async Task SearchStops_NoMatches_Returns200WithEmptyList()
    {
        var stops = await _client.GetFromJsonAsync<List<object>>("/api/v1/bus-stops/search?query=zzzz");

        Assert.NotNull(stops);
        Assert.Empty(stops);
    }
}
