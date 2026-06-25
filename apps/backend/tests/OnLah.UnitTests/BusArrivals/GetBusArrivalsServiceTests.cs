using NSubstitute;
using OnLah.Application.BusArrivals;
using OnLah.Application.Common.Interfaces;
using OnLah.Domain.Common;
using Xunit;

namespace OnLah.UnitTests.BusArrivals;

public sealed class GetBusArrivalsServiceTests
{
    private readonly ILtaBusClient _ltaBusClient = Substitute.For<ILtaBusClient>();
    private readonly GetBusArrivalsService _sut;

    public GetBusArrivalsServiceTests() => _sut = new GetBusArrivalsService(_ltaBusClient);

    [Fact]
    public async Task GetAsync_ValidStopCode_ReturnsArrivalsFromLtaClient()
    {
        var arrivals = new List<BusArrival>
        {
            new("15", "GAS", MakeTiming(3), null, null)
        };
        _ltaBusClient.GetArrivalsAsync("83139", Arg.Any<CancellationToken>())
            .Returns(Result.Success<IReadOnlyList<BusArrival>>(arrivals));

        var result = await _sut.GetAsync("83139");

        Assert.True(result.IsSuccess);
        Assert.Single(result.Value!);
        Assert.Equal("15", result.Value![0].ServiceNo);
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

    private static ArrivalTiming MakeTiming(int etaMinutes) =>
        new(DateTimeOffset.UtcNow.AddMinutes(etaMinutes), CrowdLevel.SeatsAvailable, false, BusType.SingleDeck, true);
}
