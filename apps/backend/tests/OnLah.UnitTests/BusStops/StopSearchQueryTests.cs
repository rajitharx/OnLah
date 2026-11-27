using System.Globalization;
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

    [Theory]
    [InlineData("bukit", "bt")]
    [InlineData("road", "rd")]
    [InlineData("street", "st")]
    [InlineData("avenue", "ave")]
    [InlineData("station", "stn")]
    [InlineData("interchange", "int")]
    [InlineData("block", "blk")]
    [InlineData("opposite", "opp")]
    [InlineData("after", "aft")]
    [InlineData("before", "bef")]
    [InlineData("jalan", "jln")]
    [InlineData("lorong", "lor")]
    [InlineData("tanjong", "tg")]
    [InlineData("upper", "upp")]
    [InlineData("drive", "dr")]
    [InlineData("crescent", "cres")]
    [InlineData("centre", "ctr")]
    [InlineData("central", "ctrl")]
    [InlineData("school", "sch")]
    [InlineData("primary", "pr")]
    [InlineData("secondary", "sec")]
    [InlineData("industrial", "ind")]
    [InlineData("place", "pl")]
    [InlineData("terminal", "ter")]
    [InlineData("complex", "cplx")]
    public void Parse_EveryKnownSpellingPair_HasOnlyTheOtherSideAsAlternate(string full, string abbreviation)
    {
        var terms = StopSearchQuery.Parse($"{full} {abbreviation}").Terms;

        Assert.Collection(
            terms,
            term => Assert.Equal([abbreviation], term.Alternates),
            term => Assert.Equal([full], term.Alternates));
    }

    [Theory]
    [InlineData("buki")]
    [InlineData("bukits")]
    [InlineData("roadway")]
    [InlineData("blk1")]
    public void Parse_WordOnlyResemblingAKnownSpelling_HasNoAlternates(string typed)
    {
        var term = Assert.Single(StopSearchQuery.Parse(typed).Terms);

        Assert.Equal(typed, term.Text);
        Assert.Empty(term.Alternates);
    }

    [Fact]
    public void Parse_SeveralWords_GivesEachWordItsOwnAlternates()
    {
        var query = StopSearchQuery.Parse("Jalan Orchard Rd");

        Assert.Equal([["jln"], [], ["road"]], query.Terms.Select(t => t.Alternates.ToArray()));
    }

    [Fact]
    public void Parse_UppercaseTextUnderTurkishCulture_LowercasesInvariantly()
    {
        var originalCulture = CultureInfo.CurrentCulture;
        CultureInfo.CurrentCulture = CultureInfo.GetCultureInfo("tr-TR");
        try
        {
            var term = Assert.Single(StopSearchQuery.Parse("INTERCHANGE").Terms);

            Assert.Equal("interchange", term.Text);
            Assert.Equal(["int"], term.Alternates);
        }
        finally
        {
            CultureInfo.CurrentCulture = originalCulture;
        }
    }

    [Theory]
    [InlineData("orchard.*plaza", new[] { "orchard", "plaza" })]
    [InlineData("a|b(c)[d]{2}+?^$", new[] { "a", "b", "c", "d", "2" })]
    [InlineData(@"\m(?:orchard)\M", new[] { "m", "orchard", "m" })]
    [InlineData("100%_off", new[] { "100", "off" })]
    [InlineData("x'; DROP--", new[] { "x", "drop" })]
    [InlineData("Andrew's", new[] { "andrew", "s" })]
    [InlineData("blk\t1\r\nopp\0stn", new[] { "blk", "1", "opp", "stn" })]
    public void Parse_PatternAndControlCharacters_AreStrippedFromEveryTerm(string typed, string[] words)
    {
        var query = StopSearchQuery.Parse(typed);

        Assert.Equal(words, query.Terms.Select(t => t.Text));
    }

    [Theory]
    [InlineData("café", new[] { "caf" })]
    [InlineData("牛车水 Stn", new[] { "stn" })]
    [InlineData("Bt\U0001F68CTimah", new[] { "bt", "timah" })]
    [InlineData("１２abc", new[] { "abc" })]
    public void Parse_NonAsciiCharacters_ActAsWordSeparators(string typed, string[] words)
    {
        var query = StopSearchQuery.Parse(typed);

        Assert.Equal(words, query.Terms.Select(t => t.Text));
    }

    [Theory]
    [InlineData("")]
    [InlineData("\t\r\n")]
    [InlineData(".*%_\\")]
    [InlineData("牛车水")]
    [InlineData("１２３")]
    [InlineData("١٢")]
    [InlineData("\U0001F68C")]
    public void Parse_NoAsciiLettersOrDigits_HasNoTerms(string typed)
    {
        var query = StopSearchQuery.Parse(typed);

        Assert.Empty(query.Terms);
    }

    [Fact]
    public void Parse_StopCodeWithLeadingZero_KeepsItAsTypedText()
    {
        var term = Assert.Single(StopSearchQuery.Parse(" 01012 ").Terms);

        Assert.Equal("01012", term.Text);
        Assert.True(term.IsDigits);
        Assert.Empty(term.Alternates);
    }

    [Fact]
    public void Parse_MixedWords_DecidesIsDigitsForEachWord()
    {
        var query = StopSearchQuery.Parse("Blk B467 0 01012");

        Assert.Equal([false, false, true, true], query.Terms.Select(t => t.IsDigits));
    }

    [Fact]
    public void Parse_VeryLongText_KeepsEveryWordInOrder()
    {
        var words = Enumerable.Range(0, 10_000).Select(i => $"w{i}").ToList();

        var query = StopSearchQuery.Parse(string.Join(' ', words));

        Assert.Equal(words, query.Terms.Select(t => t.Text));
    }
}
