using System.Net.Http.Json;
using Microsoft.Extensions.DependencyInjection;
using OnLah.Domain.BusStops;
using OnLah.IntegrationTests.Common;
using Xunit;

namespace OnLah.IntegrationTests.Endpoints;

public sealed class BusStopSearchEndpointTests(ApiFactory factory) : IClassFixture<ApiFactory>, IAsyncLifetime
{
    private readonly HttpClient _client = factory.CreateClient();

    public async Task InitializeAsync()
    {
        using var scope = factory.Services.CreateScope();
        await scope.ServiceProvider.GetRequiredService<IBusStopRepository>().ReplaceAllAsync(
        [
            Stop("01012", "Hotel Grand Pacific", "Victoria St"),
            Stop("08137", "Orchard Plaza", "Orchard Rd"),
            Stop("41019", "Bt Timah Plaza", "Jln Anak Bukit"),
            Stop("40281", "Blk 467B", "Bukit Batok West Avenue 9"),
            Stop("10121", "Opp Blk 1", "Jln Bt Merah"),
            Stop("80251", "Kallang Stn", "Sims Ave"),
        ]);
    }

    public Task DisposeAsync() => Task.CompletedTask;

    [Theory]
    [InlineData("Victoria", "01012")]
    [InlineData("Victoria St", "01012")]
    [InlineData("Victoria Street", "01012")]
    [InlineData("Orchard Rd", "08137")]
    [InlineData("Orchard Road", "08137")]
    [InlineData("Bukit Timah", "41019")]
    [InlineData("Bt Batok", "40281")]
    [InlineData("Jalan Bukit Merah", "10121")]
    [InlineData("Opposite Block 1", "10121")]
    [InlineData("hotel grand pac", "01012")]
    public async Task SearchStops_NameOrRoadInAnySpelling_FindsTheStop(string query, string expectedCode)
    {
        var codes = await SearchAsync(query);

        Assert.Contains(expectedCode, codes);
    }

    [Fact]
    public async Task SearchStops_DigitsInsideTheCode_FindsStopsContainingThem()
    {
        var codes = await SearchAsync("1012");

        Assert.Equal(["01012", "10121"], codes);
    }

    [Fact]
    public async Task SearchStops_EveryWordMustMatch_LeavesOutStopsMatchingOnlySome()
    {
        var codes = await SearchAsync("Orchard Rd");

        Assert.Equal(["08137"], codes);
    }

    [Fact]
    public async Task SearchStops_SpelledOutWord_DoesNotMatchADifferentAbbreviation()
    {
        var codes = await SearchAsync("Kallang Street");

        Assert.Empty(codes);
    }

    private async Task<List<string>> SearchAsync(string query)
    {
        var stops = await _client.GetFromJsonAsync<List<StopBody>>(
            $"/api/v1/bus-stops/search?query={Uri.EscapeDataString(query)}");
        return stops!.Select(s => s.BusStopCode).ToList();
    }

    private static BusStop Stop(string code, string description, string road) =>
        BusStop.Create(code, road, description, 1.3, 103.8);

    private sealed record StopBody(string BusStopCode);
}
