using System.Net;
using Xunit;
using OnLah.IntegrationTests.Common;

namespace OnLah.IntegrationTests.Endpoints;

public sealed class CorsTests(ApiFactory factory) : IClassFixture<ApiFactory>
{
    [Theory]
    [InlineData("http://localhost:5173")]
    [InlineData("http://127.0.0.1:5173")]
    public async Task Preflight_WebBoardOrigin_AllowsOrigin(string origin)
    {
        using var client = factory.CreateClient();
        using var request = new HttpRequestMessage(HttpMethod.Options, "/api/v1/bus-arrivals?stopCode=01012");
        request.Headers.Add("Origin", origin);
        request.Headers.Add("Access-Control-Request-Method", "GET");

        var response = await client.SendAsync(request);

        Assert.Equal(origin, response.Headers.GetValues("Access-Control-Allow-Origin").Single());
    }
}
