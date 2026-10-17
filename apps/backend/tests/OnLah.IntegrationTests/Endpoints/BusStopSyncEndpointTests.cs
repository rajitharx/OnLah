using System.Net;
using System.Net.Http.Json;
using NSubstitute;
using OnLah.Application.Common.Interfaces;
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

    private sealed record SyncBody(int StopsSynced);

    private static async IAsyncEnumerable<LtaBusStop> StreamOf(params LtaBusStop[] stops)
    {
        foreach (var stop in stops)
            yield return stop;
        await Task.CompletedTask;
    }
}
