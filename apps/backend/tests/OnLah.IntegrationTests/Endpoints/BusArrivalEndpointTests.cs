using System.Net;
using System.Net.Http.Json;
using NSubstitute;
using OnLah.Application.BusArrivals;
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

    private sealed record BusArrivalsBody(string StopCode, IReadOnlyList<BusArrival> Services);
}
