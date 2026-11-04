namespace OnLah.Application.Common;

// LTA reference data moves by a handful of rows between syncs. A reply that is empty or far smaller than the
// stored copy means LTA served a blank dataset or paging stopped early, so the sync keeps what it has.
internal readonly record struct ReplacementSize(int Fetched, int Stored)
{
    internal const double MinimumRetainedFraction = 0.8;

    public bool IsPlausible => Fetched > 0 && Fetched >= Stored * MinimumRetainedFraction;
}
