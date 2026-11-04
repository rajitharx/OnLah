using Microsoft.Extensions.Logging.Abstractions;
using NSubstitute;
using OnLah.Application.BusStops;
using OnLah.Application.Common.Interfaces;
using OnLah.Domain.BusStops;
using OnLah.Domain.Common;
using Xunit;

namespace OnLah.UnitTests.BusStops;

public sealed class BusStopSyncServiceTests
{
    private readonly ILtaBusStopClient _ltaClient = Substitute.For<ILtaBusStopClient>();
    private readonly IBusStopRepository _repository = Substitute.For<IBusStopRepository>();
    private readonly BusStopSyncService _sut;

    public BusStopSyncServiceTests()
    {
        _repository.ReplaceAllAsync(Arg.Any<IEnumerable<BusStop>>(), Arg.Any<CancellationToken>()).Returns(true);
        _sut = new BusStopSyncService(_ltaClient, _repository, NullLogger<BusStopSyncService>.Instance);
    }

    [Fact]
    public async Task SyncAsync_LtaReturnsStops_ReplacesRepositoryAndReturnsCount()
    {
        _ltaClient.GetAllStopsAsync(Arg.Any<CancellationToken>()).Returns(StreamOf(Stops(2)));

        var result = await _sut.SyncAsync();

        Assert.True(result.IsSuccess);
        Assert.Equal(2, result.Value);
        await _repository.Received(1).ReplaceAllAsync(
            Arg.Is<IEnumerable<BusStop>>(stops => stops.Count() == 2),
            Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task SyncAsync_LtaClientThrows_LeavesRepositoryUntouched()
    {
        _ltaClient.GetAllStopsAsync(Arg.Any<CancellationToken>()).Returns(ThrowingStream());

        await Assert.ThrowsAsync<HttpRequestException>(() => _sut.SyncAsync());

        await AssertNotReplaced();
    }

    [Fact]
    public async Task SyncAsync_LtaReturnsNoStops_FailsAndKeepsStoredStops()
    {
        _repository.CountAsync(Arg.Any<CancellationToken>()).Returns(5000);
        _ltaClient.GetAllStopsAsync(Arg.Any<CancellationToken>()).Returns(StreamOf());

        var result = await _sut.SyncAsync();

        Assert.True(result.IsFailure);
        Assert.Equal(ErrorKind.Unavailable, result.Error.Kind);
        await AssertNotReplaced();
    }

    [Fact]
    public async Task SyncAsync_LtaReturnsFarFewerStopsThanStored_FailsAndKeepsStoredStops()
    {
        _repository.CountAsync(Arg.Any<CancellationToken>()).Returns(10);
        _ltaClient.GetAllStopsAsync(Arg.Any<CancellationToken>()).Returns(StreamOf(Stops(5)));

        var result = await _sut.SyncAsync();

        Assert.True(result.IsFailure);
        Assert.Equal(ErrorKind.Unavailable, result.Error.Kind);
        await AssertNotReplaced();
    }

    [Fact]
    public async Task SyncAsync_LtaReturnsSlightlyFewerStopsThanStored_ReplacesRepository()
    {
        _repository.CountAsync(Arg.Any<CancellationToken>()).Returns(10);
        _ltaClient.GetAllStopsAsync(Arg.Any<CancellationToken>()).Returns(StreamOf(Stops(9)));

        var result = await _sut.SyncAsync();

        Assert.True(result.IsSuccess);
        Assert.Equal(9, result.Value);
    }

    [Fact]
    public async Task SyncAsync_AnotherSyncIsWriting_ReturnsConflict()
    {
        _repository.ReplaceAllAsync(Arg.Any<IEnumerable<BusStop>>(), Arg.Any<CancellationToken>()).Returns(false);
        _ltaClient.GetAllStopsAsync(Arg.Any<CancellationToken>()).Returns(StreamOf(Stops(2)));

        var result = await _sut.SyncAsync();

        Assert.True(result.IsFailure);
        Assert.Equal(ErrorKind.Conflict, result.Error.Kind);
    }

    private Task AssertNotReplaced() =>
        _repository.DidNotReceive().ReplaceAllAsync(Arg.Any<IEnumerable<BusStop>>(), Arg.Any<CancellationToken>());

    private static LtaBusStop[] Stops(int count) =>
        Enumerable.Range(0, count)
            .Select(i => new LtaBusStop($"{10000 + i}", "Victoria St", $"Stop {i}", 1.29, 103.85))
            .ToArray();

    private static async IAsyncEnumerable<LtaBusStop> StreamOf(params LtaBusStop[] stops)
    {
        foreach (var stop in stops)
            yield return stop;
        await Task.CompletedTask;
    }

    private static async IAsyncEnumerable<LtaBusStop> ThrowingStream()
    {
        await Task.Yield();
        throw new HttpRequestException("LTA unreachable");
#pragma warning disable CS0162
        yield break;
#pragma warning restore CS0162
    }
}
