using OnLah.Domain.Common;
using Xunit;

namespace OnLah.UnitTests.Common;

public sealed class GeoPointTests
{
    [Fact]
    public void DistanceMetersTo_OneMillidegreeOfLatitude_ReturnsAbout111Metres()
    {
        var a = new GeoPoint(1.300, 103.800);
        var b = new GeoPoint(1.301, 103.800);

        var distance = a.DistanceMetersTo(b);

        Assert.InRange(distance, 110, 112.5);
    }

    [Fact]
    public void DistanceMetersTo_SamePoint_ReturnsZero()
    {
        var point = new GeoPoint(1.39, 103.89);

        Assert.Equal(0, point.DistanceMetersTo(point), precision: 6);
    }

    [Theory]
    [InlineData(1.3915, 103.8959, true)]
    [InlineData(0.0, 0.0, false)]
    [InlineData(51.5, -0.12, false)]
    public void IsWithinSingapore_Coordinates_MatchesExpectation(double latitude, double longitude, bool expected)
    {
        Assert.Equal(expected, new GeoPoint(latitude, longitude).IsWithinSingapore);
    }
}
