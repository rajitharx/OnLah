using OnLah.Application.Admin;
using Xunit;

namespace OnLah.UnitTests.Admin;

public sealed class AdminKeyValidatorTests
{
    [Fact]
    public void IsValid_MatchingKey_ReturnsTrue()
    {
        var sut = new AdminKeyValidator("correct-horse-battery");

        Assert.True(sut.IsValid("correct-horse-battery"));
    }

    [Fact]
    public void IsValid_WrongKey_ReturnsFalse()
    {
        var sut = new AdminKeyValidator("correct-horse-battery");

        Assert.False(sut.IsValid("wrong-key"));
    }

    [Fact]
    public void IsValid_KeyWithDifferentLength_ReturnsFalse()
    {
        var sut = new AdminKeyValidator("correct-horse-battery");

        Assert.False(sut.IsValid("correct"));
    }

    [Fact]
    public void IsValid_MissingProvidedKey_ReturnsFalse()
    {
        var sut = new AdminKeyValidator("correct-horse-battery");

        Assert.False(sut.IsValid(null));
    }

    [Fact]
    public void IsValid_NoConfiguredKey_ReturnsFalseEvenForEmptyInput()
    {
        var sut = new AdminKeyValidator(null);

        Assert.False(sut.IsValid(null));
        Assert.False(sut.IsValid(""));
    }
}
