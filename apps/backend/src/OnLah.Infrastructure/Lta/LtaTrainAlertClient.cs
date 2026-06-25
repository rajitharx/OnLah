using System.Globalization;
using System.Net;
using System.Net.Http.Json;
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
                return DomainError.Validation("TrainAlerts", "LTA returned an error response.");
            }

            var raw = await response.Content.ReadFromJsonAsync<LtaTrainAlertResponse>(cancellationToken: cancellationToken);
            if (raw is null)
                return DomainError.Validation("TrainAlerts", "LTA returned an empty response.");

            return Map(raw);
        }
        catch (HttpRequestException ex)
        {
            LogRequestFailed(ex);
            return DomainError.Validation("LtaClient", "Unable to reach LTA DataMall.");
        }
        catch (TaskCanceledException ex) when (!cancellationToken.IsCancellationRequested)
        {
            LogTimeout(ex);
            return DomainError.Validation("LtaClient", "LTA DataMall request timed out.");
        }
    }

    private static TrainAlertsResult Map(LtaTrainAlertResponse raw)
    {
        var disrupted = raw.Value.Where(c => c.Status == 2).ToList();
        var status = disrupted.Count > 0 ? TrainServiceStatus.Disrupted : TrainServiceStatus.Normal;
        var alerts = disrupted
            .Select(c =>
            {
                var msg = c.Message.Count > 0 ? c.Message[0] : null;
                return new TrainAlertDetail(
                    c.Line,
                    c.Direction,
                    c.Stations.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries),
                    msg?.Content ?? string.Empty,
                    ParseCreatedDate(msg?.CreatedDate));
            })
            .ToList();
        return new TrainAlertsResult(status, alerts);
    }

    private static DateTimeOffset ParseCreatedDate(string? raw)
    {
        if (DateTimeOffset.TryParse(raw, CultureInfo.InvariantCulture, out var parsed))
            return parsed;
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
}
