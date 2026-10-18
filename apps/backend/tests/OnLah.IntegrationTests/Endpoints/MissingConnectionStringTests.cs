using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

namespace OnLah.IntegrationTests.Endpoints;

public sealed class MissingConnectionStringTests
{
    [Fact]
    public void Startup_MissingDefaultConnection_FailsWithConfigurationMessage()
    {
        using var factory = new WebApplicationFactory<Program>().WithWebHostBuilder(builder =>
        {
            builder.UseSetting("Lta:AccountKey", "test-account-key");
            builder.UseSetting("Admin:ApiKey", "test-admin-key");
            builder.UseSetting("ConnectionStrings:DefaultConnection", string.Empty);
        });

        var exception = Assert.ThrowsAny<Exception>(() => factory.Services);

        Assert.Contains("ConnectionStrings:DefaultConnection is not configured", exception.ToString());
    }
}
