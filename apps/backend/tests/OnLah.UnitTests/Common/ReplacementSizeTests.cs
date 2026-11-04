using OnLah.Application.Common;
using Xunit;

namespace OnLah.UnitTests.Common;

public sealed class ReplacementSizeTests
{
    [Fact]
    public void IsPlausible_ExactlyEightyPercentRetained_IsAccepted()
        => Assert.True(new ReplacementSize(Fetched: 80, Stored: 100).IsPlausible);

    [Fact]
    public void IsPlausible_JustUnderEightyPercentRetained_IsRefused()
        => Assert.False(new ReplacementSize(Fetched: 79, Stored: 100).IsPlausible);

    [Fact]
    public void IsPlausible_NothingFetched_IsRefused()
        => Assert.False(new ReplacementSize(Fetched: 0, Stored: 0).IsPlausible);
}
