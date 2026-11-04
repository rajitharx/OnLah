using Microsoft.Extensions.Logging.Abstractions;
using NSubstitute;
using OnLah.Application.BusServices;
using OnLah.Application.Common.Interfaces;
using OnLah.Domain.BusNetwork;
using OnLah.Domain.Common;
using Xunit;

namespace OnLah.UnitTests.BusServices;

public sealed class BusNetworkSyncServiceTests
{
    private readonly ILtaBusNetworkClient _lta = Substitute.For<ILtaBusNetworkClient>();
    private readonly IBusNetworkRepository _repository = Substitute.For<IBusNetworkRepository>();
    private readonly BusNetworkSyncService _sut;

    public BusNetworkSyncServiceTests()
    {
        _repository.ReplaceAllAsync(
            Arg.Any<IEnumerable<BusService>>(), Arg.Any<IEnumerable<BusRoute>>(), Arg.Any<CancellationToken>())
            .Returns(true);
        _sut = new BusNetworkSyncService(_lta, _repository, NullLogger<BusNetworkSyncService>.Instance);
    }

    [Fact]
    public async Task SyncAsync_LtaReturnsServicesAndRoutes_ReplacesRepositoryAndReturnsCounts()
    {
        Lta(services: 2, routes: 3);

        var result = await _sut.SyncAsync();

        Assert.True(result.IsSuccess);
        Assert.Equal(new BusNetworkSyncResult(2, 3), result.Value);
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

        await AssertNotReplaced();
    }

    [Theory]
    [InlineData(0, 3)]
    [InlineData(2, 0)]
    public async Task SyncAsync_LtaReturnsAnEmptyDataset_FailsAndKeepsStoredNetwork(int services, int routes)
    {
        Stored(services: 2, routes: 3);
        Lta(services, routes);

        var result = await _sut.SyncAsync();

        Assert.True(result.IsFailure);
        Assert.Equal(ErrorKind.Unavailable, result.Error.Kind);
        await AssertNotReplaced();
    }

    [Theory]
    [InlineData(5, 10)]
    [InlineData(10, 5)]
    public async Task SyncAsync_LtaReturnsFarFewerRowsThanStored_FailsAndKeepsStoredNetwork(int services, int routes)
    {
        Stored(services: 10, routes: 10);
        Lta(services, routes);

        var result = await _sut.SyncAsync();

        Assert.True(result.IsFailure);
        Assert.Equal(ErrorKind.Unavailable, result.Error.Kind);
        await AssertNotReplaced();
    }

    [Fact]
    public async Task SyncAsync_LtaReturnsSlightlyFewerRowsThanStored_ReplacesRepository()
    {
        Stored(services: 10, routes: 10);
        Lta(services: 9, routes: 9);

        var result = await _sut.SyncAsync();

        Assert.True(result.IsSuccess);
        Assert.Equal(new BusNetworkSyncResult(9, 9), result.Value);
    }

    [Fact]
    public async Task SyncAsync_AnotherSyncIsWriting_ReturnsConflict()
    {
        _repository.ReplaceAllAsync(
            Arg.Any<IEnumerable<BusService>>(), Arg.Any<IEnumerable<BusRoute>>(), Arg.Any<CancellationToken>())
            .Returns(false);
        Lta(services: 2, routes: 3);

        var result = await _sut.SyncAsync();

        Assert.True(result.IsFailure);
        Assert.Equal(ErrorKind.Conflict, result.Error.Kind);
    }

    private void Stored(int services, int routes) =>
        _repository.CountAsync(Arg.Any<CancellationToken>()).Returns((services, routes));

    private void Lta(int services, int routes)
    {
        _lta.GetAllServicesAsync(Arg.Any<CancellationToken>())
            .Returns(StreamOf(Enumerable.Range(0, services).Select(i => Service($"{i}")).ToArray()));
        _lta.GetAllRoutesAsync(Arg.Any<CancellationToken>())
            .Returns(StreamOf(Enumerable.Range(0, routes).Select(i => Route("15", i)).ToArray()));
    }

    private Task AssertNotReplaced() =>
        _repository.DidNotReceive().ReplaceAllAsync(
            Arg.Any<IEnumerable<BusService>>(),
            Arg.Any<IEnumerable<BusRoute>>(),
            Arg.Any<CancellationToken>());

    private static BusService Service(string serviceNo) => BusService.Create(
        serviceNo, 1, "SBST", "TRUNK", "64009", "64009", "9-11", "09-13", "10-12", "12-16", null);

    private static BusRoute Route(string serviceNo, int sequence) => BusRoute.Create(
        serviceNo, 1, sequence, "64009", "SBST", 0, "0530", "2355", "0530", "2355", "-", "");

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
