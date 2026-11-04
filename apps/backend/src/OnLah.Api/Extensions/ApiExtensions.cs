using FluentValidation;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.HttpOverrides;
using OnLah.Api.Endpoints.BusArrivals;
using OnLah.Api.Endpoints.BusServices;
using OnLah.Api.Endpoints.BusStops;
using OnLah.Api.Endpoints.RouteTracker;
using OnLah.Api.Endpoints.TrainAlerts;
using OnLah.Api.Health;
using OnLah.Api.Middleware;
using OnLah.Application.Admin;

namespace OnLah.Api.Extensions;

internal static class ApiExtensions
{
    private const string KnownNetworksKey = "ForwardedHeaders:KnownNetworks";

    internal static IServiceCollection AddApiServices(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.AddProblemDetails();
        services.AddExceptionHandler<GlobalExceptionHandler>();
        services.AddOpenApi();
        services.AddSingleton(new AdminKeyValidator(configuration["Admin:ApiKey"]));
        services.AddValidatorsFromAssemblyContaining<Program>(includeInternalTypes: true);
        services.AddHealthChecks().AddCheck<DatabaseHealthCheck>("database");

        services.Configure<ForwardedHeadersOptions>(options => ConfigureForwardedHeaders(options, configuration));
        services.AddPerClientRateLimiting(configuration);

        services.AddCors(options =>
        {
            options.AddPolicy("AllowedOrigins", policy =>
            {
                var origins = (configuration["Cors:AllowedOrigins"] ?? string.Empty)
                    .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

                policy.WithOrigins(origins)
                      .AllowAnyHeader()
                      .AllowAnyMethod();
            });
        });

        return services;
    }

    internal static WebApplication UseSecurityHeaders(this WebApplication app)
    {
        app.Use((context, next) =>
        {
            context.Response.OnStarting(() =>
            {
                context.Response.Headers["X-Content-Type-Options"] = "nosniff";
                context.Response.Headers["X-Frame-Options"] = "DENY";
                context.Response.Headers["Referrer-Policy"] = "no-referrer";
                return Task.CompletedTask;
            });
            return next(context);
        });
        return app;
    }

    // With no networks configured the framework default (loopback only) applies.
    // ForwardLimit = 1 reads only the hop the nearest trusted proxy appended, so a client cannot spoof it.
    private static void ConfigureForwardedHeaders(ForwardedHeadersOptions options, IConfiguration configuration)
    {
        options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
        options.ForwardLimit = 1;

        var networks = (configuration[KnownNetworksKey] ?? string.Empty)
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        if (networks.Length == 0)
            return;

        options.KnownProxies.Clear();
        options.KnownIPNetworks.Clear();
        foreach (var network in networks)
            options.KnownIPNetworks.Add(System.Net.IPNetwork.Parse(network));
    }

    internal static WebApplication MapApiEndpoints(this WebApplication app)
    {
        var v1 = app.MapGroup("/api/v1").RequireRateLimiting(RateLimitingExtensions.PerClientPolicy);
        v1.MapBusArrivalEndpoints();
        v1.MapBusStopEndpoints();
        v1.MapTrainAlertEndpoints();
        v1.MapBusServiceEndpoints();
        v1.MapRouteTrackerEndpoints();
        app.MapHealthChecks("/health");
        return app;
    }
}
