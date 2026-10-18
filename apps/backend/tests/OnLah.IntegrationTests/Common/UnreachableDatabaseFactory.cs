using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;

namespace OnLah.IntegrationTests.Common;

public sealed class UnreachableDatabaseFactory : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseSetting("Lta:AccountKey", "test-account-key");
        builder.UseSetting("Admin:ApiKey", ApiFactory.AdminKey);
        builder.UseSetting(
            "ConnectionStrings:DefaultConnection",
            "Host=127.0.0.1;Port=1;Database=onlah;Username=test;Password=test;Timeout=1");
    }
}
