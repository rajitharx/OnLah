using System.Net;
using System.Text;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using OnLah.Application.BusArrivals;
using OnLah.Domain.Common;
using OnLah.Infrastructure.Lta;
using OnLah.IntegrationTests.Common;
using Xunit;

namespace OnLah.IntegrationTests.Lta;

public sealed class LtaLiveArrivalClientTests
{
    private const string MonitoredBody = """
        {"BusStopCode":"67009","Services":[{"ServiceNo":"161","Operator":"SBST",
        "NextBus":{"OriginCode":"67009","DestinationCode":"59009","EstimatedArrival":"2026-10-21T12:10:00+08:00","Monitored":1,"Latitude":"1.3915","Longitude":"103.8959","VisitNumber":"2","Load":"SDA","Feature":"WAB","Type":"DD"},
        "NextBus2":{"OriginCode":"","DestinationCode":"","EstimatedArrival":"2026-10-21T12:20:00+08:00","Monitored":0,"Latitude":"0.0","Longitude":"0.0","VisitNumber":"1","Load":"SEA","Feature":"","Type":"SD"},
        "NextBus3":{"OriginCode":"","DestinationCode":"","EstimatedArrival":"","Monitored":0,"Latitude":"","Longitude":"","VisitNumber":"","Load":"","Feature":"","Type":""}}]}
        """;

    [Fact]
    public async Task GetLiveArrivalsAsync_MonitoredBus_ReturnsLocationDestinationAndVisit()
    {
        var client = CreateClient(new FakeHttpMessageHandler(_ => Respond(HttpStatusCode.OK, MonitoredBody)));

        var result = await client.GetLiveArrivalsAsync("67009");

        var bus = result.Value!.Single().Buses[0];
        Assert.True(bus.IsMonitored);
        Assert.Equal(new GeoPoint(1.3915, 103.8959), bus.Location);
        Assert.Equal("59009", bus.DestinationCode);
        Assert.Equal(2, bus.VisitNumber);
        Assert.Equal(CrowdLevel.StandingAvailable, bus.Load);
        Assert.True(bus.IsWheelchairAccessible);
        Assert.Equal(BusType.DoubleDeck, bus.Type);
    }

    [Fact]
    public async Task GetLiveArrivalsAsync_UnmonitoredBusWithZeroCoordinates_HasNoLocation()
    {
        var client = CreateClient(new FakeHttpMessageHandler(_ => Respond(HttpStatusCode.OK, MonitoredBody)));

        var result = await client.GetLiveArrivalsAsync("67009");

        var scheduled = result.Value!.Single().Buses[1];
        Assert.False(scheduled.IsMonitored);
        Assert.Null(scheduled.Location);
    }

    [Fact]
    public async Task GetLiveArrivalsAsync_MonitoredBusReportingZeroZero_HasNoLocation()
    {
        var body = MonitoredBody.Replace("\"Latitude\":\"1.3915\",\"Longitude\":\"103.8959\"", "\"Latitude\":\"0.0\",\"Longitude\":\"0.0\"");
        var client = CreateClient(new FakeHttpMessageHandler(_ => Respond(HttpStatusCode.OK, body)));

        var result = await client.GetLiveArrivalsAsync("67009");

        Assert.Null(result.Value!.Single().Buses[0].Location);
    }

    [Fact]
    public async Task GetLiveArrivalsAsync_EmptyThirdBus_IsLeftOut()
    {
        var client = CreateClient(new FakeHttpMessageHandler(_ => Respond(HttpStatusCode.OK, MonitoredBody)));

        var result = await client.GetLiveArrivalsAsync("67009");

        Assert.Equal(2, result.Value!.Single().Buses.Count);
    }

    [Fact]
    public async Task GetLiveArrivalsAsync_EmptyBody_ReturnsNoServices()
    {
        var client = CreateClient(new FakeHttpMessageHandler(_ => Respond(HttpStatusCode.OK, "")));

        var result = await client.GetLiveArrivalsAsync("67009");

        Assert.True(result.IsSuccess);
        Assert.Empty(result.Value!);
    }

    [Fact]
    public async Task GetLiveArrivalsAsync_NonSuccessStatus_ReturnsUnavailable()
    {
        var client = CreateClient(new FakeHttpMessageHandler(_ => Respond(HttpStatusCode.BadGateway, "")));

        var result = await client.GetLiveArrivalsAsync("67009");

        Assert.Equal(ErrorKind.Unavailable, result.Error.Kind);
    }

    [Fact]
    public async Task GetLiveArrivalsAsync_CalledTwice_AsksLtaTwiceBecauseLiveDataIsNotCached()
    {
        var handler = new FakeHttpMessageHandler(_ => Respond(HttpStatusCode.OK, MonitoredBody));
        var client = CreateClient(handler);

        await client.GetLiveArrivalsAsync("67009");
        await client.GetLiveArrivalsAsync("67009");

        Assert.Equal(2, handler.Requests.Count);
    }

    private static LtaBusClient CreateClient(FakeHttpMessageHandler handler)
    {
        var options = Options.Create(new LtaOptions { AccountKey = "test-account-key", BaseUrl = "https://lta.test/" });
        return new LtaBusClient(new HttpClient(handler), options, NullLogger<LtaBusClient>.Instance);
    }

    private static Task<HttpResponseMessage> Respond(HttpStatusCode status, string body) =>
        Task.FromResult(new HttpResponseMessage(status) { Content = new StringContent(body, Encoding.UTF8, "application/json") });
}
