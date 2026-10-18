using System.Net.Http.Json;
using System.Runtime.CompilerServices;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using OnLah.Application.Common.Interfaces;
using OnLah.Domain.BusNetwork;

namespace OnLah.Infrastructure.Lta;

internal sealed partial class LtaBusNetworkClient : ILtaBusNetworkClient
{
    private const int PageSize = 500;
    private readonly HttpClient _httpClient;
    private readonly ILogger<LtaBusNetworkClient> _logger;

    public LtaBusNetworkClient(HttpClient httpClient, IOptions<LtaOptions> options, ILogger<LtaBusNetworkClient> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
        var opt = options.Value;
        _httpClient.BaseAddress = new Uri(opt.BaseUrl);
        _httpClient.Timeout = TimeSpan.FromSeconds(opt.TimeoutSeconds);
        _httpClient.DefaultRequestHeaders.Add("AccountKey", opt.AccountKey);
    }

    public IAsyncEnumerable<BusService> GetAllServicesAsync(CancellationToken cancellationToken = default) =>
        ReadAllAsync<LtaBusServiceItem, BusService>("BusServices", ToService, cancellationToken);

    public IAsyncEnumerable<BusRoute> GetAllRoutesAsync(CancellationToken cancellationToken = default) =>
        ReadAllAsync<LtaBusRouteItem, BusRoute>("BusRoutes", ToRoute, cancellationToken);

    private async IAsyncEnumerable<TResult> ReadAllAsync<TItem, TResult>(
        string dataset,
        Func<TItem, TResult> map,
        [EnumeratorCancellation] CancellationToken cancellationToken)
    {
        var skip = 0;
        int fetched;
        do
        {
            var page = await FetchPageAsync<TItem>(dataset, skip, cancellationToken);
            fetched = page.Count;
            foreach (var item in page)
                yield return map(item);
            skip += PageSize;
        }
        while (fetched >= PageSize);
    }

    private async Task<IReadOnlyList<TItem>> FetchPageAsync<TItem>(string dataset, int skip, CancellationToken cancellationToken)
    {
        LogFetchingPage(dataset, skip);
        var response = await _httpClient.GetAsync($"ltaodataservice/{dataset}?$skip={skip}", cancellationToken);
        response.EnsureSuccessStatusCode();
        var raw = await response.Content.ReadFromJsonAsync<LtaPage<TItem>>(cancellationToken: cancellationToken);
        return raw?.Value ?? [];
    }

    private static BusService ToService(LtaBusServiceItem item) => BusService.Create(
        serviceNo: item.ServiceNo,
        direction: item.Direction,
        operatorCode: item.Operator,
        category: item.Category,
        originCode: item.OriginCode,
        destinationCode: item.DestinationCode,
        amPeakFreq: item.AmPeakFreq,
        amOffpeakFreq: item.AmOffpeakFreq,
        pmPeakFreq: item.PmPeakFreq,
        pmOffpeakFreq: item.PmOffpeakFreq,
        loopDesc: item.LoopDesc);

    private static BusRoute ToRoute(LtaBusRouteItem item) => BusRoute.Create(
        serviceNo: item.ServiceNo,
        direction: item.Direction,
        stopSequence: item.StopSequence,
        busStopCode: item.BusStopCode,
        operatorCode: item.Operator,
        distance: item.Distance,
        wdFirst: item.WdFirst,
        wdLast: item.WdLast,
        satFirst: item.SatFirst,
        satLast: item.SatLast,
        sunFirst: item.SunFirst,
        sunLast: item.SunLast);

    [LoggerMessage(Level = LogLevel.Information, Message = "Fetching {Dataset} page at skip={Skip}")]
    private partial void LogFetchingPage(string dataset, int skip);
}
