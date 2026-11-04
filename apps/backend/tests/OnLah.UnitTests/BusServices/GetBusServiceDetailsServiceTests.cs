using NSubstitute;
using OnLah.Application.BusServices;
using OnLah.Domain.BusNetwork;
using OnLah.Domain.BusStops;
using OnLah.Domain.Common;
using Xunit;

namespace OnLah.UnitTests.BusServices;

public sealed class GetBusServiceDetailsServiceTests
{
    private readonly IBusNetworkRepository _network = Substitute.For<IBusNetworkRepository>();
    private readonly IBusStopRepository _stops = Substitute.For<IBusStopRepository>();
    private readonly GetBusServiceDetailsService _sut;

    public GetBusServiceDetailsServiceTests()
    {
        _sut = new GetBusServiceDetailsService(_network, _stops);
        _stops.GetByCodesAsync(Arg.Any<IEnumerable<string>>(), Arg.Any<CancellationToken>())
            .Returns(new List<BusStop>
            {
                BusStop.Create("64009", "Seletar Aerospace Dr", "Opp Seletar Stn", 1.39, 103.87),
                BusStop.Create("01012", "Victoria St", "Hotel Grand Pacific", 1.29, 103.85),
            });
    }

    [Fact]
    public async Task GetAsync_LoopService_ReturnsLoopDirectionWithOriginAndHours()
    {
        _network.GetServicesAsync("102", Arg.Any<CancellationToken>()).Returns(new List<BusService> { Service102() });
        _network.GetRoutesAsync("102", Arg.Any<CancellationToken>()).Returns(new List<BusRoute>
        {
            Route("102", 1, 1, "64009", "0530", "2355"),
            Route("102", 1, 2, "01012", "0531", "2356"),
            Route("102", 1, 3, "64009", "0540", "2358"),
        });

        var result = await _sut.GetAsync("102");

        Assert.True(result.IsSuccess);
        var direction = Assert.Single(result.Value!.Directions);
        Assert.True(direction.IsLoop);
        Assert.Equal("Seletar Aerospace Dr", direction.LoopDescription);
        Assert.Equal("64009", direction.Origin!.BusStopCode);
        Assert.Equal("Opp Seletar Stn", direction.Origin.Description);
        Assert.Equal(3, direction.StopCount);
        Assert.Equal("05:30", direction.Hours.Weekday!.First);
        Assert.Equal("23:55", direction.Hours.Weekday.Last);
    }

    [Fact]
    public async Task GetAsync_ReturnsPeakAndOffPeakFrequencyAsPublished()
    {
        _network.GetServicesAsync("102", Arg.Any<CancellationToken>()).Returns(new List<BusService> { Service102() });
        _network.GetRoutesAsync("102", Arg.Any<CancellationToken>()).Returns(new List<BusRoute>());

        var result = await _sut.GetAsync("102");

        var frequency = Assert.Single(result.Value!.Directions).Frequency;
        Assert.Equal("9-11", frequency.AmPeak);
        Assert.Equal("09-13", frequency.AmOffPeak);
        Assert.Equal("10-12", frequency.PmPeak);
        Assert.Equal("12-16", frequency.PmOffPeak);
    }

    [Fact]
    public async Task GetAsync_TwoDirections_ReturnsBothInDirectionOrder()
    {
        var outbound = Service102() with { Direction = 2, OriginCode = "01012", DestinationCode = "64009", LoopDesc = null };
        _network.GetServicesAsync("102", Arg.Any<CancellationToken>()).Returns(new List<BusService> { outbound, Service102() });
        _network.GetRoutesAsync("102", Arg.Any<CancellationToken>()).Returns(new List<BusRoute>
        {
            Route("102", 2, 1, "01012", "0600", "2300"),
            Route("102", 1, 1, "64009", "0530", "2355"),
        });

        var result = await _sut.GetAsync("102");

        Assert.Equal([1, 2], result.Value!.Directions.Select(d => d.Direction));
        Assert.False(result.Value.Directions[1].IsLoop);
    }

    [Fact]
    public async Task GetAsync_NoPublishedTime_ReturnsNullHours()
    {
        _network.GetServicesAsync("102", Arg.Any<CancellationToken>()).Returns(new List<BusService> { Service102() });
        _network.GetRoutesAsync("102", Arg.Any<CancellationToken>()).Returns(new List<BusRoute>
        {
            Route("102", 1, 1, "64009", "-", ""),
        });

        var result = await _sut.GetAsync("102");

        Assert.Null(Assert.Single(result.Value!.Directions).Hours.Weekday);
    }

    [Fact]
    public async Task GetAsync_OperatorsAreDistinctAcrossDirections()
    {
        var outbound = Service102() with { Direction = 2 };
        _network.GetServicesAsync("102", Arg.Any<CancellationToken>()).Returns(new List<BusService> { Service102(), outbound });
        _network.GetRoutesAsync("102", Arg.Any<CancellationToken>()).Returns(new List<BusRoute>());

        var result = await _sut.GetAsync("102");

        Assert.Equal(["SBST"], result.Value!.Operators);
    }

    [Fact]
    public async Task GetAsync_ServicePublishedInLowercase_FindsItAsGiven()
    {
        _network.GetServicesAsync("10e", Arg.Any<CancellationToken>()).Returns(new List<BusService> { Service102("10e") });
        _network.GetRoutesAsync("10e", Arg.Any<CancellationToken>()).Returns(new List<BusRoute> { Route("10e", 1, 1, "64009", "0530", "2355") });

        var result = await _sut.GetAsync("10e");

        Assert.True(result.IsSuccess);
        Assert.Equal("10e", result.Value!.ServiceNo);
        Assert.Equal(1, Assert.Single(result.Value.Directions).StopCount);
    }

    [Fact]
    public async Task GetAsync_LowercaseInputForUppercaseService_FallsBackToUppercase()
    {
        _network.GetServicesAsync("102m", Arg.Any<CancellationToken>()).Returns(new List<BusService>());
        _network.GetServicesAsync("102M", Arg.Any<CancellationToken>()).Returns(new List<BusService> { Service102("102M") });
        _network.GetRoutesAsync("102M", Arg.Any<CancellationToken>()).Returns(new List<BusRoute>());

        var result = await _sut.GetAsync("102m");

        Assert.True(result.IsSuccess);
        Assert.Equal("102M", result.Value!.ServiceNo);
    }

    [Fact]
    public async Task GetAsync_UnknownService_ReturnsNotFound()
    {
        _network.GetServicesAsync("999", Arg.Any<CancellationToken>()).Returns(new List<BusService>());

        var result = await _sut.GetAsync("999");

        Assert.True(result.IsFailure);
        Assert.Equal(ErrorKind.NotFound, result.Error.Kind);
    }

    private static BusService Service102(string serviceNo = "102") => BusService.Create(
        serviceNo: serviceNo,
        direction: 1,
        operatorCode: "SBST",
        category: "TRUNK",
        originCode: "64009",
        destinationCode: "64009",
        amPeakFreq: "9-11",
        amOffpeakFreq: "09-13",
        pmPeakFreq: "10-12",
        pmOffpeakFreq: "12-16",
        loopDesc: "Seletar Aerospace Dr");

    private static BusRoute Route(string serviceNo, int direction, int sequence, string stop, string wdFirst, string wdLast) =>
        BusRoute.Create(
            serviceNo: serviceNo,
            direction: direction,
            stopSequence: sequence,
            busStopCode: stop,
            operatorCode: "SBST",
            distance: sequence,
            wdFirst: wdFirst,
            wdLast: wdLast,
            satFirst: wdFirst,
            satLast: wdLast,
            sunFirst: wdFirst,
            sunLast: wdLast);
}
