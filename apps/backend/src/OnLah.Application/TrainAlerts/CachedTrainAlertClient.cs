using OnLah.Application.Common.Interfaces;
using OnLah.Domain.Common;

namespace OnLah.Application.TrainAlerts;

public sealed class CachedTrainAlertClient(ILtaTrainAlertClient inner, IClock clock, TimeSpan timeToLive) : ILtaTrainAlertClient
{
    private readonly Lock _gate = new();
    private CacheEntry? _entry;

    public async Task<Result<TrainAlertsResult>> GetAlertsAsync(CancellationToken cancellationToken = default)
    {
        var entry = GetOrStartFetch();
        Result<TrainAlertsResult> result;
        try
        {
            result = await entry.Task.WaitAsync(cancellationToken);
        }
        catch when (entry.Task.IsFaulted || entry.Task.IsCanceled)
        {
            Evict(entry);
            throw;
        }

        if (result.IsFailure)
            Evict(entry);

        return result;
    }

    private CacheEntry GetOrStartFetch()
    {
        lock (_gate)
        {
            var now = clock.UtcNow;
            if (_entry is { } existing && existing.ExpiresAt > now)
                return existing;

            _entry = new CacheEntry(inner.GetAlertsAsync(), now + timeToLive);
            return _entry;
        }
    }

    private void Evict(CacheEntry entry)
    {
        lock (_gate)
        {
            if (ReferenceEquals(_entry, entry))
                _entry = null;
        }
    }

    private sealed record CacheEntry(Task<Result<TrainAlertsResult>> Task, DateTimeOffset ExpiresAt);
}
