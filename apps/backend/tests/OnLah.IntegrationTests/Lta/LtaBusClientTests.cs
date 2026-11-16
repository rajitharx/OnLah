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

public sealed class LtaBusClientTests
{
    private const string ValidBody = """
        {"BusStopCode":"83139","Services":[{"ServiceNo":"15","Operator":"GAS",
        "NextBus":{"EstimatedArrival":"2026-10-17T10:05:00+08:00","Monitored":1,"Load":"SEA","Feature":"","Type":"SD"},
        "NextBus2":{"EstimatedArrival":"","Monitored":0,"Load":"","Feature":"","Type":""},
        "NextBus3":{"EstimatedArrival":"","Monitored":0,"Load":"","Feature":"","Type":""}}]}
        """;

    [Fact]
    public async Task GetArrivalsAsync_ValidResponse_ReturnsMappedServices()
    {
        var client = CreateClient(new FakeHttpMessageHandler(_ => Respond(HttpStatusCode.OK, ValidBody)));

        var result = await client.GetArrivalsAsync("83139");

        Assert.True(result.IsSuccess);
        Assert.Single(result.Value!);
        Assert.Equal("15", result.Value![0].ServiceNo);
        Assert.Equal(CrowdLevel.SeatsAvailable, result.Value[0].NextBus!.Load);
    }

    [Fact]
    public async Task GetArrivalsAsync_AnyRequest_SendsConfiguredAccountKey()
    {
        var handler = new FakeHttpMessageHandler(_ => Respond(HttpStatusCode.OK, ValidBody));
        var client = CreateClient(handler);

        await client.GetArrivalsAsync("83139");

        Assert.Equal("test-account-key", handler.Requests[0].Headers.GetValues("AccountKey").Single());
    }

    // Hard rule: Bus Arrival calls use the v3 endpoint. v2 is retired and has a different shape.
    [Fact]
    public async Task GetArrivalsAsync_AnyRequest_CallsTheV3BusArrivalEndpointWithTheStopCode()
    {
        var handler = new FakeHttpMessageHandler(_ => Respond(HttpStatusCode.OK, ValidBody));
        var client = CreateClient(handler);

        await client.GetArrivalsAsync("83139");

        var uri = handler.Requests[0].RequestUri!;
        Assert.Equal("/ltaodataservice/v3/BusArrival", uri.AbsolutePath);
        Assert.Equal("?BusStopCode=83139", uri.Query);
    }

    [Fact]
    public async Task GetArrivalsAsync_NonSuccessStatus_ReturnsUnavailable()
    {
        var client = CreateClient(new FakeHttpMessageHandler(_ =>
            Respond(HttpStatusCode.InternalServerError, "")));

        var result = await client.GetArrivalsAsync("83139");

        Assert.True(result.IsFailure);
        Assert.Equal(ErrorKind.Unavailable, result.Error.Kind);
    }

    [Fact]
    public async Task GetArrivalsAsync_TransportFailure_ReturnsUnavailable()
    {
        var client = CreateClient(new FakeHttpMessageHandler(_ =>
            throw new HttpRequestException("connection refused")));

        var result = await client.GetArrivalsAsync("83139");

        Assert.True(result.IsFailure);
        Assert.Equal(ErrorKind.Unavailable, result.Error.Kind);
    }

    [Fact]
    public async Task GetArrivalsAsync_MalformedJson_ReturnsUnavailable()
    {
        var client = CreateClient(new FakeHttpMessageHandler(_ =>
            Respond(HttpStatusCode.OK, "{\"Services\":[")));

        var result = await client.GetArrivalsAsync("83139");

        Assert.True(result.IsFailure);
        Assert.Equal(ErrorKind.Unavailable, result.Error.Kind);
    }

    [Fact]
    public async Task GetArrivalsAsync_EmptyBody_ReturnsNoServices()
    {
        var client = CreateClient(new FakeHttpMessageHandler(_ => Respond(HttpStatusCode.OK, "")));

        var result = await client.GetArrivalsAsync("83139");

        Assert.True(result.IsSuccess);
        Assert.Empty(result.Value!);
    }

    [Fact]
    public async Task GetArrivalsAsync_UnparseableTimestamp_LeavesThatBusOut()
    {
        var body = ValidBody.Replace("2026-10-17T10:05:00+08:00", "not-a-time");
        var client = CreateClient(new FakeHttpMessageHandler(_ => Respond(HttpStatusCode.OK, body)));

        var result = await client.GetArrivalsAsync("83139");

        Assert.True(result.IsSuccess);
        Assert.Null(Assert.Single(result.Value!).NextBus);
    }

    [Fact]
    public async Task GetArrivalsAsync_MissingLaterBuses_ReturnsFirstBusOnly()
    {
        const string body = """
            {"BusStopCode":"83139","Services":[{"ServiceNo":"15","Operator":"GAS",
            "NextBus":{"EstimatedArrival":"2026-10-17T10:05:00+08:00","Monitored":1,"Load":"SEA","Feature":"","Type":"SD"}}]}
            """;
        var client = CreateClient(new FakeHttpMessageHandler(_ => Respond(HttpStatusCode.OK, body)));

        var result = await client.GetArrivalsAsync("83139");

        Assert.True(result.IsSuccess);
        var service = Assert.Single(result.Value!);
        Assert.NotNull(service.NextBus);
        Assert.Null(service.NextBus2);
        Assert.Null(service.NextBus3);
    }

    [Fact]
    public async Task GetArrivalsAsync_BusesHeadingToDifferentTerminals_KeepsEachBusDestinationCode()
    {
        const string body = """
            {"BusStopCode":"66271","Services":[{"ServiceNo":"136","Operator":"GAS",
            "NextBus":{"EstimatedArrival":"2026-10-17T10:05:00+08:00","Monitored":1,"Load":"SEA","Feature":"","Type":"SD","DestinationCode":"11111"},
            "NextBus2":{"EstimatedArrival":"2026-10-17T10:09:00+08:00","Monitored":1,"Load":"SEA","Feature":"","Type":"SD","DestinationCode":"22222"},
            "NextBus3":{"EstimatedArrival":"2026-10-17T10:12:00+08:00","Monitored":1,"Load":"SEA","Feature":"","Type":"SD","DestinationCode":""}}]}
            """;
        var client = CreateClient(new FakeHttpMessageHandler(_ => Respond(HttpStatusCode.OK, body)));

        var service = Assert.Single((await client.GetArrivalsAsync("66271")).Value!);

        Assert.Equal("11111", service.NextBus!.DestinationCode);
        Assert.Equal("22222", service.NextBus2!.DestinationCode);
        Assert.Null(service.NextBus3!.DestinationCode);
    }

    private static LtaBusClient CreateClient(FakeHttpMessageHandler handler)
    {
        var options = Options.Create(new LtaOptions
        {
            AccountKey = "test-account-key",
            BaseUrl = "https://lta.test/"
        });

        return new LtaBusClient(new HttpClient(handler), options, NullLogger<LtaBusClient>.Instance);
    }

    private static Task<HttpResponseMessage> Respond(HttpStatusCode status, string body) =>
        Task.FromResult(new HttpResponseMessage(status)
        {
            Content = new StringContent(body, Encoding.UTF8, "application/json")
        });
}
