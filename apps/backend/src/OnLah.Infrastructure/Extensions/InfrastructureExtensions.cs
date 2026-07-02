using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
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

        services.Configure<LtaOptions>(options =>
            configuration.GetSection(LtaOptions.SectionName).Bind(options));

        services.AddHttpClient<ILtaBusClient, LtaBusClient>();
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
