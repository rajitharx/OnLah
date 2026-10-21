using OnLah.Application.RouteTracker;
using OnLah.Domain.BusNetwork;
using OnLah.Domain.Common;
using Xunit;

namespace OnLah.UnitTests.RouteTracker;

public sealed class ServiceRouteTests
{
    [Fact]
    public void Resolve_StopOnOneDirectionOnly_ReturnsThatDirection()
    {
        var route = ServiceRoute.From([R(1, 1, "A"), R(1, 2, "B"), R(1, 3, "C"), R(2, 1, "C"), R(2, 2, "X")]);

        var result = route.Resolve("B", requestedDirection: null, destinationCode: null, visitNumber: null);

        Assert.Equal(1, result.Value!.Direction);
        Assert.Equal(1, result.Value.UserIndex);
        Assert.Equal(3, result.Value.Stops.Count);
    }

    [Fact]
    public void Resolve_StopOnBothDirections_UsesTheDestinationToPickTheDirection()
    {
        var route = BothWays();

        var result = route.Resolve("B", requestedDirection: null, destinationCode: "A", visitNumber: null);

        Assert.Equal(2, result.Value!.Direction);
    }

    [Fact]
    public void Resolve_StopOnBothDirectionsWithNoDestination_FallsBackToTheFirstDirection()
    {
        var result = BothWays().Resolve("B", requestedDirection: null, destinationCode: null, visitNumber: null);

        Assert.Equal(1, result.Value!.Direction);
    }

    [Fact]
    public void Resolve_RequestedDirection_OverridesDetection()
    {
        var result = BothWays().Resolve("B", requestedDirection: 2, destinationCode: "C", visitNumber: null);

        Assert.Equal(2, result.Value!.Direction);
    }

    [Fact]
    public void Resolve_RequestedDirectionThatMissesTheStop_ReturnsNotFound()
    {
        var route = ServiceRoute.From([R(1, 1, "A"), R(1, 2, "B"), R(2, 1, "C"), R(2, 2, "D")]);

        var result = route.Resolve("B", requestedDirection: 2, destinationCode: null, visitNumber: null);

        Assert.True(result.IsFailure);
        Assert.Equal(ErrorKind.NotFound, result.Error.Kind);
    }

    [Fact]
    public void Resolve_StopNotOnTheService_ReturnsNotFound()
    {
        var result = BothWays().Resolve("ZZ", requestedDirection: null, destinationCode: null, visitNumber: null);

        Assert.Equal(ErrorKind.NotFound, result.Error.Kind);
    }

    [Fact]
    public void Resolve_LoopStopVisitedTwice_UsesTheVisitNumber()
    {
        var loop = ServiceRoute.From([R(1, 1, "A"), R(1, 2, "B"), R(1, 3, "C"), R(1, 4, "A")]);

        var second = loop.Resolve("A", requestedDirection: null, destinationCode: null, visitNumber: 2);
        var first = loop.Resolve("A", requestedDirection: null, destinationCode: null, visitNumber: 1);

        Assert.Equal(3, second.Value!.UserIndex);
        Assert.Equal(0, first.Value!.UserIndex);
    }

    [Fact]
    public void Resolve_VisitNumberBeyondTheVisits_UsesTheLastVisit()
    {
        var loop = ServiceRoute.From([R(1, 1, "A"), R(1, 2, "B"), R(1, 3, "A")]);

        var result = loop.Resolve("A", requestedDirection: null, destinationCode: null, visitNumber: 5);

        Assert.Equal(2, result.Value!.UserIndex);
    }

    [Fact]
    public void Resolve_UnorderedRows_AreReturnedInStopSequence()
    {
        var route = ServiceRoute.From([R(1, 3, "C"), R(1, 1, "A"), R(1, 2, "B")]);

        var result = route.Resolve("B", requestedDirection: null, destinationCode: null, visitNumber: null);

        Assert.Equal(["A", "B", "C"], result.Value!.Stops.Select(s => s.BusStopCode));
    }

    private static ServiceRoute BothWays() =>
        ServiceRoute.From([R(1, 1, "A"), R(1, 2, "B"), R(1, 3, "C"), R(2, 1, "C"), R(2, 2, "B"), R(2, 3, "A")]);

    private static BusRoute R(int direction, int sequence, string stopCode) =>
        BusRoute.Create("197", direction, sequence, stopCode, "SBST", sequence * 0.5, "0530", "2330", "0530", "2330", "0530", "2330");
}
