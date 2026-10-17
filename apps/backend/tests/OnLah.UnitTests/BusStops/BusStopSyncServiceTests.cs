using Microsoft.Extensions.Logging.Abstractions;
using NSubstitute;
using OnLah.Application.BusStops;
using OnLah.Application.Common.Interfaces;
using OnLah.Domain.BusStops;
using Xunit;

namespace OnLah.UnitTests.BusStops;

public sealed class BusStopSyncServiceTests
{
    private readonly ILtaBusStopClient _ltaClient = Substitute.For<ILtaBusStopClient>();
    private readonly IBusStopRepository _repository = Substitute.For<IBusStopRepository>();
    private readonly BusStopSyncService _sut;

    public BusStopSyncServiceTests() =>
        _sut = new BusStopSyncService(_ltaClient, _repository, NullLogger<BusStopSyncService>.Instance);

    [Fact]
    public async Task SyncAsync_LtaReturnsStops_ReplacesRepositoryAndReturnsCount()
    {
        _ltaClient.GetAllStopsAsync(Arg.Any<CancellationToken>()).Returns(StreamOf(
            new LtaBusStop("83139", "Sengkang Av 2", "Blk 123", 1.39, 103.89),
            new LtaBusStop("01012", "Victoria St", "Hotel Grand", 1.29, 103.85)));

        var count = await _sut.SyncAsync();

        Assert.Equal(2, count);
        await _repository.Received(1).ReplaceAllAsync(
            Arg.Is<IEnumerable<BusStop>>(stops => stops.Count() == 2),
            Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task SyncAsync_LtaClientThrows_LeavesRepositoryUntouched()
    {
        _ltaClient.GetAllStopsAsync(Arg.Any<CancellationToken>()).Returns(ThrowingStream());

        await Assert.ThrowsAsync<HttpRequestException>(() => _sut.SyncAsync());

        await _repository.DidNotReceive().ReplaceAllAsync(
            Arg.Any<IEnumerable<BusStop>>(),
            Arg.Any<CancellationToken>());
    }

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
