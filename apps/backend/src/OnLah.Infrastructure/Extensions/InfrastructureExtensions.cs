using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using OnLah.Application.Common.Interfaces;
using OnLah.Infrastructure.Common;
using OnLah.Infrastructure.Lta;
using OnLah.Infrastructure.Persistence;

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

        services.AddSingleton<IClock, SystemClock>();

        return services;
    }
}
