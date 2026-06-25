using OnLah.Application.Common.Interfaces;

namespace OnLah.Infrastructure.Common;

internal sealed class SystemClock : IClock
{
    public DateTimeOffset UtcNow => DateTimeOffset.UtcNow;
}
