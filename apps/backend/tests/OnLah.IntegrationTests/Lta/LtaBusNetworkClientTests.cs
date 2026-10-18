using System.Net;
using System.Text;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using OnLah.Domain.BusNetwork;
using OnLah.Infrastructure.Lta;
using OnLah.IntegrationTests.Common;
using Xunit;

namespace OnLah.IntegrationTests.Lta;

public sealed class LtaBusNetworkClientTests
{
    private const string ServiceItem =
        "{\"ServiceNo\":\"102\",\"Operator\":\"SBST\",\"Direction\":1,\"Category\":\"TRUNK\",\"OriginCode\":\"64009\"," +
        "\"DestinationCode\":\"64009\",\"AM_Peak_Freq\":\"9-11\",\"AM_Offpeak_Freq\":\"09-13\",\"PM_Peak_Freq\":\"10-12\"," +
        "\"PM_Offpeak_Freq\":\"12-16\",\"LoopDesc\":\"Seletar Aerospace Dr\"}";

    private const string RouteItem =
        "{\"ServiceNo\":\"102\",\"Operator\":\"SBST\",\"Direction\":1,\"StopSequence\":1,\"BusStopCode\":\"64009\"," +
        "\"Distance\":0,\"WD_FirstBus\":\"0530\",\"WD_LastBus\":\"2355\",\"SAT_FirstBus\":\"0530\",\"SAT_LastBus\":\"2355\"," +
        "\"SUN_FirstBus\":\"-\",\"SUN_LastBus\":\"\"}";

    [Fact]
    public async Task GetAllServicesAsync_MapsPublishedFields()
    {
        var client = CreateClient(_ => Page(ServiceItem));

        var services = await ToListAsync(client.GetAllServicesAsync());

        var service = Assert.Single(services);
        Assert.Equal("102", service.ServiceNo);
        Assert.Equal(1, service.Direction);
        Assert.Equal("9-11", service.AmPeakFreq);
        Assert.Equal("Seletar Aerospace Dr", service.LoopDesc);
    }

    [Fact]
    public async Task GetAllServicesAsync_FollowsSkipUntilAShortPage()
    {
        var handler = new FakeHttpMessageHandler(request =>
        {
            var skip = request.RequestUri!.Query.Contains("$skip=500") ? 500 : 0;
            var count = skip == 0 ? 500 : 2;
            return Task.FromResult(Json(Items(count, ServiceItem)));
        });

        var services = await ToListAsync(CreateClient(handler).GetAllServicesAsync());

        Assert.Equal(502, services.Count);
        Assert.Equal(2, handler.Requests.Count);
    }

    [Fact]
    public async Task GetAllRoutesAsync_KeepsPublishedTimesAsText()
    {
        var client = CreateClient(_ => Page(RouteItem));

        var route = Assert.Single(await ToListAsync(client.GetAllRoutesAsync()));

        Assert.Equal("0530", route.WdFirst);
        Assert.Equal("-", route.SunFirst);
        Assert.Equal("", route.SunLast);
    }

    private static LtaBusNetworkClient CreateClient(Func<HttpRequestMessage, Task<HttpResponseMessage>> respond) =>
        CreateClient(new FakeHttpMessageHandler(respond));

    private static LtaBusNetworkClient CreateClient(FakeHttpMessageHandler handler)
    {
        var options = Options.Create(new LtaOptions { AccountKey = "test-account-key", BaseUrl = "https://lta.test/" });
        return new LtaBusNetworkClient(new HttpClient(handler), options, NullLogger<LtaBusNetworkClient>.Instance);
    }

    private static Task<HttpResponseMessage> Page(string item) => Task.FromResult(Json(Items(1, item)));

    private static string Items(int count, string item) =>
        "{\"value\":[" + string.Join(",", Enumerable.Repeat(item, count)) + "]}";

    private static HttpResponseMessage Json(string body) => new(HttpStatusCode.OK)
    {
        Content = new StringContent(body, Encoding.UTF8, "application/json"),
    };

    private static async Task<List<T>> ToListAsync<T>(IAsyncEnumerable<T> items)
    {
        var list = new List<T>();
        await foreach (var item in items)
            list.Add(item);
        return list;
    }
}
