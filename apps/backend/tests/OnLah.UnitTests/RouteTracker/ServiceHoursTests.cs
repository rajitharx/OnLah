using OnLah.Application.RouteTracker;
using OnLah.Domain.BusNetwork;
using Xunit;

namespace OnLah.UnitTests.RouteTracker;

public sealed class ServiceHoursTests
{
    private static readonly TimeSpan Sgt = TimeSpan.FromHours(8);

    [Fact]
    public void IsInOperation_WeekdayMidday_ReturnsTrue()
    {
        var hours = ServiceHours.From(Row());

        Assert.True(hours.IsInOperation(At(2026, 10, 21, 12, 0)));
    }

    [Theory]
    [InlineData(4, 0)]
    [InlineData(23, 45)]
    public void IsInOperation_WeekdayOutsideTheTimetable_ReturnsFalse(int hour, int minute)
    {
        var hours = ServiceHours.From(Row());

        Assert.False(hours.IsInOperation(At(2026, 10, 21, hour, minute)));
    }

    [Fact]
    public void IsInOperation_Saturday_UsesTheSaturdayTimes()
    {
        var hours = ServiceHours.From(Row());

        Assert.False(hours.IsInOperation(At(2026, 10, 24, 5, 45)));
        Assert.True(hours.IsInOperation(At(2026, 10, 21, 5, 45)));
    }

    [Fact]
    public void IsInOperation_Sunday_UsesTheSundayTimes()
    {
        var hours = ServiceHours.From(Row());

        Assert.False(hours.IsInOperation(At(2026, 10, 25, 6, 15)));
        Assert.True(hours.IsInOperation(At(2026, 10, 25, 6, 45)));
    }

    [Fact]
    public void IsInOperation_LastBusAfterMidnight_StillRunsInTheSmallHours()
    {
        var hours = ServiceHours.From(Row(wdLast: "0030"));

        Assert.True(hours.IsInOperation(At(2026, 10, 21, 0, 15)));
        Assert.False(hours.IsInOperation(At(2026, 10, 21, 1, 0)));
    }

    [Fact]
    public void IsInOperation_SaturdayLateBus_RunsIntoSundayMorning()
    {
        var hours = ServiceHours.From(Row(satLast: "0030"));

        Assert.True(hours.IsInOperation(At(2026, 10, 25, 0, 15)));
    }

    [Fact]
    public void IsInOperation_SaturdayEndsBeforeMidnight_DoesNotRunIntoSunday()
    {
        var hours = ServiceHours.From(Row());

        Assert.False(hours.IsInOperation(At(2026, 10, 25, 0, 15)));
    }

    [Fact]
    public void IsInOperation_TimesNotPublished_ReturnsNull()
    {
        var hours = ServiceHours.From(Row(wdFirst: "-"));

        Assert.Null(hours.IsInOperation(At(2026, 10, 21, 12, 0)));
    }

    [Fact]
    public void IsInOperation_TimeExpressedInUtc_IsReadAsSingaporeTime()
    {
        var hours = ServiceHours.From(Row());
        var fourAmSgtAsUtc = new DateTimeOffset(2026, 10, 20, 20, 0, 0, TimeSpan.Zero);

        Assert.False(hours.IsInOperation(fourAmSgtAsUtc));
    }

    [Theory]
    [InlineData(23, 25)]
    [InlineData(23, 30)]
    [InlineData(23, 59)]
    public void IsLastBus_WeekdayEtaNearTheLastBus_ReturnsTrue(int hour, int minute)
    {
        var hours = ServiceHours.From(Row());

        Assert.True(hours.IsLastBus(At(2026, 10, 21, hour, minute)));
    }

    [Theory]
    [InlineData(22, 0)]
    [InlineData(23, 24)]
    public void IsLastBus_EtaWellBeforeTheLastBus_ReturnsFalse(int hour, int minute)
    {
        var hours = ServiceHours.From(Row());

        Assert.False(hours.IsLastBus(At(2026, 10, 21, hour, minute)));
    }

    [Fact]
    public void IsLastBus_EtaFarAfterTheLastBus_ReturnsFalse()
    {
        var hours = ServiceHours.From(Row());

        Assert.False(hours.IsLastBus(At(2026, 10, 22, 0, 1)));
        Assert.False(hours.IsLastBus(At(2026, 10, 22, 3, 0)));
    }

    [Fact]
    public void IsLastBus_Saturday_UsesTheSaturdayLastBus()
    {
        var hours = ServiceHours.From(Row(satLast: "2200"));

        Assert.True(hours.IsLastBus(At(2026, 10, 24, 22, 5)));
        Assert.False(hours.IsLastBus(At(2026, 10, 21, 22, 5)));
    }

    [Fact]
    public void IsLastBus_Sunday_UsesTheSundayLastBus()
    {
        var hours = ServiceHours.From(Row(sunLast: "2100"));

        Assert.True(hours.IsLastBus(At(2026, 10, 25, 21, 10)));
        Assert.False(hours.IsLastBus(At(2026, 10, 24, 21, 10)));
    }

    [Fact]
    public void IsLastBus_LastBusAfterMidnight_MatchesThePreviousDaysTimetable()
    {
        var hours = ServiceHours.From(Row(wdLast: "0015"));

        Assert.True(hours.IsLastBus(At(2026, 10, 22, 0, 20)));
        Assert.False(hours.IsLastBus(At(2026, 10, 19, 0, 20)));
    }

    [Fact]
    public void IsLastBus_SaturdayLastBusAfterMidnight_MatchesOnSundayMorning()
    {
        var hours = ServiceHours.From(Row(satLast: "0030"));

        Assert.True(hours.IsLastBus(At(2026, 10, 25, 0, 35)));
    }

    [Fact]
    public void IsLastBus_EtaExpressedInUtc_IsReadAsSingaporeTime()
    {
        var hours = ServiceHours.From(Row());
        var elevenThirtyTwoSgtAsUtc = new DateTimeOffset(2026, 10, 21, 15, 32, 0, TimeSpan.Zero);

        Assert.True(hours.IsLastBus(elevenThirtyTwoSgtAsUtc));
    }

    [Theory]
    [InlineData("-")]
    [InlineData("")]
    [InlineData("2399")]
    public void IsLastBus_LastTimeUnparseable_ReturnsFalse(string wdLast)
    {
        var hours = ServiceHours.From(Row(wdLast: wdLast));

        Assert.False(hours.IsLastBus(At(2026, 10, 21, 23, 30)));
    }

    private static DateTimeOffset At(int year, int month, int day, int hour, int minute) =>
        new(year, month, day, hour, minute, 0, Sgt);

    private static BusRoute Row(
        string wdFirst = "0530",
        string wdLast = "2330",
        string satFirst = "0600",
        string satLast = "2330",
        string sunFirst = "0630",
        string sunLast = "2300") =>
        BusRoute.Create("197", 1, 1, "28009", "SBST", 0, wdFirst, wdLast, satFirst, satLast, sunFirst, sunLast);

    [Theory]
    [InlineData(5, 30, true)]
    [InlineData(5, 29, false)]
    [InlineData(23, 30, true)]
    [InlineData(23, 31, false)]
    public void IsInOperation_AtTheTimetableEdges_IncludesTheFirstAndLastMinute(int hour, int minute, bool expected)
    {
        var hours = ServiceHours.From(Row());

        Assert.Equal(expected, hours.IsInOperation(At(2026, 10, 21, hour, minute)));
    }

    [Fact]
    public void IsInOperation_FridayLateBusRunsPastMidnightAndSaturdayHasNoTimes_StillRunsInTheSmallHours()
    {
        var hours = ServiceHours.From(Row(wdFirst: "0530", wdLast: "0030", satFirst: "-", satLast: "-"));

        Assert.True(hours.IsInOperation(At(2026, 10, 24, 0, 15)));
    }

    [Theory]
    [InlineData(23, 25, true)]
    [InlineData(23, 24, false)]
    [InlineData(23, 59, true)]
    [InlineData(0, 0, true)]
    public void IsLastBus_WindowEdges_AreInclusive(int hour, int minute, bool expected)
    {
        var hours = ServiceHours.From(Row());
        var eta = At(2026, 10, 21, hour, minute);
        if (hour == 0)
            eta = eta.AddDays(1);

        Assert.Equal(expected, hours.IsLastBus(eta));
    }

    [Fact]
    public void IsLastBus_ExactlyThirtyMinutesAfterTheLastBus_ReturnsTrue()
    {
        var hours = ServiceHours.From(Row(wdLast: "2330"));

        Assert.True(hours.IsLastBus(At(2026, 10, 22, 0, 0)));
    }

    [Fact]
    public void IsLastBus_ThirtyOneMinutesAfterTheLastBus_ReturnsFalse()
    {
        var hours = ServiceHours.From(Row(wdLast: "2330"));

        Assert.False(hours.IsLastBus(At(2026, 10, 22, 0, 1)));
    }

    [Fact]
    public void IsLastBus_SaturdayHasNoTimes_IgnoresSaturdayEtas()
    {
        var hours = ServiceHours.From(Row(satFirst: "-", satLast: "-"));

        Assert.False(hours.IsLastBus(At(2026, 10, 24, 23, 30)));
    }
}
