namespace OnLah.Domain.Common;

public enum ErrorKind
{
    Failure,
    NotFound,
    Validation,
    Conflict,
    Unavailable
}

public sealed record DomainError(string Code, string Description, ErrorKind Kind = ErrorKind.Failure)
{
    public static readonly DomainError None = new(string.Empty, string.Empty);

    public static DomainError NotFound(string resource) =>
        new($"{resource}.NotFound", $"{resource} was not found.", ErrorKind.NotFound);

    public static DomainError Validation(string field, string message) =>
        new($"Validation.{field}", message, ErrorKind.Validation);

    public static DomainError Conflict(string resource) =>
        new($"{resource}.Conflict", $"{resource} already exists.", ErrorKind.Conflict);

    public static DomainError Unavailable(string resource) =>
        new($"{resource}.Unavailable", $"{resource} is temporarily unavailable.", ErrorKind.Unavailable);
}
