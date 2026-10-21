using System.Globalization;
using System.Net;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using OnLah.Application.BusArrivals;
using OnLah.Application.Common.Interfaces;
using OnLah.Domain.Common;

namespace OnLah.Infrastructure.Lta;

internal sealed partial class LtaBusClient : ILtaBusClient, ILtaLiveArrivalClient
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<LtaBusClient> _logger;

    public LtaBusClient(HttpClient httpClient, IOptions<LtaOptions> options, ILogger<LtaBusClient> logger)
    {
        _httpClient = httpClient;
        _logger = logger;

        var opt = options.Value;
        _httpClient.BaseAddress = new Uri(opt.BaseUrl);
        _httpClient.Timeout = TimeSpan.FromSeconds(opt.TimeoutSeconds);
        _httpClient.DefaultRequestHeaders.Add("AccountKey", opt.AccountKey);
    }

    public async Task<Result<IReadOnlyList<BusArrival>>> GetArrivalsAsync(
        string stopCode,
        CancellationToken cancellationToken = default)
    {
        var fetched = await FetchServicesAsync(stopCode, cancellationToken);
        if (fetched.IsFailure)
            return fetched.Error;

        return fetched.Value!.Select(Map).ToList();
    }

    private async Task<Result<IReadOnlyList<LtaService>>> FetchServicesAsync(
        string stopCode,
        CancellationToken cancellationToken)
    {
        LogFetchingArrivals(stopCode);

        try
        {
            var response = await _httpClient.GetAsync(
                $"ltaodataservice/v3/BusArrival?BusStopCode={Uri.EscapeDataString(stopCode)}",
                cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                LogLtaStatusError(response.StatusCode, stopCode);
                return DomainError.Unavailable("BusArrival");
            }

            var body = await response.Content.ReadAsStringAsync(cancellationToken);

            // An empty body means no service information, which the app shows as an advisory.
            if (string.IsNullOrWhiteSpace(body))
                return new List<LtaService>();

            return ParseServices(body);
        }
        catch (HttpRequestException ex)
        {
            LogLtaRequestFailed(ex, stopCode);
            return DomainError.Unavailable("BusArrival");
        }
        catch (TaskCanceledException ex) when (!cancellationToken.IsCancellationRequested)
        {
            LogLtaTimeout(ex, stopCode);
            return DomainError.Unavailable("BusArrival");
        }
        catch (Exception ex) when (ex is JsonException or FormatException)
        {
            LogLtaMalformedResponse(ex, stopCode);
            return DomainError.Unavailable("BusArrival");
        }
    }

    private static List<LtaService> ParseServices(string body)
    {
        var raw = JsonSerializer.Deserialize<LtaBusArrivalResponse>(body, JsonSerializerOptions.Web);
        return (raw?.Services ?? []).ToList();
    }

    private static BusArrival Map(LtaService s) => new(
        s.ServiceNo,
        s.Operator,
        MapTiming(s.NextBus),
        MapTiming(s.NextBus2),
        MapTiming(s.NextBus3)
    );

    private static ArrivalTiming? MapTiming(LtaArrivalTiming t)
    {
        if (string.IsNullOrEmpty(t.EstimatedArrival))
            return null;

        return new ArrivalTiming(
            DateTimeOffset.Parse(t.EstimatedArrival, CultureInfo.InvariantCulture),
            MapLoad(t.Load),
            t.Feature == "WAB",
            MapType(t.Type),
            t.Monitored == 1
        );
    }

    private static CrowdLevel MapLoad(string load) => load switch
    {
        "SEA" => CrowdLevel.SeatsAvailable,
        "SDA" => CrowdLevel.StandingAvailable,
        "LSD" => CrowdLevel.LimitedStanding,
        _ => CrowdLevel.SeatsAvailable
    };

    private static BusType MapType(string type) => type switch
    {
        "DD" => BusType.DoubleDeck,
        "BD" => BusType.Bendy,
        _ => BusType.SingleDeck
    };

    [LoggerMessage(Level = LogLevel.Information, Message = "Fetching bus arrivals for stop {StopCode}")]
    private partial void LogFetchingArrivals(string stopCode);

    [LoggerMessage(Level = LogLevel.Warning, Message = "LTA returned {StatusCode} for stop {StopCode}")]
    private partial void LogLtaStatusError(HttpStatusCode statusCode, string stopCode);

    [LoggerMessage(Level = LogLevel.Warning, Message = "LTA request failed for stop {StopCode}")]
    private partial void LogLtaRequestFailed(Exception exception, string stopCode);

    [LoggerMessage(Level = LogLevel.Warning, Message = "LTA request timed out for stop {StopCode}")]
    private partial void LogLtaTimeout(Exception exception, string stopCode);

    [LoggerMessage(Level = LogLevel.Warning, Message = "LTA returned a malformed response for stop {StopCode}")]
    private partial void LogLtaMalformedResponse(Exception exception, string stopCode);
}
