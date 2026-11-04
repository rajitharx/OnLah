using System.Net;
using System.Text;
using Microsoft.Extensions.DependencyInjection;
using OnLah.Application.Common.Interfaces;
using OnLah.Application.TrainAlerts;
using OnLah.Infrastructure.Lta;
using OnLah.IntegrationTests.Common;
using Xunit;

namespace OnLah.IntegrationTests.Endpoints;

public sealed class TrainAlertWiringTests(TrainAlertWiringTests.RealTrainAlertClientFactory factory)
    : IClassFixture<TrainAlertWiringTests.RealTrainAlertClientFactory>
{
    [Fact]
    public void TrainAlertClient_RealRegistration_IsCached()
    {
        var client = factory.Services.GetRequiredService<ILtaTrainAlertClient>();

        Assert.IsType<CachedTrainAlertClient>(client);
    }

    [Fact]
    public async Task GetTrainAlerts_RepeatedRequests_CallLtaOnce()
    {
        var client = factory.CreateClient();

        var first = await client.GetAsync("/api/v1/train-alerts");
        var second = await client.GetAsync("/api/v1/train-alerts");

        Assert.Equal(HttpStatusCode.OK, first.StatusCode);
        Assert.Equal(HttpStatusCode.OK, second.StatusCode);
        Assert.Equal(1, factory.LtaRequests);
    }

    public sealed class RealTrainAlertClientFactory : ApiFactory
    {
        private const string NormalBody = """
            {"odata.metadata":"meta","value":{"Status":1,"AffectedSegments":[],"Message":[]}}
            """;

        private int _ltaRequests;

        public int LtaRequests => Volatile.Read(ref _ltaRequests);

        protected override void ReplaceTrainAlertClient(IServiceCollection services) =>
            services.AddHttpClient<LtaTrainAlertClient>()
                .ConfigurePrimaryHttpMessageHandler(() => new FakeHttpMessageHandler(_ =>
                {
                    Interlocked.Increment(ref _ltaRequests);
                    return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
                    {
                        Content = new StringContent(NormalBody, Encoding.UTF8, "application/json"),
                    });
                }));
    }
}
