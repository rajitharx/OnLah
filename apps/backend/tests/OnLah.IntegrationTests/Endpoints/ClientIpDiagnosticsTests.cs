using System.Collections.Concurrent;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using OnLah.IntegrationTests.Common;
using Xunit;

namespace OnLah.IntegrationTests.Endpoints;

public sealed class ClientIpDiagnosticsTests(ApiFactory factory) : IClassFixture<ApiFactory>
{
    private const string Category = "OnLah.Api.Extensions.ClientIpDiagnostics";

    [Fact]
    public async Task Request_LogClientIpEnabled_LogsRawHeadersForFirstFiftyRequests()
    {
        var logs = new CapturingLoggerProvider();
        await using var host = CreateHost(logs, logClientIp: true);
        using var client = host.CreateClient();

        for (var i = 0; i < 52; i++)
            await SendAsync(client);

        var entries = logs.Messages(Category);
        Assert.Equal(50, entries.Count);
        Assert.Contains("X-Forwarded-For '198.51.100.1, 172.64.0.1'", entries[0]);
        Assert.Contains("CF-Connecting-IP '198.51.100.1'", entries[0]);
        Assert.Contains("True-Client-IP '198.51.100.1??c?????'", entries[0]);
    }

    [Fact]
    public async Task Request_LogClientIpNotEnabled_LogsNothing()
    {
        var logs = new CapturingLoggerProvider();
        await using var host = CreateHost(logs, logClientIp: false);
        using var client = host.CreateClient();

        await SendAsync(client);

        Assert.Empty(logs.Messages(Category));
    }

    [Fact]
    public async Task Request_HealthPolls_DoNotConsumeDiagnosticSlots()
    {
        var logs = new CapturingLoggerProvider();
        await using var host = CreateHost(logs, logClientIp: true);
        using var client = host.CreateClient();

        for (var i = 0; i < 60; i++)
            await client.GetAsync("/health");
        await SendAsync(client);

        var entries = logs.Messages(Category);
        Assert.Single(entries);
        Assert.Contains("Client IP diagnostic 1/50", entries[0]);
    }

    private WebApplicationFactory<Program> CreateHost(CapturingLoggerProvider logs, bool logClientIp) =>
        factory.WithWebHostBuilder(builder =>
        {
            builder.UseSetting("RateLimiting:LogClientIp", logClientIp.ToString());
            builder.ConfigureServices(services => services.AddLogging(logging => logging.AddProvider(logs)));
        });

    private static async Task SendAsync(HttpClient client)
    {
        using var request = new HttpRequestMessage(HttpMethod.Get, "/api/v1/not-a-route");
        request.Headers.Add("X-Forwarded-For", "198.51.100.1, 172.64.0.1");
        request.Headers.Add("CF-Connecting-IP", "198.51.100.1");
        request.Headers.TryAddWithoutValidation("True-Client-IP", "198.51.100.1<script>");
        await client.SendAsync(request);
    }

    private sealed class CapturingLoggerProvider : ILoggerProvider
    {
        private readonly ConcurrentQueue<(string Category, string Message)> _entries = new();

        public List<string> Messages(string category) =>
            _entries.Where(e => e.Category == category).Select(e => e.Message).ToList();

        public ILogger CreateLogger(string categoryName) => new CapturingLogger(categoryName, _entries);

        public void Dispose()
        {
        }

        private sealed class CapturingLogger(string category, ConcurrentQueue<(string, string)> entries) : ILogger
        {
            public IDisposable? BeginScope<TState>(TState state) where TState : notnull => null;

            public bool IsEnabled(LogLevel logLevel) => true;

            public void Log<TState>(LogLevel logLevel, EventId eventId, TState state, Exception? exception,
                Func<TState, Exception?, string> formatter) => entries.Enqueue((category, formatter(state, exception)));
        }
    }
}
