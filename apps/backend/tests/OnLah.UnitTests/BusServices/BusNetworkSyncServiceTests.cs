using Microsoft.Extensions.Logging.Abstractions;
using NSubstitute;
using OnLah.Application.BusServices;
using OnLah.Application.Common.Interfaces;
using OnLah.Domain.BusNetwork;
using Xunit;

namespace OnLah.UnitTests.BusServices;

public sealed class BusNetworkSyncServiceTests
{
    private readonly ILtaBusNetworkClient _lta = Substitute.For<ILtaBusNetworkClient>();
    private readonly IBusNetworkRepository _repository = Substitute.For<IBusNetworkRepository>();
    private readonly BusNetworkSyncService _sut;

    public BusNetworkSyncServiceTests() =>
        _sut = new BusNetworkSyncService(_lta, _repository, NullLogger<BusNetworkSyncService>.Instance);

    [Fact]
    public async Task SyncAsync_LtaReturnsServicesAndRoutes_ReplacesRepositoryAndReturnsCounts()
    {
        _lta.GetAllServicesAsync(Arg.Any<CancellationToken>()).Returns(StreamOf(Service("102"), Service("15")));
        _lta.GetAllRoutesAsync(Arg.Any<CancellationToken>()).Returns(StreamOf(Route("102", 1), Route("102", 2), Route("15", 1)));

        var result = await _sut.SyncAsync();

        Assert.Equal(new BusNetworkSyncResult(2, 3), result);
        await _repository.Received(1).ReplaceAllAsync(
            Arg.Is<IEnumerable<BusService>>(s => s.Count() == 2),
            Arg.Is<IEnumerable<BusRoute>>(r => r.Count() == 3),
            Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task SyncAsync_LtaFails_LeavesRepositoryUntouched()
    {
        _lta.GetAllServicesAsync(Arg.Any<CancellationToken>()).Returns(ThrowingStream<BusService>());
        _lta.GetAllRoutesAsync(Arg.Any<CancellationToken>()).Returns(StreamOf<BusRoute>());

        await Assert.ThrowsAsync<HttpRequestException>(() => _sut.SyncAsync());

        await _repository.DidNotReceive().ReplaceAllAsync(
            Arg.Any<IEnumerable<BusService>>(),
            Arg.Any<IEnumerable<BusRoute>>(),
            Arg.Any<CancellationToken>());
    }

    private static BusService Service(string serviceNo) => BusService.Create(
        serviceNo, 1, "SBST", "TRUNK", "64009", "64009", "9-11", "09-13", "10-12", "12-16", null);

    private static BusRoute Route(string serviceNo, int direction) => BusRoute.Create(
        serviceNo, direction, 1, "64009", "SBST", 0, "0530", "2355", "0530", "2355", "-", "");

    private static async IAsyncEnumerable<T> StreamOf<T>(params T[] items)
    {
        foreach (var item in items)
            yield return item;
        await Task.CompletedTask;
    }

    private static async IAsyncEnumerable<T> ThrowingStream<T>()
    {
        await Task.Yield();
        throw new HttpRequestException("LTA unreachable");
#pragma warning disable CS0162
        yield break;
#pragma warning restore CS0162
    }
}
