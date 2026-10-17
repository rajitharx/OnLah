using OnLah.Application.Common.Interfaces;

namespace OnLah.UnitTests.Common;

internal sealed class FakeClock : IClock
{
    public DateTimeOffset UtcNow { get; set; } = new(2026, 10, 17, 10, 0, 0, TimeSpan.Zero);
}
