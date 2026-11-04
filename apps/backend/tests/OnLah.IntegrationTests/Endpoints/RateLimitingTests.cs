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

public sealed class RateLimitingTests : IClassFixture<ApiFactory>
{
    private const string PeerHeader = "X-Test-Peer";
    private const string TrustedProxy = "10.0.0.1";
    private const string UntrustedPeer = "203.0.113.9";

    private readonly HttpClient _client;

    public RateLimitingTests(ApiFactory factory)
    {
        factory.LtaTrainAlertClient.GetAlertsAsync(Arg.Any<CancellationToken>())
            .Returns(Result.Success(new TrainAlertsResult(TrainServiceStatus.Normal, [])));

        _client = factory.WithWebHostBuilder(builder =>
        {
            builder.UseSetting("RateLimiting:PermitLimit", "2");
            builder.UseSetting("RateLimiting:WindowSeconds", "60");
            builder.UseSetting("ForwardedHeaders:KnownNetworks", "10.0.0.0/8");
            builder.ConfigureServices(services => services.AddSingleton<IStartupFilter, PeerAddressFromHeader>());
        }).CreateClient();
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

    private async Task<HttpResponseMessage> SendAsync(string peer, string? forwardedFor = null)
    {
        using var request = new HttpRequestMessage(HttpMethod.Get, "/api/v1/train-alerts");
        request.Headers.Add(PeerHeader, peer);
        if (forwardedFor is not null)
            request.Headers.Add("X-Forwarded-For", forwardedFor);
        return await _client.SendAsync(request);
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
