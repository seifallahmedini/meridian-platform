namespace MeridianPlatform.Api.Endpoints;

public record HealthResponse(string Status);

public static class HealthEndpoints
{
    public static void MapHealthEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/health", () => Results.Ok(new HealthResponse("healthy")))
            .AllowAnonymous()
            .WithName("GetHealth")
            .WithTags("Health")
            .Produces<HealthResponse>();
    }
}
