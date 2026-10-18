using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using OnLah.IntegrationTests.Common;
using Xunit;

namespace OnLah.IntegrationTests.Endpoints;

public sealed class ForwardedHeadersTests(ApiFactory factory) : IClassFixture<ApiFactory>
{
    [Fact]
    public void ForwardedHeaders_Configured_TrustsAnyProxyForForwardedForAndProto()
    {
        var options = factory.Services.GetRequiredService<IOptions<ForwardedHeadersOptions>>().Value;

        Assert.Equal(
            ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto,
            options.ForwardedHeaders);
        Assert.Empty(options.KnownProxies);
        Assert.Empty(options.KnownNetworks);
    }
}
