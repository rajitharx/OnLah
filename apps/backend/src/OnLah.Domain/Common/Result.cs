namespace OnLah.Domain.Common;

public sealed class Result<T>
{
    internal Result(T value)
    {
        Value = value;
        Error = DomainError.None;
        IsSuccess = true;
    }

    internal Result(DomainError error)
    {
        Value = default;
        Error = error;
        IsSuccess = false;
    }

    public bool IsSuccess { get; }
    public bool IsFailure => !IsSuccess;
    public T? Value { get; }
    public DomainError Error { get; }

    public static implicit operator Result<T>(T value) => new(value);
    public static implicit operator Result<T>(DomainError error) => new(error);
}

public sealed class Result
{
    private Result() => IsSuccess = true;

    private Result(DomainError error)
    {
        IsSuccess = false;
        Error = error;
    }

    public bool IsSuccess { get; }
    public bool IsFailure => !IsSuccess;
    public DomainError Error { get; } = DomainError.None;

    public static Result Success() => new();
    public static Result Failure(DomainError error) => new(error);

    public static Result<T> Success<T>(T value) => new(value);
    public static Result<T> Failure<T>(DomainError error) => new(error);

    public static implicit operator Result(DomainError error) => Failure(error);
}
