using OnLah.Domain.BusStops;
using Xunit;

namespace OnLah.UnitTests.BusStops;

public sealed class StopSearchQueryTests
{
    [Fact]
    public void Parse_WordsAndPunctuation_SplitsIntoLowercaseWords()
    {
        var query = StopSearchQuery.Parse("  Opp. Blk 1/Victoria-St ");

        Assert.Equal(["opp", "blk", "1", "victoria", "st"], query.Terms.Select(t => t.Text));
    }

    [Theory]
    [InlineData("Bukit", "bt")]
    [InlineData("Bt", "bukit")]
    [InlineData("Street", "st")]
    [InlineData("rd", "road")]
    [InlineData("Interchange", "int")]
    [InlineData("Opposite", "opp")]
    [InlineData("Jalan", "jln")]
    public void Parse_LtaAbbreviation_MatchesInBothDirections(string typed, string alternate)
    {
        var term = Assert.Single(StopSearchQuery.Parse(typed).Terms);

        Assert.Contains(alternate, term.Alternates);
    }

    [Fact]
    public void Parse_OrdinaryWord_HasNoAlternates()
    {
        var term = Assert.Single(StopSearchQuery.Parse("Orchard").Terms);

        Assert.Empty(term.Alternates);
    }

    [Theory]
    [InlineData("1012", true)]
    [InlineData("467B", false)]
    public void Parse_Word_KnowsWhetherItCouldBePartOfAStopCode(string typed, bool isDigits)
    {
        var term = Assert.Single(StopSearchQuery.Parse(typed).Terms);

        Assert.Equal(isDigits, term.IsDigits);
    }

    [Fact]
    public void Parse_OnlyPunctuation_HasNoTerms()
    {
        Assert.Empty(StopSearchQuery.Parse("--").Terms);
    }
}
