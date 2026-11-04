using System.Net;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.DependencyInjection;
using NSubstitute;
using OnLah.Application.TrainAlerts;
using OnLah.Domain.Common;
using OnLah.IntegrationTests.Common;
using Xunit;

namespace OnLah.IntegrationTests.Endpoints;

public sealed class RateLimitingTests : IClassFixture<ApiFactory>, IDisposable
{
    private const string PeerHeader = "X-Test-Peer";
    private const string TrustedProxy = "10.0.0.1";
    private const string UntrustedPeer = "203.0.113.9";

    private readonly ApiFactory _factory;
    private readonly List<IDisposable> _disposables = [];
    private readonly HttpClient _client;

    public RateLimitingTests(ApiFactory factory)
    {
        factory.LtaTrainAlertClient.GetAlertsAsync(Arg.Any<CancellationToken>())
            .Returns(Result.Success(new TrainAlertsResult(TrainServiceStatus.Normal, [])));

        _factory = factory;
        _client = CreateClient(("RateLimiting:Enabled", "true"));
    }

    [Fact]
    public async Task ApiRequest_RateLimitingNotEnabled_IsNeverLimited()
    {
        var client = CreateClient();

        var statuses = new List<HttpStatusCode>();
        for (var i = 0; i < 4; i++)
            statuses.Add((await SendAsync(client, UntrustedPeer)).StatusCode);

        Assert.All(statuses, status => Assert.Equal(HttpStatusCode.OK, status));
    }

    [Fact]
    public async Task ApiRequest_ForwardedForHeaderNameConfigured_LimitsByThatHeader()
    {
        var client = CreateClient(
            ("RateLimiting:Enabled", "true"),
            ("ForwardedHeaders:ForwardedForHeaderName", "CF-Connecting-IP"));
        await SendAsync(client, TrustedProxy, cfConnectingIp: "198.51.100.1", forwardedFor: "10.9.9.9");
        await SendAsync(client, TrustedProxy, cfConnectingIp: "198.51.100.1", forwardedFor: "10.9.9.9");

        var limited = await SendAsync(client, TrustedProxy, cfConnectingIp: "198.51.100.1", forwardedFor: "10.9.9.9");
        var other = await SendAsync(client, TrustedProxy, cfConnectingIp: "198.51.100.2", forwardedFor: "10.9.9.9");

        Assert.Equal(HttpStatusCode.TooManyRequests, limited.StatusCode);
        Assert.Equal(HttpStatusCode.OK, other.StatusCode);
    }

    [Fact]
    public async Task ApiRequest_OverLimit_Returns429WithRetryAfter()
    {
        await SendAsync(UntrustedPeer);
        await SendAsync(UntrustedPeer);

        var response = await SendAsync(UntrustedPeer);

        Assert.Equal(HttpStatusCode.TooManyRequests, response.StatusCode);
        Assert.True(response.Headers.RetryAfter?.Delta > TimeSpan.Zero);
    }

    [Fact]
    public async Task ApiRequest_ClientsBehindTrustedProxy_AreLimitedSeparately()
    {
        await SendAsync(TrustedProxy, "198.51.100.1");
        await SendAsync(TrustedProxy, "198.51.100.1");

        var limited = await SendAsync(TrustedProxy, "198.51.100.1");
        var other = await SendAsync(TrustedProxy, "198.51.100.2");

        Assert.Equal(HttpStatusCode.TooManyRequests, limited.StatusCode);
        Assert.Equal(HttpStatusCode.OK, other.StatusCode);
    }

    [Fact]
    public async Task ApiRequest_UntrustedPeerSpoofsForwardedFor_StillSharesOneLimit()
    {
        await SendAsync(UntrustedPeer, "198.51.100.1");
        await SendAsync(UntrustedPeer, "198.51.100.2");

        var response = await SendAsync(UntrustedPeer, "198.51.100.3");

        Assert.Equal(HttpStatusCode.TooManyRequests, response.StatusCode);
    }

    [Fact]
    public async Task HealthCheck_OverApiLimit_IsNotRateLimited()
    {
        await SendAsync(UntrustedPeer);
        await SendAsync(UntrustedPeer);

        using var request = new HttpRequestMessage(HttpMethod.Get, "/health");
        request.Headers.Add(PeerHeader, UntrustedPeer);
        var response = await _client.SendAsync(request);

        Assert.NotEqual(HttpStatusCode.TooManyRequests, response.StatusCode);
    }

    [Theory]
    [InlineData("RateLimiting:PermitLimit", "0")]
    [InlineData("RateLimiting:WindowSeconds", "0")]
    public void Startup_RateLimitingEnabledWithNonPositiveSetting_FailsNamingTheSetting(string key, string value)
    {
        using var host = _factory.WithWebHostBuilder(builder =>
        {
            builder.UseSetting("RateLimiting:Enabled", "true");
            builder.UseSetting(key, value);
        });

        var exception = Assert.ThrowsAny<Exception>(() => host.Services);

        Assert.Contains(key, exception.ToString());
    }

    [Fact]
    public void Startup_RateLimitingDisabledWithZeroPermitLimit_Starts()
    {
        using var host = _factory.WithWebHostBuilder(builder =>
            builder.UseSetting("RateLimiting:PermitLimit", "0"));

        Assert.NotNull(host.Services);
    }

    public void Dispose()
    {
        foreach (var disposable in _disposables)
            disposable.Dispose();
    }

    private HttpClient CreateClient(params (string Key, string Value)[] settings)
    {
        var host = _factory.WithWebHostBuilder(builder =>
        {
            builder.UseSetting("RateLimiting:PermitLimit", "2");
            builder.UseSetting("RateLimiting:WindowSeconds", "60");
            builder.UseSetting("ForwardedHeaders:KnownNetworks", "10.0.0.0/8");
            foreach (var (key, value) in settings)
                builder.UseSetting(key, value);
            builder.ConfigureServices(services => services.AddSingleton<IStartupFilter, PeerAddressFromHeader>());
        });
        var client = host.CreateClient();
        _disposables.Add(client);
        _disposables.Add(host);
        return client;
    }

    private Task<HttpResponseMessage> SendAsync(string peer, string? forwardedFor = null) =>
        SendAsync(_client, peer, forwardedFor);

    private static async Task<HttpResponseMessage> SendAsync(
        HttpClient client, string peer, string? forwardedFor = null, string? cfConnectingIp = null)
    {
        using var request = new HttpRequestMessage(HttpMethod.Get, "/api/v1/train-alerts");
        request.Headers.Add(PeerHeader, peer);
        if (forwardedFor is not null)
            request.Headers.Add("X-Forwarded-For", forwardedFor);
        if (cfConnectingIp is not null)
            request.Headers.Add("CF-Connecting-IP", cfConnectingIp);
        return await client.SendAsync(request);
    }

    private sealed class PeerAddressFromHeader : IStartupFilter
    {
        public Action<IApplicationBuilder> Configure(Action<IApplicationBuilder> next) => app =>
        {
            app.Use((context, nextMiddleware) =>
            {
                context.Connection.RemoteIpAddress = IPAddress.Parse(context.Request.Headers[PeerHeader].ToString());
                return nextMiddleware(context);
            });
            next(app);
        };
    }
}
