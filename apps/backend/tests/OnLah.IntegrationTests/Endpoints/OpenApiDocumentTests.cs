using System.Net;
using System.Text.Json;
using OnLah.IntegrationTests.Common;
using Xunit;

namespace OnLah.IntegrationTests.Endpoints;

public sealed class OpenApiDocumentTests(ApiFactory factory) : IClassFixture<ApiFactory>
{
    [Fact]
    public async Task GetOpenApiDocument_Development_ReturnsDocumentWithBusArrivalPath()
    {
        using var client = factory.CreateClient();

        var response = await client.GetAsync("/openapi/v1.json");
        using var document = JsonDocument.Parse(await response.Content.ReadAsStringAsync());

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.True(document.RootElement.GetProperty("paths").TryGetProperty("/api/v1/bus-arrivals", out _));
    }
}
