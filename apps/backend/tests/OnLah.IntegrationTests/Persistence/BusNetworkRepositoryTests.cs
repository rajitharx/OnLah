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
}
