using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.DependencyInjection;
using NSubstitute;
using OnLah.Application.BusArrivals;
using OnLah.Domain.BusNetwork;
using OnLah.Domain.Common;
using OnLah.IntegrationTests.Common;
using Xunit;

namespace OnLah.IntegrationTests.Endpoints;

public sealed class BusArrivalEndpointTests(ApiFactory factory) : IClassFixture<ApiFactory>
{
    private readonly HttpClient _client = factory.CreateClient();

    [Fact]
    public async Task GetBusArrivals_LtaUnavailable_Returns502()
    {
        factory.LtaBusClient.GetArrivalsAsync("83139", Arg.Any<CancellationToken>())
            .Returns(Result.Failure<IReadOnlyList<BusArrival>>(DomainError.Unavailable("BusArrival")));

        var response = await _client.GetAsync("/api/v1/bus-arrivals?stopCode=83139");

        Assert.Equal(HttpStatusCode.BadGateway, response.StatusCode);
    }

    [Fact]
    public async Task GetBusArrivals_StopNotFound_Returns404()
    {
        factory.LtaBusClient.GetArrivalsAsync("99999", Arg.Any<CancellationToken>())
            .Returns(Result.Failure<IReadOnlyList<BusArrival>>(DomainError.NotFound("BusStop")));

        var response = await _client.GetAsync("/api/v1/bus-arrivals?stopCode=99999");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task GetBusArrivals_InvalidStopCode_Returns422()
    {
        var response = await _client.GetAsync("/api/v1/bus-arrivals?stopCode=12");

        Assert.Equal(HttpStatusCode.UnprocessableEntity, response.StatusCode);
    }

    [Fact]
    public async Task GetBusArrivals_ValidStop_Returns200WithServices()
    {
        IReadOnlyList<BusArrival> services = [new("15", "GAS", null, null, null)];
        factory.LtaBusClient.GetArrivalsAsync("83139", Arg.Any<CancellationToken>())
            .Returns(Result.Success(services));

        var response = await _client.GetFromJsonAsync<BusArrivalsBody>("/api/v1/bus-arrivals?stopCode=83139");

        Assert.NotNull(response);
        Assert.Equal("83139", response.StopCode);
        Assert.Equal("15", Assert.Single(response.Services).ServiceNo);
    }

    [Fact]
    public async Task GetBusArrivals_EtaNearTheLastBusTime_ReturnsIsLastBusOnThatTiming()
    {
        using (var scope = factory.Services.CreateScope())
        {
            var network = scope.ServiceProvider.GetRequiredService<IBusNetworkRepository>();
            await network.ReplaceAllAsync([], [BusRoute.Create("15", 1, 3, "83140", "GAS", 1.2, "0530", "2330", "0530", "2330", "0530", "2330")]);
        }
        IReadOnlyList<BusArrival> services = [new("15", "GAS", Timing(23, 10), Timing(23, 32), null)];
        factory.LtaBusClient.GetArrivalsAsync("83140", Arg.Any<CancellationToken>())
            .Returns(Result.Success(services));

        using var body = JsonDocument.Parse(await _client.GetStringAsync("/api/v1/bus-arrivals?stopCode=83140"));

        var service = body.RootElement.GetProperty("services")[0];
        Assert.False(service.GetProperty("nextBus").GetProperty("isLastBus").GetBoolean());
        Assert.True(service.GetProperty("nextBus2").GetProperty("isLastBus").GetBoolean());
    }

    private static ArrivalTiming Timing(int hour, int minute) =>
        new(new DateTimeOffset(2026, 10, 21, hour, minute, 0, TimeSpan.FromHours(8)),
            CrowdLevel.SeatsAvailable, false, BusType.SingleDeck, true, false);

    private sealed record BusArrivalsBody(string StopCode, IReadOnlyList<BusArrival> Services);
}
