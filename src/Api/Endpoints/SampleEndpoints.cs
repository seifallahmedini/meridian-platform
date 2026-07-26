using FluentValidation;
using MeridianPlatform.Application.SampleWidgets;

namespace MeridianPlatform.Api.Endpoints;

public static class SampleEndpoints
{
    public static void MapSampleEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/sample-widgets").WithTags("SampleWidgets");

        group.MapGet("/", async (SampleWidgetService service, CancellationToken cancellationToken) =>
                Results.Ok(await service.GetAllAsync(cancellationToken)))
            .AllowAnonymous()
            .WithName("GetSampleWidgets")
            .Produces<IReadOnlyList<SampleWidgetDto>>();

        group.MapPost("/", async (
                CreateSampleWidgetRequest request,
                SampleWidgetService service,
                IValidator<CreateSampleWidgetRequest> validator,
                CancellationToken cancellationToken) =>
            {
                var validationResult = await validator.ValidateAsync(request, cancellationToken);
                if (!validationResult.IsValid)
                {
                    return Results.ValidationProblem(validationResult.ToDictionary());
                }

                var created = await service.CreateAsync(request, cancellationToken);
                return Results.Created($"/api/v1/sample-widgets/{created.Id}", created);
            })
            .AllowAnonymous()
            .WithName("CreateSampleWidget")
            .Produces<SampleWidgetDto>(StatusCodes.Status201Created)
            .ProducesValidationProblem();

        group.MapGet("/protected", async (SampleWidgetService service, CancellationToken cancellationToken) =>
                Results.Ok(await service.GetAllAsync(cancellationToken)))
            .RequireAuthorization()
            .WithName("GetSampleWidgetsProtected")
            .Produces<IReadOnlyList<SampleWidgetDto>>()
            .Produces(StatusCodes.Status401Unauthorized);
    }
}
