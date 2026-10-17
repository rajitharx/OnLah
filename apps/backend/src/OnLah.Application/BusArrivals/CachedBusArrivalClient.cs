using OnLah.Application.Common.Interfaces;
using OnLah.Domain.Common;

namespace OnLah.Application.BusArrivals;

public sealed class CachedBusArrivalClient(ILtaBusClient inner, IClock clock, TimeSpan timeToLive) : ILtaBusClient
{
    private readonly Lock _gate = new();
    private readonly Dictionary<string, CacheEntry> _entries = [];

    public async Task<Result<IReadOnlyList<BusArrival>>> GetArrivalsAsync(
        string stopCode,
        CancellationToken cancellationToken = default)
    {
        var entry = GetOrStartFetch(stopCode);
        var result = await entry.Task.WaitAsync(cancellationToken);

        if (result.IsFailure)
            Evict(stopCode, entry);

        return result;
    }

    private CacheEntry GetOrStartFetch(string stopCode)
    {
        lock (_gate)
        {
            var now = clock.UtcNow;
            if (_entries.TryGetValue(stopCode, out var existing) && existing.ExpiresAt > now)
                return existing;

            PruneExpired(now);
            var entry = new CacheEntry(inner.GetArrivalsAsync(stopCode), now + timeToLive);
            _entries[stopCode] = entry;
            return entry;
        }
    }

    private void Evict(string stopCode, CacheEntry entry)
    {
        lock (_gate)
        {
            if (_entries.TryGetValue(stopCode, out var current) && ReferenceEquals(current, entry))
                _entries.Remove(stopCode);
        }
    }

    private void PruneExpired(DateTimeOffset now)
    {
        foreach (var key in _entries.Where(e => e.Value.ExpiresAt <= now).Select(e => e.Key).ToList())
            _entries.Remove(key);
    }

    private sealed record CacheEntry(Task<Result<IReadOnlyList<BusArrival>>> Task, DateTimeOffset ExpiresAt);
}
