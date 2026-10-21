using OnLah.Application.RouteTracker;
using OnLah.Domain.Common;
using Xunit;

namespace OnLah.UnitTests.RouteTracker;

public sealed class StopsAwayCalculatorTests
{
    private const double StopSpacingDegrees = 0.002;
    private const double OneMetreInDegrees = 1 / 111_190.0;

    private readonly StopsAwayCalculator _sut = new();

    [Fact]
    public void Calculate_BusAtAnEarlierStop_ReturnsTheStopsBetween()
    {
        var stops = Line(10);

        var result = _sut.Calculate(stops, userSequence: 8, At(5));

        Assert.Equal(3, result.StopsAway);
        Assert.Equal("S5", result.NearestStopCode);
    }

    [Fact]
    public void Calculate_BusAtTheUsersStop_ReturnsZero()
    {
        var result = _sut.Calculate(Line(10), userSequence: 8, At(8));

        Assert.Equal(0, result.StopsAway);
    }

    [Fact]
    public void Calculate_BusBetweenStopsCloserToTheEarlierOne_SnapsToTheEarlierStop()
    {
        var between = new GeoPoint(Latitude(5) + StopSpacingDegrees * 0.3, 103.8);

        var result = _sut.Calculate(Line(10), userSequence: 8, between);

        Assert.Equal("S5", result.NearestStopCode);
        Assert.Equal(3, result.StopsAway);
    }

    [Fact]
    public void Calculate_BusJustPastTheUsersStop_IgnoresLaterStopsAndReturnsZero()
    {
        var pastUser = new GeoPoint(Latitude(8) + StopSpacingDegrees * 0.4, 103.8);

        var result = _sut.Calculate(Line(10), userSequence: 8, pastUser);

        Assert.Equal(0, result.StopsAway);
        Assert.Equal("S8", result.NearestStopCode);
    }

    [Fact]
    public void Calculate_TwoStopsEquallyNear_PicksTheOneCloserToTheUser()
    {
        var stops = Line(10).Select(s => s.Sequence == 6 ? s with { Location = At(5) with { Latitude = Latitude(5) + 10 * OneMetreInDegrees } } : s).ToList();
        var bus = new GeoPoint(Latitude(5) + 5 * OneMetreInDegrees, 103.8);

        var result = _sut.Calculate(stops, userSequence: 8, bus);

        Assert.Equal("S6", result.NearestStopCode);
        Assert.Equal(2, result.StopsAway);
    }

    [Fact]
    public void Calculate_BusFarFromEveryStop_ReturnsUnknown()
    {
        var offRoute = new GeoPoint(Latitude(5), 103.8 + 500 * OneMetreInDegrees);

        var result = _sut.Calculate(Line(10), userSequence: 8, offRoute);

        Assert.Null(result.StopsAway);
        Assert.Null(result.NearestStopCode);
    }

    [Fact]
    public void Calculate_BusJustBeforeTheRouteStart_SnapsToTheFirstStop()
    {
        var beforeStart = new GeoPoint(Latitude(1) - 300 * OneMetreInDegrees, 103.8);

        var result = _sut.Calculate(Line(10), userSequence: 8, beforeStart);

        Assert.Equal("S1", result.NearestStopCode);
        Assert.Equal(7, result.StopsAway);
    }

    [Fact]
    public void Calculate_BusWellBeforeTheRouteStart_ReturnsUnknown()
    {
        var depot = new GeoPoint(Latitude(1) - 900 * OneMetreInDegrees, 103.8);

        var result = _sut.Calculate(Line(10), userSequence: 8, depot);

        Assert.Null(result.StopsAway);
    }

    [Fact]
    public void Calculate_LoopWithTheBusAtTheSharedTerminus_ReturnsUnknownBecauseItIsAmbiguous()
    {
        var loop = Line(5).Append(Stop(6, At(1))).ToList();

        var result = _sut.Calculate(loop, userSequence: 6, At(1));

        Assert.Null(result.StopsAway);
    }

    [Fact]
    public void Calculate_LoopWithTheBusMidRoute_ReturnsTheStopsBetween()
    {
        var loop = Line(5).Append(Stop(6, At(1))).ToList();

        var result = _sut.Calculate(loop, userSequence: 6, At(4));

        Assert.Equal(2, result.StopsAway);
    }

    [Fact]
    public void Calculate_UnmonitoredBusWithNoLocation_ReturnsUnknown()
    {
        var result = _sut.Calculate(Line(10), userSequence: 8, bus: null);

        Assert.Null(result.StopsAway);
        Assert.Null(result.NearestStopCode);
    }

    [Fact]
    public void Calculate_StopsWithoutCoordinates_AreSkipped()
    {
        var stops = Line(10).Select(s => s.Sequence == 5 ? s with { Location = null } : s).ToList();

        var result = _sut.Calculate(stops, userSequence: 8, At(5));

        Assert.NotEqual("S5", result.NearestStopCode);
    }

    private static double Latitude(int sequence) => 1.30 + sequence * StopSpacingDegrees;

    private static GeoPoint At(int sequence) => new(Latitude(sequence), 103.8);

    private static RouteStop Stop(int sequence, GeoPoint location) =>
        new(sequence, $"S{sequence}", $"Stop {sequence}", "Road", sequence * 0.4, location);

    private static List<RouteStop> Line(int count) =>
        Enumerable.Range(1, count).Select(i => Stop(i, At(i))).ToList();
}
