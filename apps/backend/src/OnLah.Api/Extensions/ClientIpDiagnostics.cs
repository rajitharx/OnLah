using Microsoft.Extensions.Options;
using Microsoft.Extensions.Primitives;

namespace OnLah.Api.Extensions;

// Opt-in via RateLimiting:LogClientIp, to find which header carries the real client IP behind the host's proxies.
internal sealed partial class ClientIpDiagnostics(ILogger<ClientIpDiagnostics> logger)
{
    internal const int MaxLoggedRequests = 50;
    private const int MaxHeaderLength = 200;

    private int _logged;

    internal async Task InvokeAsync(HttpContext context, RequestDelegate next)
    {
        // Only API traffic counts, so the host's own /health polls cannot use up the slots.
        if (!context.Request.Path.StartsWithSegments("/api/v1")
            || Volatile.Read(ref _logged) >= MaxLoggedRequests)
        {
            await next(context);
            return;
        }

        var sequence = Interlocked.Increment(ref _logged);
        var peer = context.Connection.RemoteIpAddress?.ToString();
        var headers = context.Request.Headers;
        var forwardedFor = Sanitise(headers["X-Forwarded-For"]);
        var cfConnectingIp = Sanitise(headers["CF-Connecting-IP"]);
        var trueClientIp = Sanitise(headers["True-Client-IP"]);

        try
        {
            await next(context);
        }
        finally
        {
            if (sequence <= MaxLoggedRequests)
            {
                var resolved = context.Connection.RemoteIpAddress?.ToString();
                LogClientIp(sequence, MaxLoggedRequests, peer, resolved, forwardedFor, cfConnectingIp, trueClientIp);
            }
        }
    }

    // Header values come from the client, so keep only characters that can appear in an IP list.
    private static string Sanitise(StringValues values)
    {
        var raw = values.ToString();
        var kept = raw.Length > MaxHeaderLength ? raw[..MaxHeaderLength] : raw;
        return new string(kept.Select(c => char.IsAsciiHexDigit(c) || c is '.' or ':' or ',' or ' ' ? c : '?').ToArray());
    }

    [LoggerMessage(Level = LogLevel.Information,
        Message = "Client IP diagnostic {Sequence}/{Limit}: peer {PeerIp}, resolved {ClientIp}, " +
                  "X-Forwarded-For '{XForwardedFor}', CF-Connecting-IP '{CfConnectingIp}', True-Client-IP '{TrueClientIp}'")]
    private partial void LogClientIp(int sequence, int limit, string? peerIp, string? clientIp,
        string xForwardedFor, string cfConnectingIp, string trueClientIp);
}

internal static class ClientIpDiagnosticsExtensions
{
    // Runs before UseForwardedHeaders so it sees the raw headers and the proxy's own address.
    internal static WebApplication UseClientIpDiagnostics(this WebApplication app)
    {
        if (!app.Services.GetRequiredService<IOptions<RateLimitingOptions>>().Value.LogClientIp)
            return app;

        var diagnostics = new ClientIpDiagnostics(app.Services.GetRequiredService<ILogger<ClientIpDiagnostics>>());
        app.Use(diagnostics.InvokeAsync);
        return app;
    }
}
