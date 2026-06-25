using FluentValidation;
using Microsoft.AspNetCore.Http.HttpResults;
using OnLah.Application.BusStops;

namespace OnLah.Api.Endpoints.BusStops;

internal static class BusStopEndpoints
{
    internal static RouteGroupBuilder MapBusStopEndpoints(this RouteGroupBuilder group)
    {
        group.MapGet("bus-stops/nearby", GetNearbyAsync);
        group.MapPost("admin/bus-stops/sync", TriggerSyncAsync);
        return group;
    }

    private static async Task<Results<Ok<IReadOnlyList<BusStopDto>>, ProblemHttpResult>> GetNearbyAsync(
        double lat,
        double lng,
        double radiusMeters,
        GetNearbyStopsService service,
        IValidator<GetNearbyStopsRequest> validator,
        CancellationToken cancellationToken)
    {
        var validation = await validator.ValidateAsync(new GetNearbyStopsRequest(lat, lng, radiusMeters), cancellationToken);
        if (!validation.IsValid)
            return TypedResults.Problem(
                detail: string.Join("; ", validation.Errors.Select(e => e.ErrorMessage)),
                statusCode: StatusCodes.Status422UnprocessableEntity);

        var result = await service.GetNearbyAsync(lat, lng, radiusMeters, cancellationToken);

        if (result.IsFailure)
            return TypedResults.Problem(
                detail: result.Error.Description,
                statusCode: StatusCodes.Status500InternalServerError);

        return TypedResults.Ok(result.Value!);
    }

    private static async Task<Results<Ok<BusStopSyncResponse>, ProblemHttpResult>> TriggerSyncAsync(
        BusStopSyncService syncService,
        CancellationToken cancellationToken)
    {
        try
        {
            var count = await syncService.SyncAsync(cancellationToken);
            return TypedResults.Ok(new BusStopSyncResponse(count));
        }
        catch (Exception)
        {
            return TypedResults.Problem(
                detail: "Bus stop sync failed. Check server logs for details.",
                statusCode: StatusCodes.Status502BadGateway);
        }
    }
}

internal sealed record GetNearbyStopsRequest(double Lat, double Lng, double RadiusMeters);

internal sealed record BusStopSyncResponse(int StopsSynced);

internal sealed class GetNearbyStopsValidator : AbstractValidator<GetNearbyStopsRequest>
{
    public GetNearbyStopsValidator()
    {
        RuleFor(x => x.Lat).InclusiveBetween(-90, 90).WithMessage("Latitude must be between -90 and 90.");
        RuleFor(x => x.Lng).InclusiveBetween(-180, 180).WithMessage("Longitude must be between -180 and 180.");
        RuleFor(x => x.RadiusMeters).GreaterThan(0).LessThanOrEqualTo(5000)
            .WithMessage("Radius must be between 1 and 5000 metres.");
    }
}
