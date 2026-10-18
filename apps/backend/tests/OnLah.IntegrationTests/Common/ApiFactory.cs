using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using NSubstitute;
using OnLah.Application.Common.Interfaces;
using OnLah.Infrastructure.Persistence;
using Testcontainers.PostgreSql;
using Xunit;

namespace OnLah.IntegrationTests.Common;

public sealed class ApiFactory : WebApplicationFactory<Program>, IAsyncLifetime
{
    public const string AdminKey = "test-admin-key";

    private readonly PostgreSqlContainer _postgres = new PostgreSqlBuilder()
        .WithImage("postgres:17-alpine")
        .Build();

    public ILtaBusClient LtaBusClient { get; } = Substitute.For<ILtaBusClient>();

    public ILtaBusStopClient LtaBusStopClient { get; } = Substitute.For<ILtaBusStopClient>();

    public ILtaTrainAlertClient LtaTrainAlertClient { get; } = Substitute.For<ILtaTrainAlertClient>();

    public ILtaBusNetworkClient LtaBusNetworkClient { get; } = Substitute.For<ILtaBusNetworkClient>();

    public async Task InitializeAsync()
    {
        await _postgres.StartAsync();

        var options = new DbContextOptionsBuilder<OnLahDbContext>()
            .UseNpgsql(_postgres.GetConnectionString(), OnLahNpgsqlOptions.Configure)
            .Options;

        await using var db = new OnLahDbContext(options);
        await db.Database.MigrateAsync();
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseSetting("Lta:AccountKey", "test-account-key");
        builder.UseSetting("Admin:ApiKey", AdminKey);
        builder.UseSetting("ConnectionStrings:DefaultConnection", _postgres.GetConnectionString());

        builder.ConfigureServices(services =>
        {
            var descriptor = services.SingleOrDefault(
                d => d.ServiceType == typeof(DbContextOptions<OnLahDbContext>));

            if (descriptor is not null)
                services.Remove(descriptor);

            services.AddDbContext<OnLahDbContext>(options =>
                options.UseNpgsql(_postgres.GetConnectionString(), OnLahNpgsqlOptions.Configure));

            services.RemoveAll<ILtaBusClient>();
            services.AddSingleton(LtaBusClient);

            services.RemoveAll<ILtaBusStopClient>();
            services.AddSingleton(LtaBusStopClient);

            services.RemoveAll<ILtaTrainAlertClient>();
            services.AddSingleton(LtaTrainAlertClient);

            services.RemoveAll<ILtaBusNetworkClient>();
            services.AddSingleton(LtaBusNetworkClient);
        });
    }

    public new async Task DisposeAsync() => await _postgres.DisposeAsync();
}
