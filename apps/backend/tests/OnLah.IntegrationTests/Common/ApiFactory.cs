using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using OnLah.Infrastructure.Persistence;
using Testcontainers.PostgreSql;
using Xunit;

namespace OnLah.IntegrationTests.Common;

public sealed class ApiFactory : WebApplicationFactory<Program>, IAsyncLifetime
{
    private readonly PostgreSqlContainer _postgres = new PostgreSqlBuilder()
        .WithImage("postgres:17-alpine")
        .Build();

    public async Task InitializeAsync() => await _postgres.StartAsync();

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureServices(services =>
        {
            var descriptor = services.SingleOrDefault(
                d => d.ServiceType == typeof(DbContextOptions<OnLahDbContext>));

            if (descriptor is not null)
                services.Remove(descriptor);

            services.AddDbContext<OnLahDbContext>(options =>
                options.UseNpgsql(_postgres.GetConnectionString()));
        });
    }

    public new async Task DisposeAsync() => await _postgres.DisposeAsync();
}
