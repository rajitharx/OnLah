using Microsoft.Extensions.DependencyInjection;
using OnLah.Domain.BusNetwork;
using OnLah.IntegrationTests.Common;
using Xunit;

namespace OnLah.IntegrationTests.Persistence;

public sealed class BusNetworkRepositoryTests(ApiFactory factory) : IClassFixture<ApiFactory>
{
    [Fact]
    public async Task ReplaceAllAsync_ValidNetwork_PersistsServices()
    {
        using var scope = factory.Services.CreateScope();
        var repository = scope.ServiceProvider.GetRequiredService<IBusNetworkRepository>();
        var service = new BusService
        {
            ServiceNo = "TST1",
            Direction = 1,
            Operator = "GAS",
            Category = "TRUNK",
            OriginCode = "01012",
            DestinationCode = "01019",
        };
        var route = new BusRoute
        {
            ServiceNo = "TST1",
            Direction = 1,
            StopSequence = 1,
            BusStopCode = "01012",
            Operator = "GAS",
            Distance = 0,
            WdFirst = "0530",
            WdLast = "2330",
            SatFirst = "0530",
            SatLast = "2330",
            SunFirst = "0530",
            SunLast = "2330",
        };

        await repository.ReplaceAllAsync([service], [route]);

        var stored = await repository.GetServicesAsync("TST1");
        Assert.Single(stored);
    }

    [Fact]
    public async Task GetRoutesForStopAsync_StopServedByTwoServices_ReturnsOnlyThatStopsRows()
    {
        using var scope = factory.Services.CreateScope();
        var repository = scope.ServiceProvider.GetRequiredService<IBusNetworkRepository>();
        await repository.ReplaceAllAsync([], [Row("15", 1, 3, "83139"), Row("10e", 2, 7, "83139"), Row("15", 1, 4, "83141")]);

        var routes = await repository.GetRoutesForStopAsync("83139");

        Assert.Equal(["10e", "15"], routes.Select(r => r.ServiceNo).Order(StringComparer.Ordinal));
    }

    [Fact]
    public async Task GetRoutesForStopAsync_UnknownStop_ReturnsEmpty()
    {
        using var scope = factory.Services.CreateScope();
        var repository = scope.ServiceProvider.GetRequiredService<IBusNetworkRepository>();
        await repository.ReplaceAllAsync([], [Row("15", 1, 3, "83139")]);

        var routes = await repository.GetRoutesForStopAsync("99999");

        Assert.Empty(routes);
    }

    [Fact]
    public async Task GetServicesForStopAsync_ReturnsOnlyTheDirectionsThatCallAtTheStop()
    {
        using var scope = factory.Services.CreateScope();
        var repository = scope.ServiceProvider.GetRequiredService<IBusNetworkRepository>();
        await repository.ReplaceAllAsync(
            [Direction("15", 1), Direction("15", 2), Direction("10e", 1)],
            [Row("15", 1, 3, "83139"), Row("10e", 1, 7, "83141")]);

        var services = await repository.GetServicesForStopAsync("83139");

        var only = Assert.Single(services);
        Assert.Equal(("15", 1), (only.ServiceNo, only.Direction));
    }

    private static BusService Direction(string serviceNo, int direction) =>
        BusService.Create(serviceNo, direction, "SBST", "TRUNK", "01012", "01019", null, null, null, null, null);

    private static BusRoute Row(string serviceNo, int direction, int sequence, string stopCode) =>
        BusRoute.Create(serviceNo, direction, sequence, stopCode, "SBST", 0, "0530", "2330", "0530", "2330", "0530", "2330");
}
