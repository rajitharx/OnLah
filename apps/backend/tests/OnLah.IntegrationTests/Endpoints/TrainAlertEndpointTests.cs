using System.Net;
using NSubstitute;
using OnLah.Application.Common.Interfaces;
using OnLah.Application.TrainAlerts;
using OnLah.Domain.Common;
using OnLah.IntegrationTests.Common;
using Xunit;

namespace OnLah.IntegrationTests.Endpoints;

public sealed class TrainAlertEndpointTests(ApiFactory factory) : IClassFixture<ApiFactory>
{
    private readonly HttpClient _client = factory.CreateClient();

    [Fact]
    public async Task GetTrainAlerts_UpstreamUnavailable_Returns502()
    {
        factory.LtaTrainAlertClient.GetAlertsAsync(Arg.Any<CancellationToken>())
            .Returns(Result.Failure<TrainAlertsResult>(DomainError.Unavailable("TrainAlerts")));

        var response = await _client.GetAsync("/api/v1/train-alerts");

        Assert.Equal(HttpStatusCode.BadGateway, response.StatusCode);
    }

    [Fact]
    public async Task GetTrainAlerts_NormalFeed_Returns200()
    {
        factory.LtaTrainAlertClient.GetAlertsAsync(Arg.Any<CancellationToken>())
            .Returns(Result.Success(new TrainAlertsResult(TrainServiceStatus.Normal, [])));

        var response = await _client.GetAsync("/api/v1/train-alerts");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }
}
