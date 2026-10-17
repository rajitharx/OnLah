using System.Security.Cryptography;
using System.Text;

namespace OnLah.Application.Admin;

public sealed class AdminKeyValidator(string? configuredKey)
{
    public bool IsValid(string? providedKey)
    {
        if (string.IsNullOrEmpty(configuredKey) || string.IsNullOrEmpty(providedKey))
            return false;

        return CryptographicOperations.FixedTimeEquals(
            Encoding.UTF8.GetBytes(configuredKey),
            Encoding.UTF8.GetBytes(providedKey));
    }
}
