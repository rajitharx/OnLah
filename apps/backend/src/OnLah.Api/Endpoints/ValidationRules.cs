using FluentValidation;

namespace OnLah.Api.Endpoints;

/// <summary>
/// The formats shared by every endpoint. Bus stop codes are strings of exactly five ASCII digits (never numbers, so
/// 01012 keeps its leading zero), and service numbers are letters and digits only. \z rejects a trailing newline.
/// </summary>
internal static class ValidationRules
{
    private const string StopCodePattern = @"^[0-9]{5}\z";
    private const string ServiceNumberPattern = @"^[A-Za-z0-9]+\z";
    private const int MaxServiceNumberLength = 10;

    public static IRuleBuilderOptions<T, string?> MatchStopCodeFormat<T>(this IRuleBuilder<T, string?> rule, string label) =>
        rule.Matches(StopCodePattern).WithMessage($"{label} must be a 5-digit numeric string.");

    public static IRuleBuilderOptions<T, string?> BeServiceNumber<T>(this IRuleBuilder<T, string?> rule) =>
        rule.NotEmpty()
            .MaximumLength(MaxServiceNumberLength)
            .Matches(ServiceNumberPattern).WithMessage("Service number must be letters and digits only.");
}
