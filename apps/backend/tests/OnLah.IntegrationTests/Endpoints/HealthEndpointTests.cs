using System.Net;
using System.Text.Json;
using OnLah.IntegrationTests.Common;
using Xunit;

namespace OnLah.IntegrationTests.Endpoints;

public sealed class HealthEndpointTests(ApiFactory factory) : IClassFixture<ApiFactory>
{
    [Fact]
    public async Task GetHealth_DatabaseReachable_ReturnsOkWithHealthyStatus()
    {
        using var client = factory.CreateClient();

        var response = await client.GetAsync("/health");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("Healthy", await response.Content.ReadAsStringAsync());
    }
}

public sealed class HealthEndpointUnavailableDatabaseTests : IClassFixture<UnreachableDatabaseFactory>
{
    private readonly UnreachableDatabaseFactory _factory;

    public HealthEndpointUnavailableDatabaseTests(UnreachableDatabaseFactory factory) => _factory = factory;

    [Fact]
    public async Task GetHealth_DatabaseUnreachable_ReturnsServiceUnavailable()
    {
        using var client = _factory.CreateClient();

        var response = await client.GetAsync("/health");

        Assert.Equal(HttpStatusCode.ServiceUnavailable, response.StatusCode);
    }
}
