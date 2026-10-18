using FluentValidation;
using OnLah.Api.Endpoints.BusArrivals;
using OnLah.Api.Endpoints.BusServices;
using OnLah.Api.Endpoints.BusStops;
using OnLah.Api.Endpoints.TrainAlerts;
using OnLah.Api.Middleware;
using OnLah.Application.Admin;

namespace OnLah.Api.Extensions;

internal static class ApiExtensions
{
    internal static IServiceCollection AddApiServices(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.AddProblemDetails();
        services.AddExceptionHandler<GlobalExceptionHandler>();
        services.AddOpenApi();
        services.AddSingleton(new AdminKeyValidator(configuration["Admin:ApiKey"]));
        services.AddValidatorsFromAssemblyContaining<Program>(includeInternalTypes: true);

        services.AddCors(options =>
        {
            options.AddPolicy("AllowedOrigins", policy =>
            {
                var origins = configuration
                    .GetSection("Cors:AllowedOrigins")
                    .Get<string[]>() ?? [];

                policy.WithOrigins(origins)
                      .AllowAnyHeader()
                      .AllowAnyMethod();
            });
        });

        return services;
    }

    internal static WebApplication UseSecurityHeaders(this WebApplication app)
    {
        app.Use(async (context, next) =>
        {
            context.Response.Headers["X-Content-Type-Options"] = "nosniff";
            context.Response.Headers["X-Frame-Options"] = "DENY";
            context.Response.Headers["Referrer-Policy"] = "no-referrer";
            await next();
        });
        return app;
    }

    internal static WebApplication MapApiEndpoints(this WebApplication app)
    {
        var v1 = app.MapGroup("/api/v1");
        v1.MapBusArrivalEndpoints();
        v1.MapBusStopEndpoints();
        v1.MapTrainAlertEndpoints();
        v1.MapBusServiceEndpoints();
        return app;
    }
}
