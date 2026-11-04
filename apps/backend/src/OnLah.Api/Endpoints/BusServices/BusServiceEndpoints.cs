using FluentValidation;
using Microsoft.AspNetCore.Http.HttpResults;
using OnLah.Api.Middleware;
using OnLah.Application.BusServices;
using OnLah.Domain.Common;

namespace OnLah.Api.Endpoints.BusServices;

internal static partial class BusServiceEndpoints
{
    private static readonly TimeSpan ReferenceDataMaxAge = TimeSpan.FromHours(1);

    internal static RouteGroupBuilder MapBusServiceEndpoints(this RouteGroupBuilder group)
    {
        group.MapGet("bus-services/{serviceNo}", GetDetailsAsync).CachePublic(ReferenceDataMaxAge);
        group.MapPost("admin/bus-network/sync", SyncAsync).AddEndpointFilter<AdminKeyFilter>();
        return group;
    }

    private static async Task<Results<Ok<BusServiceDetailsDto>, ProblemHttpResult>> GetDetailsAsync(
        string serviceNo,
        GetBusServiceDetailsService service,
        IValidator<GetBusServiceRequest> validator,
        CancellationToken cancellationToken)
    {
        var validation = await validator.ValidateAsync(new GetBusServiceRequest(serviceNo), cancellationToken);
        if (!validation.IsValid)
            return TypedResults.Problem(
                detail: string.Join("; ", validation.Errors.Select(e => e.ErrorMessage)),
                statusCode: StatusCodes.Status422UnprocessableEntity);

        var result = await service.GetAsync(serviceNo, cancellationToken);
        if (result.IsFailure)
            return TypedResults.Problem(
                detail: result.Error.Description,
                statusCode: result.Error.Kind == ErrorKind.NotFound
                    ? StatusCodes.Status404NotFound
                    : StatusCodes.Status500InternalServerError);

        return TypedResults.Ok(result.Value!);
    }

    private static async Task<Results<Ok<BusNetworkSyncResult>, ProblemHttpResult>> SyncAsync(
        BusNetworkSyncService syncService,
        ILogger<BusNetworkSyncService> logger,
        CancellationToken cancellationToken)
    {
        try
        {
            var result = await syncService.SyncAsync(cancellationToken);
            return result.IsSuccess ? TypedResults.Ok(result.Value!) : SyncProblem.From(result.Error);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            LogSyncFailed(logger, ex);
            return TypedResults.Problem(
                detail: "Bus network sync failed. Check server logs for details.",
                statusCode: StatusCodes.Status502BadGateway);
        }
    }

    [LoggerMessage(Level = LogLevel.Error, Message = "Bus network sync failed")]
    private static partial void LogSyncFailed(ILogger logger, Exception exception);
}

internal sealed record GetBusServiceRequest(string ServiceNo);

internal sealed class GetBusServiceValidator : AbstractValidator<GetBusServiceRequest>
{
    public GetBusServiceValidator()
    {
        RuleFor(x => x.ServiceNo)
            .NotEmpty()
            .MaximumLength(10)
            .Matches(@"^[A-Za-z0-9]+\z").WithMessage("Service number must be letters and digits only.");
    }
}
