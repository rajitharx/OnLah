using System.Net;
using NSubstitute;
using OnLah.Application.TrainAlerts;
using OnLah.Domain.Common;
using OnLah.IntegrationTests.Common;
using Xunit;

namespace OnLah.IntegrationTests.Endpoints;

public sealed class SecurityHeaderTests(ApiFactory factory) : IClassFixture<ApiFactory>
{
    private readonly HttpClient _client = factory.CreateClient();

    [Fact]
    public async Task Request_Succeeds_CarriesSecurityHeaders()
    {
        factory.LtaTrainAlertClient.GetAlertsAsync(Arg.Any<CancellationToken>())
            .Returns(Result.Success(new TrainAlertsResult(TrainServiceStatus.Normal, [])));

        var response = await _client.GetAsync("/api/v1/train-alerts");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        AssertSecurityHeaders(response);
    }

    [Fact]
    public async Task Request_UnhandledException_500CarriesSecurityHeaders()
    {
        factory.LtaTrainAlertClient.GetAlertsAsync(Arg.Any<CancellationToken>())
            .Returns<Task<Result<TrainAlertsResult>>>(_ => throw new InvalidOperationException("boom"));

        var response = await _client.GetAsync("/api/v1/train-alerts");

        Assert.Equal(HttpStatusCode.InternalServerError, response.StatusCode);
        AssertSecurityHeaders(response);
    }

    private static void AssertSecurityHeaders(HttpResponseMessage response)
    {
        Assert.Equal("nosniff", Assert.Single(response.Headers.GetValues("X-Content-Type-Options")));
        Assert.Equal("DENY", Assert.Single(response.Headers.GetValues("X-Frame-Options")));
        Assert.Equal("no-referrer", Assert.Single(response.Headers.GetValues("Referrer-Policy")));
    }
}
