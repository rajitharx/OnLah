using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using OnLah.Application.BusArrivals;
using OnLah.Application.BusServices;
using OnLah.Application.BusStops;
using OnLah.Application.RouteTracker;
using OnLah.Application.Common.Interfaces;
using OnLah.Application.TrainAlerts;
using OnLah.Domain.BusNetwork;
using OnLah.Domain.BusStops;
using OnLah.Infrastructure.Common;
using OnLah.Infrastructure.Lta;
using OnLah.Infrastructure.Persistence;
using OnLah.Infrastructure.Persistence.Repositories;

namespace OnLah.Infrastructure.Extensions;

public static class InfrastructureExtensions
{
    public static IServiceCollection AddInfrastructureServices(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection");
        if (string.IsNullOrWhiteSpace(connectionString))
            throw new InvalidOperationException(
                "ConnectionStrings:DefaultConnection is not configured. Set ConnectionStrings__DefaultConnection.");

        services.AddDbContext<OnLahDbContext>(options =>
            options.UseNpgsql(connectionString, OnLahNpgsqlOptions.Configure));

        services.AddOptions<LtaOptions>()
            .Bind(configuration.GetSection(LtaOptions.SectionName))
            .Validate(options => !string.IsNullOrWhiteSpace(options.AccountKey),
                "Lta:AccountKey is not configured. Set it with dotnet user-secrets or an environment variable.")
            .ValidateOnStart();

        services.AddHttpClient<LtaBusClient>();
        services.AddSingleton<ILtaBusClient>(sp => new CachedBusArrivalClient(
            sp.GetRequiredService<LtaBusClient>(),
            sp.GetRequiredService<IClock>(),
            TimeSpan.FromSeconds(sp.GetRequiredService<IOptions<LtaOptions>>().Value.ArrivalCacheSeconds)));
        services.AddTransient<ILtaLiveArrivalClient>(sp => sp.GetRequiredService<LtaBusClient>());
        services.AddHttpClient<ILtaBusStopClient, LtaBusStopClient>();
        services.AddHttpClient<ILtaBusNetworkClient, LtaBusNetworkClient>();
        services.AddHttpClient<LtaTrainAlertClient>();
        services.AddSingleton<ILtaTrainAlertClient>(sp => new CachedTrainAlertClient(
            sp.GetRequiredService<LtaTrainAlertClient>(),
            sp.GetRequiredService<IClock>(),
            TimeSpan.FromSeconds(sp.GetRequiredService<IOptions<LtaOptions>>().Value.TrainAlertCacheSeconds)));

        services.AddScoped<IBusStopRepository, BusStopRepository>();
        services.AddScoped<IBusNetworkRepository, BusNetworkRepository>();

        services.AddScoped<GetBusArrivalsService>();
        services.AddScoped<GetNearbyStopsService>();
        services.AddScoped<SearchBusStopsService>();
        services.AddScoped<GetTrainAlertsService>();
        services.AddScoped<BusStopSyncService>();
        services.AddScoped<GetBusServiceDetailsService>();
        services.AddScoped<BusNetworkSyncService>();
        services.AddScoped<RouteTrackerService>();
        services.AddSingleton<StopsAwayCalculator>();

        services.AddSingleton<IClock, SystemClock>();

        return services;
    }
}
