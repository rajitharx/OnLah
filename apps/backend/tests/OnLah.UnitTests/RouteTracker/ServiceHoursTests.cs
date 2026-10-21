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
}
