using NSubstitute;
using OnLah.Application.BusStops;
using OnLah.Domain.BusStops;
using Xunit;

namespace OnLah.UnitTests.BusStops;

public sealed class GetNearbyStopsServiceTests
{
    private readonly IBusStopRepository _repository = Substitute.For<IBusStopRepository>();
    private readonly GetNearbyStopsService _sut;

    // Sengkang MRT approximate coords
    private const double UserLat = 1.3920;
    private const double UserLng = 103.8950;

    public GetNearbyStopsServiceTests() => _sut = new GetNearbyStopsService(_repository);

    [Fact]
    public async Task GetNearbyAsync_StopsWithinRadius_ReturnsFilteredAndSortedByDistance()
    {
        var close = MakeStop("67009", UserLat + 0.001, UserLng);       // ~111m away
        var far = MakeStop("67199", UserLat + 0.01, UserLng);          // ~1110m away
        var outside = MakeStop("99999", UserLat + 0.1, UserLng);       // ~11km away
        _repository.GetAllAsync(Arg.Any<CancellationToken>()).Returns([close, far, outside]);

        var result = await _sut.GetNearbyAsync(UserLat, UserLng, 500);

        Assert.True(result.IsSuccess);
        Assert.Single(result.Value!);
        Assert.Equal("67009", result.Value![0].BusStopCode);
    }

    [Fact]
    public async Task GetNearbyAsync_NoStopsWithinRadius_ReturnsEmptyList()
    {
        var farStop = MakeStop("99999", UserLat + 1.0, UserLng);
        _repository.GetAllAsync(Arg.Any<CancellationToken>()).Returns([farStop]);

        var result = await _sut.GetNearbyAsync(UserLat, UserLng, 500);

        Assert.True(result.IsSuccess);
        Assert.Empty(result.Value!);
    }

    [Fact]
    public async Task GetNearbyAsync_MultipleStops_ReturnsSortedClosestFirst()
    {
        var first = MakeStop("A0001", UserLat + 0.001, UserLng);
        var second = MakeStop("A0002", UserLat + 0.002, UserLng);
        _repository.GetAllAsync(Arg.Any<CancellationToken>()).Returns([second, first]);

        var result = await _sut.GetNearbyAsync(UserLat, UserLng, 500);

        Assert.True(result.IsSuccess);
        Assert.Equal("A0001", result.Value![0].BusStopCode);
        Assert.Equal("A0002", result.Value![1].BusStopCode);
    }

    [Fact]
    public void Haversine_KnownDistance_ReturnsApproximateMetres()
    {
        // One degree of latitude ≈ 111,320 metres
        var distance = GetNearbyStopsService.Haversine(0, 0, 1, 0);

        Assert.InRange(distance, 110_000, 112_000);
    }

    private static BusStop MakeStop(string code, double lat, double lng) =>
        BusStop.Create(code, "Test Rd", "Test Stop", lat, lng);
}
