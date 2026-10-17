using NSubstitute;
using OnLah.Application.BusStops;
using OnLah.Domain.BusStops;
using Xunit;

namespace OnLah.UnitTests.BusStops;

public sealed class SearchBusStopsServiceTests
{
    private readonly IBusStopRepository _repository = Substitute.For<IBusStopRepository>();
    private readonly SearchBusStopsService _sut;

    public SearchBusStopsServiceTests() => _sut = new SearchBusStopsService(_repository);

    [Fact]
    public async Task SearchAsync_MatchingStops_ReturnsDtosWithoutDistance()
    {
        var stop = BusStop.Create("83139", "Sengkang Av 2", "Blk 123", 1.39, 103.89);
        _repository.SearchAsync("8313", 20, Arg.Any<CancellationToken>())
            .Returns(new List<BusStop> { stop });

        var result = await _sut.SearchAsync("8313");

        Assert.True(result.IsSuccess);
        var dto = Assert.Single(result.Value!);
        Assert.Equal("83139", dto.BusStopCode);
        Assert.Equal(0, dto.DistanceMeters);
    }

    [Fact]
    public async Task SearchAsync_NoMatches_ReturnsEmptyList()
    {
        _repository.SearchAsync("zzz", 20, Arg.Any<CancellationToken>())
            .Returns(new List<BusStop>());

        var result = await _sut.SearchAsync("zzz");

        Assert.True(result.IsSuccess);
        Assert.Empty(result.Value!);
    }
}
