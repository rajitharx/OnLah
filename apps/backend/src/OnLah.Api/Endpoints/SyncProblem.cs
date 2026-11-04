using Microsoft.AspNetCore.Http.HttpResults;
using OnLah.Domain.Common;

namespace OnLah.Api.Endpoints;

internal static class SyncProblem
{
    internal static ProblemHttpResult From(DomainError error) =>
        TypedResults.Problem(
            detail: error.Kind == ErrorKind.Conflict
                ? error.Description
                : "LTA sent an empty or truncated dataset. Stored data was kept.",
            statusCode: error.Kind == ErrorKind.Conflict
                ? StatusCodes.Status409Conflict
                : StatusCodes.Status502BadGateway);
}
