namespace MeridianPlatform.Api.Endpoints;

public static class HealthEndpoints
{
    public static void MapHealthEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/health", () => Results.Ok(new { status = "healthy" }))
            .AllowAnonymous()
            .WithName("GetHealth")
            .WithTags("Health");
    }
}
