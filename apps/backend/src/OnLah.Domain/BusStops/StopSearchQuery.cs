using System.Text.RegularExpressions;

namespace OnLah.Domain.BusStops;

/// <summary>
/// A stop search split into words. LTA abbreviates most place and road words ("Bt" for "Bukit") but spells a few out,
/// so each word carries the other spelling that should also match.
/// </summary>
public sealed partial record StopSearchQuery(IReadOnlyList<StopSearchTerm> Terms)
{
    private static readonly Dictionary<string, string[]> OtherSpellings = BothWays(
        ("bukit", "bt"), ("road", "rd"), ("street", "st"), ("avenue", "ave"), ("station", "stn"),
        ("interchange", "int"), ("block", "blk"), ("opposite", "opp"), ("after", "aft"), ("before", "bef"),
        ("jalan", "jln"), ("lorong", "lor"), ("tanjong", "tg"), ("upper", "upp"), ("drive", "dr"),
        ("crescent", "cres"), ("centre", "ctr"), ("central", "ctrl"), ("school", "sch"), ("primary", "pr"),
        ("secondary", "sec"), ("industrial", "ind"), ("place", "pl"), ("terminal", "ter"), ("complex", "cplx"));

    public static StopSearchQuery Parse(string text) =>
        new(WordSeparator().Split(text.ToLowerInvariant())
            .Where(word => word.Length > 0)
            .Select(word => new StopSearchTerm(word, OtherSpellings.GetValueOrDefault(word, [])))
            .ToList());

    private static Dictionary<string, string[]> BothWays(params (string Full, string Short)[] pairs) =>
        pairs.SelectMany(p => new[] { (Word: p.Full, Other: p.Short), (Word: p.Short, Other: p.Full) })
            .ToDictionary(p => p.Word, p => new[] { p.Other });

    [GeneratedRegex("[^a-z0-9]+")]
    private static partial Regex WordSeparator();
}

/// <summary>One searched word, lowercase letters and digits only.</summary>
public sealed record StopSearchTerm(string Text, IReadOnlyList<string> Alternates)
{
    public bool IsDigits => Text.All(char.IsAsciiDigit);
}
