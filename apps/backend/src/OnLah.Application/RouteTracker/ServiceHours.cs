using OnLah.Domain.BusNetwork;

namespace OnLah.Application.RouteTracker;

/// <summary>
/// The first and last bus times LTA publishes for a stop, used to tell "not in operation" from "no estimate".
/// Singapore has no daylight saving, so a fixed +08:00 offset is enough and avoids a tz database in the container.
/// </summary>
public sealed class ServiceHours
{
    private static readonly TimeSpan Singapore = TimeSpan.FromHours(8);
    private static readonly TimeSpan LastBusEarly = TimeSpan.FromMinutes(5);
    private static readonly TimeSpan LastBusLate = TimeSpan.FromMinutes(30);

    private readonly DaySchedule? _weekday;
    private readonly DaySchedule? _saturday;
    private readonly DaySchedule? _sunday;

    private ServiceHours(DaySchedule? weekday, DaySchedule? saturday, DaySchedule? sunday)
    {
        _weekday = weekday;
        _saturday = saturday;
        _sunday = sunday;
    }

    public static ServiceHours From(BusRoute row) => new(
        DaySchedule.Parse(row.WdFirst, row.WdLast),
        DaySchedule.Parse(row.SatFirst, row.SatLast),
        DaySchedule.Parse(row.SunFirst, row.SunLast));

    // Null when LTA has no times for today, because then neither answer would be honest.
    // Yesterday's overnight bus still counts when today has no times of its own.
    public bool? IsInOperation(DateTimeOffset now)
    {
        var local = now.ToOffset(Singapore);
        var minute = local.Hour * 60 + local.Minute;
        var yesterday = ScheduleFor(local.AddDays(-1).DayOfWeek);
        if (yesterday is { PassesMidnight: true } && minute <= yesterday.LastMinute)
            return true;

        var today = ScheduleFor(local.DayOfWeek);
        return today?.RunsAt(minute);
    }

    /// <summary>
    /// LTA arrivals carry no last-bus flag, so this is a heuristic against the published last-bus time.
    /// The window reaches further past that time than before it because late-night buses run late more often than early.
    /// </summary>
    public bool IsLastBus(DateTimeOffset estimatedArrival)
    {
        var local = estimatedArrival.ToOffset(Singapore);
        var serviceDay = new DateTimeOffset(local.Date, Singapore);
        return IsNearLastBus(serviceDay, local) || IsNearLastBus(serviceDay.AddDays(-1), local);
    }

    private bool IsNearLastBus(DateTimeOffset serviceDay, DateTimeOffset estimatedArrival)
    {
        var schedule = ScheduleFor(serviceDay.DayOfWeek);
        if (schedule is null)
            return false;

        var lastBus = serviceDay.AddMinutes(schedule.LastMinute).AddDays(schedule.PassesMidnight ? 1 : 0);
        return estimatedArrival >= lastBus - LastBusEarly && estimatedArrival <= lastBus + LastBusLate;
    }

    private DaySchedule? ScheduleFor(DayOfWeek day) => day switch
    {
        DayOfWeek.Saturday => _saturday,
        DayOfWeek.Sunday => _sunday,
        _ => _weekday,
    };

    private sealed record DaySchedule(int FirstMinute, int LastMinute)
    {
        public bool PassesMidnight => LastMinute < FirstMinute;

        // After midnight the small hours belong to the previous day's timetable, so only the evening part counts here.
        public bool RunsAt(int minute) =>
            PassesMidnight ? minute >= FirstMinute : minute >= FirstMinute && minute <= LastMinute;

        public static DaySchedule? Parse(string first, string last) =>
            TryMinutes(first, out var firstMinute) && TryMinutes(last, out var lastMinute)
                ? new DaySchedule(firstMinute, lastMinute)
                : null;

        private static bool TryMinutes(string hhmm, out int minutes)
        {
            minutes = 0;
            if (hhmm.Length != 4 || !int.TryParse(hhmm, out var value))
                return false;

            var (hour, minute) = Math.DivRem(value, 100);
            minutes = hour * 60 + minute;
            return hour < 24 && minute < 60;
        }
    }
}
