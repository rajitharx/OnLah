using NSubstitute;
using OnLah.Application.BusArrivals;
using OnLah.Application.Common.Interfaces;
using OnLah.Domain.Common;
using OnLah.UnitTests.Common;
using Xunit;

namespace OnLah.UnitTests.BusArrivals;

public sealed class CachedBusArrivalClientTests
{
    private static readonly IReadOnlyList<BusArrival> Arrivals = [new("15", "GAS", null, null, null)];

    private readonly ILtaBusClient _inner = Substitute.For<ILtaBusClient>();
    private readonly FakeClock _clock = new();
    private readonly CachedBusArrivalClient _sut;

    public CachedBusArrivalClientTests()
    {
        _sut = new CachedBusArrivalClient(_inner, _clock, TimeSpan.FromSeconds(15));
        _inner.GetArrivalsAsync(Arg.Any<string>(), Arg.Any<CancellationToken>())
            .Returns(Task.FromResult(Result.Success(Arrivals)));
    }

    [Fact]
    public async Task GetArrivalsAsync_SecondCallWithinTimeToLive_ServesCachedResult()
    {
        await _sut.GetArrivalsAsync("83139");
        _clock.UtcNow = _clock.UtcNow.AddSeconds(10);

        var result = await _sut.GetArrivalsAsync("83139");

        Assert.True(result.IsSuccess);
        await _inner.Received(1).GetArrivalsAsync("83139", Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task GetArrivalsAsync_CallAfterTimeToLive_FetchesFromLtaAgain()
    {
        await _sut.GetArrivalsAsync("83139");
        _clock.UtcNow = _clock.UtcNow.AddSeconds(16);

        await _sut.GetArrivalsAsync("83139");

        await _inner.Received(2).GetArrivalsAsync("83139", Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task GetArrivalsAsync_ConcurrentCallsForSameStop_FetchesFromLtaOnce()
    {
        var pending = new TaskCompletionSource<Result<IReadOnlyList<BusArrival>>>();
        _inner.GetArrivalsAsync(Arg.Any<string>(), Arg.Any<CancellationToken>()).Returns(pending.Task);

        var first = _sut.GetArrivalsAsync("83139");
        var second = _sut.GetArrivalsAsync("83139");
        pending.SetResult(Result.Success(Arrivals));
        await Task.WhenAll(first, second);

        await _inner.Received(1).GetArrivalsAsync("83139", Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task GetArrivalsAsync_LtaFailure_IsNotCached()
    {
        var unavailable = Result.Failure<IReadOnlyList<BusArrival>>(DomainError.Unavailable("BusArrival"));
        _inner.GetArrivalsAsync(Arg.Any<string>(), Arg.Any<CancellationToken>())
            .Returns(Task.FromResult(unavailable), Task.FromResult(Result.Success(Arrivals)));

        var failed = await _sut.GetArrivalsAsync("83139");
        var recovered = await _sut.GetArrivalsAsync("83139");

        Assert.True(failed.IsFailure);
        Assert.True(recovered.IsSuccess);
        await _inner.Received(2).GetArrivalsAsync("83139", Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task GetArrivalsAsync_DifferentStops_FetchesEachStopSeparately()
    {
        await _sut.GetArrivalsAsync("83139");

        await _sut.GetArrivalsAsync("01012");

        await _inner.Received(1).GetArrivalsAsync("83139", Arg.Any<CancellationToken>());
        await _inner.Received(1).GetArrivalsAsync("01012", Arg.Any<CancellationToken>());
    }
}
