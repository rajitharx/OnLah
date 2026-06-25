namespace OnLah.Domain.Common;

public sealed record DomainError(string Code, string Description)
{
    public static readonly DomainError None = new(string.Empty, string.Empty);

    public static DomainError NotFound(string resource) =>
        new($"{resource}.NotFound", $"{resource} was not found.");

    public static DomainError Validation(string field, string message) =>
        new($"Validation.{field}", message);

    public static DomainError Conflict(string resource) =>
        new($"{resource}.Conflict", $"{resource} already exists.");
}
