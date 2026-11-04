using System.Net;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using OnLah.IntegrationTests.Common;
using Xunit;

namespace OnLah.IntegrationTests.Endpoints;

public sealed class ForwardedHeadersTests(ApiFactory factory) : IClassFixture<ApiFactory>
{
    [Fact]
    public void ForwardedHeaders_NoKnownNetworksConfigured_TrustsOnlyLoopback()
    {
        var options = factory.Services.GetRequiredService<IOptions<ForwardedHeadersOptions>>().Value;

        Assert.Equal(ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto, options.ForwardedHeaders);
        Assert.Equal(1, options.ForwardLimit);
        Assert.Equal([IPAddress.IPv6Loopback], options.KnownProxies);
        Assert.Equal([System.Net.IPNetwork.Parse("127.0.0.0/8")], options.KnownIPNetworks);
    }

    [Fact]
    public void ForwardedHeaders_KnownNetworksConfigured_TrustsOnlyThoseNetworks()
    {
        var configured = factory.WithWebHostBuilder(builder =>
            builder.UseSetting("ForwardedHeaders:KnownNetworks", "10.0.0.0/8, fd00::/8"));

        var options = configured.Services.GetRequiredService<IOptions<ForwardedHeadersOptions>>().Value;

        Assert.Equal(1, options.ForwardLimit);
        Assert.Empty(options.KnownProxies);
        Assert.Equal(
            [System.Net.IPNetwork.Parse("10.0.0.0/8"), System.Net.IPNetwork.Parse("fd00::/8")],
            options.KnownIPNetworks);
    }

    [Fact]
    public void ForwardedHeaders_MalformedKnownNetwork_FailsNamingTheSettingAndValue()
    {
        using var configured = factory.WithWebHostBuilder(builder =>
            builder.UseSetting("ForwardedHeaders:KnownNetworks", "10.0.0.0/8, not-a-network"));

        var exception = Assert.Throws<InvalidOperationException>(
            () => configured.Services.GetRequiredService<IOptions<ForwardedHeadersOptions>>().Value);

        Assert.Contains("ForwardedHeaders:KnownNetworks", exception.Message);
        Assert.Contains("not-a-network", exception.Message);
    }
}
