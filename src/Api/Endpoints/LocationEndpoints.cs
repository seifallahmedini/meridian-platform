using System.Security.Claims;
using FluentValidation;
using MeridianPlatform.Application.Locations;

namespace MeridianPlatform.Api.Endpoints;

public static class LocationEndpoints
{
    public static void MapLocationEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/locations").WithTags("Locations").RequireAuthorization();

        group.MapGet("/", async (
                string? query,
                ClaimsPrincipal user,
                LocationService service,
                CancellationToken cancellationToken) =>
                Results.Ok(await service.SearchAsync(user.GetOwnerId(), query, cancellationToken)))
            .WithName("GetLocations")
            .Produces<IReadOnlyList<LocationDto>>();

        group.MapPost("/", async (
                CreateLocationRequest request,
                ClaimsPrincipal user,
                LocationService service,
                IValidator<CreateLocationRequest> validator,
                CancellationToken cancellationToken) =>
            {
                var validationResult = await validator.ValidateAsync(request, cancellationToken);
                if (!validationResult.IsValid)
                {
                    return Results.ValidationProblem(validationResult.ToDictionary());
                }

                var created = await service.CreateAsync(user.GetOwnerId(), request, cancellationToken);
                return Results.Created($"/api/v1/locations/{created.Id}", created);
            })
            .WithName("CreateLocation")
            .Produces<LocationDto>(StatusCodes.Status201Created)
            .ProducesValidationProblem();
    }
}
