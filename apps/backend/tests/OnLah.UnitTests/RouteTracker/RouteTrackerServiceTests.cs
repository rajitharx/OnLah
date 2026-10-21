using NSubstitute;
using OnLah.Application.BusArrivals;
using OnLah.Application.Common.Interfaces;
using OnLah.Application.RouteTracker;
using OnLah.Domain.BusNetwork;
using OnLah.Domain.BusStops;
using OnLah.Domain.Common;
using OnLah.UnitTests.Common;
using Xunit;

namespace OnLah.UnitTests.RouteTracker;

public sealed class RouteTrackerServiceTests
{
    private static readonly TimeSpan Sgt = TimeSpan.FromHours(8);

    private readonly IBusNetworkRepository _network = Substitute.For<IBusNetworkRepository>();
    private readonly IBusStopRepository _stops = Substitute.For<IBusStopRepository>();
    private readonly ILtaLiveArrivalClient _lta = Substitute.For<ILtaLiveArrivalClient>();
    private readonly FakeClock _clock = new() { UtcNow = Midday() };
    private readonly RouteTrackerService _sut;

    public RouteTrackerServiceTests()
    {
        _sut = new RouteTrackerService(_network, _stops, _lta, _clock, new StopsAwayCalculator());
        _network.GetRoutesAsync("197", Arg.Any<CancellationToken>()).Returns(OneWayRoute());
        _stops.GetByCodesAsync(Arg.Any<IEnumerable<string>>(), Arg.Any<CancellationToken>()).Returns(StopTable());
        Live(Bus(minutesAway: 6, at: 2));
    }

    [Fact]
    public async Task GetAsync_MonitoredBusNearAnEarlierStop_ReturnsLiveWithStopsAway()
    {
        var result = await _sut.GetAsync("10005", "197", direction: null);

        var tracker = result.Value!;
        Assert.Equal(TrackerStatus.Live, tracker.Status);
        Assert.Equal(4, tracker.UserStopIndex);
        Assert.Equal(5, tracker.Stops.Count);
        Assert.Equal("Terminus", tracker.Destination.Description);
        var bus = Assert.Single(tracker.Buses);
        Assert.Equal(3, bus.StopsAway);
        Assert.Equal("10002", bus.NearestStopCode);
        Assert.Equal(_clock.UtcNow, tracker.FetchedAt);
    }

    [Fact]
    public async Task GetAsync_UnmonitoredBus_ReturnsScheduledWithNoStopsAway()
    {
        Live(Bus(minutesAway: 6, at: null));

        var result = await _sut.GetAsync("10005", "197", direction: null);

        Assert.Equal(TrackerStatus.Scheduled, result.Value!.Status);
        Assert.Null(result.Value.Buses[0].StopsAway);
        Assert.False(result.Value.Buses[0].Monitored);
    }

    [Theory]
    [InlineData(30, 0, "Arr")]
    [InlineData(59, 0, "Arr")]
    [InlineData(239, 3, "3 min")]
    [InlineData(360, 6, "6 min")]
    public async Task GetAsync_EtaInSeconds_DropsSecondsAndRoundsDown(int seconds, int minutes, string label)
    {
        Live(Bus(seconds: seconds, at: 2));

        var result = await _sut.GetAsync("10005", "197", direction: null);

        Assert.Equal(minutes, result.Value!.Buses[0].EtaMinutes);
        Assert.Equal(label, result.Value.Buses[0].EtaLabel);
    }

    [Fact]
    public async Task GetAsync_BusAlreadyDue_ClampsTheEtaToZero()
    {
        Live(Bus(seconds: -45, at: 2));

        var result = await _sut.GetAsync("10005", "197", direction: null);

        Assert.Equal(0, result.Value!.Buses[0].EtaMinutes);
    }

    [Fact]
    public async Task GetAsync_NoBusesDuringOperatingHours_ReturnsNoEstimate()
    {
        Live();

        var result = await _sut.GetAsync("10005", "197", direction: null);

        Assert.Equal(TrackerStatus.NoEstimate, result.Value!.Status);
        Assert.Empty(result.Value.Buses);
    }

    [Fact]
    public async Task GetAsync_NoBusesOutsideOperatingHours_ReturnsNotInOperation()
    {
        _clock.UtcNow = new DateTimeOffset(2026, 10, 21, 3, 0, 0, Sgt);
        Live();

        var result = await _sut.GetAsync("10005", "197", direction: null);

        Assert.Equal(TrackerStatus.NotInOperation, result.Value!.Status);
    }

    [Fact]
    public async Task GetAsync_NoBusesAndTimesNotPublished_ReturnsNoEstimate()
    {
        _network.GetRoutesAsync("197", Arg.Any<CancellationToken>()).Returns(OneWayRoute(wdFirst: "-"));
        _clock.UtcNow = new DateTimeOffset(2026, 10, 21, 3, 0, 0, Sgt);
        Live();

        var result = await _sut.GetAsync("10005", "197", direction: null);

        Assert.Equal(TrackerStatus.NoEstimate, result.Value!.Status);
    }

    [Fact]
    public async Task GetAsync_ServiceNotInTheNetwork_ReturnsNotFound()
    {
        _network.GetRoutesAsync("999", Arg.Any<CancellationToken>()).Returns(new List<BusRoute>());

        var result = await _sut.GetAsync("10005", "999", direction: null);

        Assert.Equal(ErrorKind.NotFound, result.Error.Kind);
    }

    [Fact]
    public async Task GetAsync_ServiceNumberInLowercase_FallsBackToTheUppercaseServiceNumber()
    {
        _network.GetRoutesAsync("197m", Arg.Any<CancellationToken>()).Returns(new List<BusRoute>());
        _network.GetRoutesAsync("197M", Arg.Any<CancellationToken>()).Returns(OneWayRoute());

        var result = await _sut.GetAsync("10005", "197m", direction: null);

        Assert.True(result.IsSuccess);
    }

    [Fact]
    public async Task GetAsync_ServiceNumberAsPublishedInLowercase_IsFoundWithoutChangingItsCase()
    {
        _network.GetRoutesAsync("10e", Arg.Any<CancellationToken>()).Returns(OneWayRoute());

        var result = await _sut.GetAsync("10005", "10e", direction: null);

        Assert.True(result.IsSuccess);
        await _network.DidNotReceive().GetRoutesAsync("10E", Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task GetAsync_StopNotOnTheService_ReturnsNotFoundWithoutCallingLta()
    {
        var result = await _sut.GetAsync("99999", "197", direction: null);

        Assert.Equal(ErrorKind.NotFound, result.Error.Kind);
        await _lta.DidNotReceiveWithAnyArgs().GetLiveArrivalsAsync(default!, default);
    }

    [Fact]
    public async Task GetAsync_LtaUnavailable_PassesTheErrorThrough()
    {
        _lta.GetLiveArrivalsAsync("10005", Arg.Any<CancellationToken>())
            .Returns(DomainError.Unavailable("BusArrival"));

        var result = await _sut.GetAsync("10005", "197", direction: null);

        Assert.Equal(ErrorKind.Unavailable, result.Error.Kind);
    }

    [Fact]
    public async Task GetAsync_StopOnBothDirections_UsesTheBusDestinationToPickTheDirection()
    {
        _network.GetRoutesAsync("197", Arg.Any<CancellationToken>()).Returns(TwoWayRoute());
        Live(Bus(minutesAway: 4, at: null, destination: "10001"));

        var result = await _sut.GetAsync("10003", "197", direction: null);

        Assert.Equal(2, result.Value!.Direction);
        Assert.Equal("10001", result.Value.Stops[^1].BusStopCode);
    }

    [Fact]
    public async Task GetAsync_SeveralServicesAtTheStop_UsesOnlyTheRequestedOne()
    {
        _lta.GetLiveArrivalsAsync("10005", Arg.Any<CancellationToken>()).Returns(new List<LiveServiceArrival>
        {
            new("12", [Bus(minutesAway: 1, at: 1)]),
            new("197", [Bus(minutesAway: 9, at: 2)]),
        });

        var result = await _sut.GetAsync("10005", "197", direction: null);

        Assert.Equal(9, Assert.Single(result.Value!.Buses).EtaMinutes);
    }

    [Fact]
    public async Task GetAsync_StopMissingFromTheStopTable_StillListsItByCode()
    {
        _stops.GetByCodesAsync(Arg.Any<IEnumerable<string>>(), Arg.Any<CancellationToken>())
            .Returns(StopTable().Where(s => s.BusStopCode != "10003").ToList());

        var result = await _sut.GetAsync("10005", "197", direction: null);

        Assert.Equal("10003", result.Value!.Stops[2].Description);
    }

    [Fact]
    public async Task GetAsync_WheelchairDoubleDeckBusStanding_ReportsLtaCodes()
    {
        Live(Bus(minutesAway: 5, at: 2, load: CrowdLevel.StandingAvailable, wheelchair: true, type: BusType.DoubleDeck));

        var result = await _sut.GetAsync("10005", "197", direction: null);

        var bus = result.Value!.Buses[0];
        Assert.Equal("SDA", bus.Load);
        Assert.Equal("WAB", bus.Feature);
        Assert.Equal("DD", bus.Type);
    }

    private void Live(params LiveBus[] buses) =>
        _lta.GetLiveArrivalsAsync(Arg.Any<string>(), Arg.Any<CancellationToken>())
            .Returns(buses.Length == 0
                ? new List<LiveServiceArrival>()
                : [new LiveServiceArrival("197", buses)]);

    private LiveBus Bus(
        int minutesAway = 0,
        int? seconds = null,
        int? at = null,
        string? destination = null,
        CrowdLevel load = CrowdLevel.SeatsAvailable,
        bool wheelchair = false,
        BusType type = BusType.SingleDeck) =>
        new(
            _clock.UtcNow.AddSeconds(seconds ?? minutesAway * 60),
            IsMonitored: at is not null,
            Location: at is null ? null : new GeoPoint(Latitude(at.Value), 103.8),
            DestinationCode: destination,
            VisitNumber: 1,
            load,
            wheelchair,
            type);

    private static double Latitude(int sequence) => 1.30 + sequence * 0.002;

    private static DateTimeOffset Midday() => new(2026, 10, 21, 12, 0, 0, Sgt);

    private static List<BusStop> StopTable() =>
        Enumerable.Range(1, 5)
            .Select(i => BusStop.Create($"1000{i}", "Road", i == 5 ? "Terminus" : $"Stop {i}", Latitude(i), 103.8))
            .ToList();

    private static List<BusRoute> OneWayRoute(string wdFirst = "0530") =>
        Enumerable.Range(1, 5).Select(i => Row(1, i, $"1000{i}", wdFirst)).ToList();

    private static List<BusRoute> TwoWayRoute() =>
        [.. OneWayRoute(), .. Enumerable.Range(1, 5).Select(i => Row(2, i, $"1000{6 - i}", "0530"))];

    private static BusRoute Row(int direction, int sequence, string stopCode, string wdFirst) =>
        BusRoute.Create("197", direction, sequence, stopCode, "SBST", sequence * 0.5, wdFirst, "2330", "0530", "2330", "0530", "2330");
}
