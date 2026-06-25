using System.Net.Http.Json;
using System.Runtime.CompilerServices;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using OnLah.Application.Common.Interfaces;

namespace OnLah.Infrastructure.Lta;

internal sealed partial class LtaBusStopClient : ILtaBusStopClient
{
    private const int PageSize = 500;
    private readonly HttpClient _httpClient;
    private readonly ILogger<LtaBusStopClient> _logger;

    public LtaBusStopClient(HttpClient httpClient, IOptions<LtaOptions> options, ILogger<LtaBusStopClient> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
        var opt = options.Value;
        _httpClient.BaseAddress = new Uri(opt.BaseUrl);
        _httpClient.Timeout = TimeSpan.FromSeconds(opt.TimeoutSeconds);
        _httpClient.DefaultRequestHeaders.Add("AccountKey", opt.AccountKey);
    }

    public async IAsyncEnumerable<LtaBusStop> GetAllStopsAsync(
        [EnumeratorCancellation] CancellationToken cancellationToken = default)
    {
        var skip = 0;
        int fetched;
        do
        {
            var page = await FetchPageAsync(skip, cancellationToken);
            fetched = page.Count;
            foreach (var item in page)
                yield return new LtaBusStop(item.BusStopCode, item.RoadName, item.Description, item.Latitude, item.Longitude);
            skip += PageSize;
        }
        while (fetched >= PageSize);
    }

    private async Task<IReadOnlyList<LtaBusStopItem>> FetchPageAsync(int skip, CancellationToken cancellationToken)
    {
        LogFetchingPage(skip);
        var response = await _httpClient.GetAsync($"ltaodataservice/BusStops?$skip={skip}", cancellationToken);
        response.EnsureSuccessStatusCode();
        var raw = await response.Content.ReadFromJsonAsync<LtaBusStopPageResponse>(cancellationToken: cancellationToken);
        return raw?.Value ?? [];
    }

    [LoggerMessage(Level = LogLevel.Information, Message = "Fetching bus stops page at skip={Skip}")]
    private partial void LogFetchingPage(int skip);
}
