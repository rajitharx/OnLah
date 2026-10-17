using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using OnLah.Application.BusArrivals;
using OnLah.Application.BusStops;
using OnLah.Application.Common.Interfaces;
using OnLah.Application.TrainAlerts;
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
        services.AddDbContext<OnLahDbContext>(options =>
            options.UseNpgsql(configuration.GetConnectionString("DefaultConnection")));

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
        services.AddHttpClient<ILtaBusStopClient, LtaBusStopClient>();
        services.AddHttpClient<ILtaTrainAlertClient, LtaTrainAlertClient>();

        services.AddScoped<IBusStopRepository, BusStopRepository>();

        services.AddScoped<GetBusArrivalsService>();
        services.AddScoped<GetNearbyStopsService>();
        services.AddScoped<SearchBusStopsService>();
        services.AddScoped<GetTrainAlertsService>();
        services.AddScoped<BusStopSyncService>();

        services.AddSingleton<IClock, SystemClock>();

        return services;
    }
}
