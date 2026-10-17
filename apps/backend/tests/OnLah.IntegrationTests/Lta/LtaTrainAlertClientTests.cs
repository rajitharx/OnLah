using System.Net;
using System.Text;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using OnLah.Application.TrainAlerts;
using OnLah.Infrastructure.Lta;
using OnLah.IntegrationTests.Common;
using Xunit;

namespace OnLah.IntegrationTests.Lta;

public sealed class LtaTrainAlertClientTests
{
    private const string DisruptedBody = """
        {"odata.metadata":"meta","value":{"Status":2,
        "AffectedSegments":[{"Line":"NSL","Direction":"Both","Stations":"NS1,NS2",
        "FreePublicBus":"","FreeMRTShuttle":"","MRTShuttleDirection":""}],
        "Message":[{"Content":"1710hrs: Train service is delayed.","CreatedDate":"2026-10-17 17:10:00"}]}}
        """;

    private const string NormalBody = """
        {"odata.metadata":"meta","value":{"Status":1,"AffectedSegments":[],"Message":[]}}
        """;

    [Fact]
    public async Task GetAlertsAsync_DisruptedFeed_ReturnsDisruptedWithSegmentDetails()
    {
        var client = CreateClient(DisruptedBody);

        var result = await client.GetAlertsAsync();

        Assert.True(result.IsSuccess);
        Assert.Equal(TrainServiceStatus.Disrupted, result.Value!.Status);
        var alert = Assert.Single(result.Value.Alerts);
        Assert.Equal("NSL", alert.Line);
        Assert.Equal("Both", alert.Direction);
        Assert.Equal(["NS1", "NS2"], alert.Stations);
        Assert.Equal("1710hrs: Train service is delayed.", alert.Message);
    }

    [Fact]
    public async Task GetAlertsAsync_DisruptedFeed_ParsesCreatedDateAsSingaporeTime()
    {
        var client = CreateClient(DisruptedBody);

        var result = await client.GetAlertsAsync();

        var expected = new DateTimeOffset(2026, 10, 17, 17, 10, 0, TimeSpan.FromHours(8));
        Assert.Equal(expected, Assert.Single(result.Value!.Alerts).CreatedAt);
    }

    [Fact]
    public async Task GetAlertsAsync_NormalFeed_ReturnsNormalWithNoAlerts()
    {
        var client = CreateClient(NormalBody);

        var result = await client.GetAlertsAsync();

        Assert.True(result.IsSuccess);
        Assert.Equal(TrainServiceStatus.Normal, result.Value!.Status);
        Assert.Empty(result.Value.Alerts);
    }

    private static LtaTrainAlertClient CreateClient(string body)
    {
        var handler = new FakeHttpMessageHandler(_ => Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
        {
            Content = new StringContent(body, Encoding.UTF8, "application/json"),
        }));
        var options = Options.Create(new LtaOptions { AccountKey = "test-account-key", BaseUrl = "https://lta.test/" });
        return new LtaTrainAlertClient(new HttpClient(handler), options, NullLogger<LtaTrainAlertClient>.Instance);
    }
}
