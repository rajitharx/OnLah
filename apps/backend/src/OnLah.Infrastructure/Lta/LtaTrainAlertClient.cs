using System.Globalization;
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using OnLah.Application.Common.Interfaces;
using OnLah.Application.TrainAlerts;
using OnLah.Domain.Common;

namespace OnLah.Infrastructure.Lta;

internal sealed partial class LtaTrainAlertClient : ILtaTrainAlertClient
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<LtaTrainAlertClient> _logger;

    public LtaTrainAlertClient(HttpClient httpClient, IOptions<LtaOptions> options, ILogger<LtaTrainAlertClient> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
        var opt = options.Value;
        _httpClient.BaseAddress = new Uri(opt.BaseUrl);
        _httpClient.Timeout = TimeSpan.FromSeconds(opt.TimeoutSeconds);
        _httpClient.DefaultRequestHeaders.Add("AccountKey", opt.AccountKey);
    }

    public async Task<Result<TrainAlertsResult>> GetAlertsAsync(CancellationToken cancellationToken = default)
    {
        LogFetchingAlerts();
        try
        {
            var response = await _httpClient.GetAsync("ltaodataservice/TrainServiceAlerts", cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                LogLtaStatusError(response.StatusCode);
                return DomainError.Unavailable("TrainAlerts");
            }

            var raw = await response.Content.ReadFromJsonAsync<LtaTrainAlertResponse>(cancellationToken: cancellationToken);
            if (raw?.Value is null)
                return DomainError.Unavailable("TrainAlerts");

            return Map(raw.Value);
        }
        catch (HttpRequestException ex)
        {
            LogRequestFailed(ex);
            return DomainError.Unavailable("TrainAlerts");
        }
        catch (TaskCanceledException ex) when (!cancellationToken.IsCancellationRequested)
        {
            LogTimeout(ex);
            return DomainError.Unavailable("TrainAlerts");
        }
        catch (JsonException ex)
        {
            LogMalformedResponse(ex);
            return DomainError.Unavailable("TrainAlerts");
        }
    }

    private static TrainAlertsResult Map(LtaTrainAlertFeed feed)
    {
        if (feed.Status != 2)
            return new TrainAlertsResult(TrainServiceStatus.Normal, []);

        var message = feed.Message is { Count: > 0 } messages ? messages[0] : null;
        var createdAt = ParseCreatedDate(message?.CreatedDate);
        var alerts = (feed.AffectedSegments ?? [])
            .Select(s => new TrainAlertDetail(
                s.Line,
                s.Direction,
                (s.Stations ?? string.Empty).Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries),
                message?.Content ?? string.Empty,
                createdAt))
            .ToList();
        return new TrainAlertsResult(TrainServiceStatus.Disrupted, alerts);
    }

    // LTA publishes timestamps in Singapore time (GMT+8) without an offset.
    private static readonly TimeSpan SingaporeOffset = TimeSpan.FromHours(8);

    private static DateTimeOffset ParseCreatedDate(string? raw)
    {
        if (DateTime.TryParse(raw, CultureInfo.InvariantCulture, DateTimeStyles.None, out var parsed))
            return new DateTimeOffset(DateTime.SpecifyKind(parsed, DateTimeKind.Unspecified), SingaporeOffset);
        return DateTimeOffset.MinValue;
    }

    [LoggerMessage(Level = LogLevel.Information, Message = "Fetching train service alerts")]
    private partial void LogFetchingAlerts();

    [LoggerMessage(Level = LogLevel.Warning, Message = "LTA returned {StatusCode} for train alerts")]
    private partial void LogLtaStatusError(HttpStatusCode statusCode);

    [LoggerMessage(Level = LogLevel.Warning, Message = "LTA train alerts request failed")]
    private partial void LogRequestFailed(Exception exception);

    [LoggerMessage(Level = LogLevel.Warning, Message = "LTA train alerts request timed out")]
    private partial void LogTimeout(Exception exception);

    [LoggerMessage(Level = LogLevel.Warning, Message = "LTA returned a malformed train alerts response")]
    private partial void LogMalformedResponse(Exception exception);
}
