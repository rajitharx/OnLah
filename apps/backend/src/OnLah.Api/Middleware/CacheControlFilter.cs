namespace OnLah.Api.Middleware;

internal sealed class CacheControlFilter(string headerValue, bool successOnly) : IEndpointFilter
{
    public ValueTask<object?> InvokeAsync(EndpointFilterInvocationContext context, EndpointFilterDelegate next)
    {
        var response = context.HttpContext.Response;

        if (!successOnly)
            response.Headers.CacheControl = headerValue;
        else
            response.OnStarting(() =>
            {
                if (response.StatusCode == StatusCodes.Status200OK)
                    response.Headers.CacheControl = headerValue;
                return Task.CompletedTask;
            });

        return next(context);
    }
}

internal static class CacheControlExtensions
{
    internal static TBuilder CachePublic<TBuilder>(this TBuilder builder, TimeSpan maxAge)
        where TBuilder : IEndpointConventionBuilder =>
        builder.AddEndpointFilter(new CacheControlFilter($"public, max-age={(int)maxAge.TotalSeconds}", successOnly: true));

    internal static TBuilder CachePrivate<TBuilder>(this TBuilder builder, TimeSpan maxAge)
        where TBuilder : IEndpointConventionBuilder =>
        builder.AddEndpointFilter(new CacheControlFilter($"private, max-age={(int)maxAge.TotalSeconds}", successOnly: true));

    internal static TBuilder NoStore<TBuilder>(this TBuilder builder)
        where TBuilder : IEndpointConventionBuilder =>
        builder.AddEndpointFilter(new CacheControlFilter("no-store", successOnly: false));
}
