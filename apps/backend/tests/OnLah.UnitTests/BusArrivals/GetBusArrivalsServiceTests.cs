using Microsoft.Extensions.Logging.Abstractions;
using NSubstitute;
using NSubstitute.ExceptionExtensions;
using OnLah.Application.BusArrivals;
using OnLah.Application.Common.Interfaces;
using OnLah.Domain.BusNetwork;
using OnLah.Domain.BusStops;
using OnLah.Domain.Common;
using Xunit;

namespace OnLah.UnitTests.BusArrivals;

public sealed class GetBusArrivalsServiceTests
{
    private const string StopCode = "83139";
    private static readonly TimeSpan Sgt = TimeSpan.FromHours(8);

    private readonly ILtaBusClient _ltaBusClient = Substitute.For<ILtaBusClient>();
    private readonly IBusNetworkRepository _network = Substitute.For<IBusNetworkRepository>();
    private readonly IBusStopRepository _stops = Substitute.For<IBusStopRepository>();
    private readonly GetBusArrivalsService _sut;

    public GetBusArrivalsServiceTests()
    {
        _sut = new GetBusArrivalsService(_ltaBusClient, _network, _stops, NullLogger<GetBusArrivalsService>.Instance);
        _network.GetRoutesForStopAsync(StopCode, Arg.Any<CancellationToken>()).Returns([]);
        _network.GetServicesForStopAsync(StopCode, Arg.Any<CancellationToken>()).Returns([]);
        _stops.GetByCodesAsync(Arg.Any<IEnumerable<string>>(), Arg.Any<CancellationToken>()).Returns([]);
    }

    [Fact]
    public async Task GetAsync_ValidStopCode_ReturnsArrivalsFromLtaClient()
    {
        GivenArrivals(new BusArrival("15", "GAS", Timing(12, 0), null, null));

        var result = await _sut.GetAsync(StopCode);

        Assert.True(result.IsSuccess);
        Assert.Equal("15", Assert.Single(result.Value!).ServiceNo);
    }

    [Fact]
    public async Task GetAsync_LtaClientReturnsError_PropagatesError()
    {
        var error = DomainError.NotFound("BusStop");
        _ltaBusClient.GetArrivalsAsync("00000", Arg.Any<CancellationToken>())
            .Returns(Result.Failure<IReadOnlyList<BusArrival>>(error));

        var result = await _sut.GetAsync("00000");

        Assert.True(result.IsFailure);
        Assert.Equal(error.Code, result.Error.Code);
    }

    [Fact]
    public async Task GetAsync_EtaNearTheLastBusTime_FlagsOnlyThatTiming()
    {
        GivenRoutes(Route("15", wdLast: "2330"));
        GivenArrivals(new BusArrival("15", "GAS", Timing(23, 10), Timing(23, 32), null));

        var service = Assert.Single((await _sut.GetAsync(StopCode)).Value!);

        Assert.False(service.NextBus!.IsLastBus);
        Assert.True(service.NextBus2!.IsLastBus);
        Assert.Null(service.NextBus3);
    }

    [Fact]
    public async Task GetAsync_TwoTimingsNearTheLastBusTime_FlagsOnlyTheLaterOne()
    {
        GivenRoutes(Route("15", wdLast: "2330"));
        GivenArrivals(new BusArrival("15", "GAS", Timing(23, 27), Timing(23, 36), null));

        var service = Assert.Single((await _sut.GetAsync(StopCode)).Value!);

        Assert.False(service.NextBus!.IsLastBus);
        Assert.True(service.NextBus2!.IsLastBus);
    }

    [Fact]
    public async Task GetAsync_ServiceWithNoRoutesAtTheStop_IsNotLastBus()
    {
        GivenRoutes(Route("15", wdLast: "2330"));
        GivenArrivals(new BusArrival("99", "GAS", Timing(23, 32), null, null));

        var service = Assert.Single((await _sut.GetAsync(StopCode)).Value!);

        Assert.False(service.NextBus!.IsLastBus);
    }

    [Fact]
    public async Task GetAsync_LowercaseServiceNumber_MatchesTheRoute()
    {
        GivenRoutes(Route("10E", wdLast: "2330"));
        GivenArrivals(new BusArrival("10e", "SBST", Timing(23, 32), null, null));

        var service = Assert.Single((await _sut.GetAsync(StopCode)).Value!);

        Assert.Equal("10e", service.ServiceNo);
        Assert.True(service.NextBus!.IsLastBus);
    }

    [Fact]
    public async Task GetAsync_ServiceStopsHereInBothDirections_AnyDirectionsLastBusCounts()
    {
        GivenRoutes(Route("15", wdLast: "2200", direction: 1), Route("15", wdLast: "2330", direction: 2));
        GivenArrivals(new BusArrival("15", "GAS", Timing(23, 32), null, null));

        var service = Assert.Single((await _sut.GetAsync(StopCode)).Value!);

        Assert.True(service.NextBus!.IsLastBus);
    }

    [Fact]
    public async Task GetAsync_RouteLookupFails_ReturnsArrivalsWithoutLastBus()
    {
        _network.GetRoutesForStopAsync(StopCode, Arg.Any<CancellationToken>())
            .ThrowsAsync(new InvalidOperationException("database down"));
        GivenArrivals(new BusArrival("15", "GAS", Timing(23, 32), null, null));

        var result = await _sut.GetAsync(StopCode);

        Assert.True(result.IsSuccess);
        Assert.False(Assert.Single(result.Value!).NextBus!.IsLastBus);
    }

    [Fact]
    public async Task GetAsync_ServiceWithKnownEnds_ReturnsOriginAndDestinationNames()
    {
        GivenServices(Direction("372", 1, "11111", "22222"));
        GivenStops(Stop("11111", "Bishan Int"), Stop("22222", "Changi Airport"));
        GivenArrivals(new BusArrival("372", "SBST", Timing(12, 0), null, null));

        var service = Assert.Single((await _sut.GetAsync(StopCode)).Value!);

        var route = Assert.Single(service.Routes);
        Assert.Equal(new ArrivalRoute("Bishan Int", "Changi Airport", "22222"), route);
    }

    [Fact]
    public async Task GetAsync_ServiceStopsHereInBothDirections_ReturnsBothRoutes()
    {
        GivenServices(Direction("15", 1, "11111", "22222"), Direction("15", 2, "22222", "11111"));
        GivenStops(Stop("11111", "A"), Stop("22222", "B"));
        GivenArrivals(new BusArrival("15", "GAS", Timing(12, 0), null, null));

        var service = Assert.Single((await _sut.GetAsync(StopCode)).Value!);

        Assert.Equal([new ArrivalRoute("A", "B", "22222"), new ArrivalRoute("B", "A", "11111")], service.Routes);
    }

    [Fact]
    public async Task GetAsync_LowercaseServiceNumber_MatchesTheDirection()
    {
        GivenServices(Direction("10E", 1, "11111", "22222"));
        GivenStops(Stop("11111", "A"), Stop("22222", "B"));
        GivenArrivals(new BusArrival("10e", "SBST", Timing(12, 0), null, null));

        var service = Assert.Single((await _sut.GetAsync(StopCode)).Value!);

        Assert.Single(service.Routes);
    }

    [Fact]
    public async Task GetAsync_EndStopMissingFromStopList_OmitsThatRoute()
    {
        GivenServices(Direction("372", 1, "11111", "99999"));
        GivenStops(Stop("11111", "A"));
        GivenArrivals(new BusArrival("372", "SBST", Timing(12, 0), null, null));

        var service = Assert.Single((await _sut.GetAsync(StopCode)).Value!);

        Assert.Empty(service.Routes);
    }

    [Fact]
    public async Task GetAsync_ServiceLookupFails_ReturnsArrivalsWithoutRoutes()
    {
        _network.GetServicesForStopAsync(StopCode, Arg.Any<CancellationToken>())
            .ThrowsAsync(new InvalidOperationException("database down"));
        GivenArrivals(new BusArrival("15", "GAS", Timing(12, 0), null, null));

        var result = await _sut.GetAsync(StopCode);

        Assert.True(result.IsSuccess);
        Assert.Empty(Assert.Single(result.Value!).Routes);
    }

    private void GivenServices(params BusService[] services) =>
        _network.GetServicesForStopAsync(StopCode, Arg.Any<CancellationToken>()).Returns(services);

    private void GivenStops(params BusStop[] stops) =>
        _stops.GetByCodesAsync(Arg.Any<IEnumerable<string>>(), Arg.Any<CancellationToken>()).Returns(stops);

    private static BusService Direction(string serviceNo, int direction, string originCode, string destinationCode) =>
        BusService.Create(serviceNo, direction, "SBST", "TRUNK", originCode, destinationCode, null, null, null, null, null);

    private static BusStop Stop(string code, string description) => BusStop.Create(code, "Road", description, 1.3, 103.8);

    private void GivenArrivals(params BusArrival[] arrivals) =>
        _ltaBusClient.GetArrivalsAsync(StopCode, Arg.Any<CancellationToken>())
            .Returns(Result.Success<IReadOnlyList<BusArrival>>(arrivals));

    private void GivenRoutes(params BusRoute[] routes) =>
        _network.GetRoutesForStopAsync(StopCode, Arg.Any<CancellationToken>()).Returns(routes);

    private static ArrivalTiming Timing(int hour, int minute) =>
        new(new DateTimeOffset(2026, 10, 21, hour, minute, 0, Sgt), CrowdLevel.SeatsAvailable, false, BusType.SingleDeck, true, false);

    private static BusRoute Route(string serviceNo, string wdLast, int direction = 1) =>
        BusRoute.Create(serviceNo, direction, 1, StopCode, "SBST", 0, "0530", wdLast, "0600", "2330", "0630", "2300");
}
