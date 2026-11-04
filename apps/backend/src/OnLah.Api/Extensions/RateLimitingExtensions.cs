using System.Globalization;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Options;

namespace OnLah.Api.Extensions;

internal sealed class RateLimitingOptions
{
    public const string SectionName = "RateLimiting";

    public bool Enabled { get; init; }
    public bool LogClientIp { get; init; }
    public int PermitLimit { get; init; } = 120;
    public int WindowSeconds { get; init; } = 60;
}

internal static class RateLimitingExtensions
{
    internal const string PerClientPolicy = "per-client";
    private const string UnknownClient = "unknown";
    private const string DisabledPartition = "disabled";

    internal static IServiceCollection AddPerClientRateLimiting(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.AddOptions<RateLimitingOptions>()
            .Bind(configuration.GetSection(RateLimitingOptions.SectionName))
            .Validate(o => !o.Enabled || o.PermitLimit > 0,
                "RateLimiting:PermitLimit must be greater than 0 when RateLimiting:Enabled is true.")
            .Validate(o => !o.Enabled || o.WindowSeconds > 0,
                "RateLimiting:WindowSeconds must be greater than 0 when RateLimiting:Enabled is true.")
            .ValidateOnStart();

        services.AddRateLimiter(options =>
        {
            options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
            options.OnRejected = WriteRejectionAsync;
            options.AddPolicy(PerClientPolicy, context =>
            {
                var limits = context.RequestServices.GetRequiredService<IOptions<RateLimitingOptions>>().Value;
                if (!limits.Enabled)
                    return RateLimitPartition.GetNoLimiter(DisabledPartition);

                return RateLimitPartition.GetFixedWindowLimiter(
                    context.Connection.RemoteIpAddress?.ToString() ?? UnknownClient,
                    _ => new FixedWindowRateLimiterOptions
                    {
                        PermitLimit = limits.PermitLimit,
                        Window = TimeSpan.FromSeconds(limits.WindowSeconds)
                    });
            });
        });

        return services;
    }

    private static async ValueTask WriteRejectionAsync(OnRejectedContext context, CancellationToken cancellationToken)
    {
        var http = context.HttpContext;
        if (context.Lease.TryGetMetadata(MetadataName.RetryAfter, out var retryAfter))
            http.Response.Headers.RetryAfter =
                ((int)Math.Ceiling(retryAfter.TotalSeconds)).ToString(CultureInfo.InvariantCulture);

        await http.RequestServices.GetRequiredService<IProblemDetailsService>().WriteAsync(new ProblemDetailsContext
        {
            HttpContext = http,
            ProblemDetails = { Status = StatusCodes.Status429TooManyRequests, Title = "Too many requests." }
        });
    }
}
