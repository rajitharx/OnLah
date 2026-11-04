using NSubstitute;
using OnLah.Application.Common.Interfaces;
using OnLah.Application.TrainAlerts;
using OnLah.Domain.Common;
using OnLah.UnitTests.Common;
using Xunit;

namespace OnLah.UnitTests.TrainAlerts;

public sealed class CachedTrainAlertClientTests
{
    private static readonly TrainAlertsResult Normal = new(TrainServiceStatus.Normal, []);

    private readonly ILtaTrainAlertClient _inner = Substitute.For<ILtaTrainAlertClient>();
    private readonly FakeClock _clock = new();
    private readonly CachedTrainAlertClient _sut;

    public CachedTrainAlertClientTests()
    {
        _sut = new CachedTrainAlertClient(_inner, _clock, TimeSpan.FromSeconds(30));
        _inner.GetAlertsAsync(Arg.Any<CancellationToken>()).Returns(Task.FromResult(Result.Success(Normal)));
    }

    [Fact]
    public async Task GetAlertsAsync_SecondCallWithinTimeToLive_ServesCachedResult()
    {
        await _sut.GetAlertsAsync();
        _clock.UtcNow = _clock.UtcNow.AddSeconds(29);

        var result = await _sut.GetAlertsAsync();

        Assert.True(result.IsSuccess);
        await _inner.Received(1).GetAlertsAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task GetAlertsAsync_CallAtTimeToLive_FetchesFromLtaAgain()
    {
        await _sut.GetAlertsAsync();
        _clock.UtcNow = _clock.UtcNow.AddSeconds(30);

        await _sut.GetAlertsAsync();

        await _inner.Received(2).GetAlertsAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task GetAlertsAsync_ConcurrentCalls_FetchesFromLtaOnce()
    {
        var pending = new TaskCompletionSource<Result<TrainAlertsResult>>();
        _inner.GetAlertsAsync(Arg.Any<CancellationToken>()).Returns(pending.Task);

        var first = _sut.GetAlertsAsync();
        var second = _sut.GetAlertsAsync();
        pending.SetResult(Result.Success(Normal));
        await Task.WhenAll(first, second);

        await _inner.Received(1).GetAlertsAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task GetAlertsAsync_LtaFailure_IsNotCached()
    {
        var unavailable = Result.Failure<TrainAlertsResult>(DomainError.Unavailable("TrainAlerts"));
        _inner.GetAlertsAsync(Arg.Any<CancellationToken>())
            .Returns(Task.FromResult(unavailable), Task.FromResult(Result.Success(Normal)));

        var failed = await _sut.GetAlertsAsync();
        var recovered = await _sut.GetAlertsAsync();

        Assert.True(failed.IsFailure);
        Assert.True(recovered.IsSuccess);
        await _inner.Received(2).GetAlertsAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task GetAlertsAsync_LtaCallThrows_IsNotCached()
    {
        _inner.GetAlertsAsync(Arg.Any<CancellationToken>())
            .Returns(Task.FromException<Result<TrainAlertsResult>>(new HttpRequestException()),
                Task.FromResult(Result.Success(Normal)));

        await Assert.ThrowsAsync<HttpRequestException>(() => _sut.GetAlertsAsync());
        var recovered = await _sut.GetAlertsAsync();

        Assert.True(recovered.IsSuccess);
        await _inner.Received(2).GetAlertsAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task GetAlertsAsync_CallerCancelsWhileWaiting_DoesNotCancelTheSharedFetch()
    {
        var pending = new TaskCompletionSource<Result<TrainAlertsResult>>();
        _inner.GetAlertsAsync(Arg.Any<CancellationToken>()).Returns(pending.Task);
        using var cancelled = new CancellationTokenSource();

        var impatient = _sut.GetAlertsAsync(cancelled.Token);
        var patient = _sut.GetAlertsAsync();
        await cancelled.CancelAsync();
        pending.SetResult(Result.Success(Normal));

        await Assert.ThrowsAnyAsync<OperationCanceledException>(() => impatient);
        Assert.True((await patient).IsSuccess);
        await _inner.Received(1).GetAlertsAsync(Arg.Any<CancellationToken>());
    }
}
