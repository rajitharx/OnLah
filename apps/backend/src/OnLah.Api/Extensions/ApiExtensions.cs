using FluentValidation;
using OnLah.Api.Middleware;

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
        services.AddValidatorsFromAssemblyContaining<Program>();

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
        app.MapGroup("/api/v1");
        // Register feature endpoint groups here as they are built
        return app;
    }
}
