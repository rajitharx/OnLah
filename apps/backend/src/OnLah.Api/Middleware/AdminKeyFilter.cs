using OnLah.Application.Admin;

namespace OnLah.Api.Middleware;

internal sealed class AdminKeyFilter(AdminKeyValidator validator) : IEndpointFilter
{
    internal const string HeaderName = "X-Admin-Key";

    public async ValueTask<object?> InvokeAsync(EndpointFilterInvocationContext context, EndpointFilterDelegate next)
    {
        var providedKey = context.HttpContext.Request.Headers[HeaderName].FirstOrDefault();

        if (!validator.IsValid(providedKey))
            return Results.Problem(
                title: "Admin key is missing or invalid.",
                statusCode: StatusCodes.Status401Unauthorized);

        return await next(context);
    }
}
