using System.Security.Claims;
using FluentValidation;
using MeridianPlatform.Application.Shipments;
using MeridianPlatform.Domain;

namespace MeridianPlatform.Api.Endpoints;

public static class ShipmentEndpoints
{
    public static void MapShipmentEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/shipments").WithTags("Shipments").RequireAuthorization();

        group.MapPost("/", async (
                SaveShipmentRequest request,
                ClaimsPrincipal user,
                ShipmentService service,
                IEnumerable<IValidator<SaveShipmentRequest>> validators,
                CancellationToken cancellationToken) =>
            {
                var validator = PickValidator(validators, request.IsDraft);
                var validationResult = await validator.ValidateAsync(
                    BuildValidationContext(request, user.GetOwnerId()), cancellationToken);
                if (!validationResult.IsValid)
                {
                    return Results.ValidationProblem(validationResult.ToDictionary());
                }

                var created = await service.CreateAsync(user.GetOwnerId(), request, cancellationToken);
                return Results.Created($"/api/v1/shipments/{created!.Id}", created);
            })
            .WithName("CreateShipment")
            .Produces<ShipmentDto>(StatusCodes.Status201Created)
            .ProducesValidationProblem()
            .Produces(StatusCodes.Status401Unauthorized);

        group.MapPut("/{id:guid}", async (
                Guid id,
                SaveShipmentRequest request,
                ClaimsPrincipal user,
                ShipmentService service,
                IEnumerable<IValidator<SaveShipmentRequest>> validators,
                CancellationToken cancellationToken) =>
            {
                var validator = PickValidator(validators, request.IsDraft);
                var validationResult = await validator.ValidateAsync(
                    BuildValidationContext(request, user.GetOwnerId()), cancellationToken);
                if (!validationResult.IsValid)
                {
                    return Results.ValidationProblem(validationResult.ToDictionary());
                }

                var updated = await service.UpdateAsync(user.GetOwnerId(), id, request, cancellationToken);
                return updated is null ? Results.NotFound() : Results.Ok(updated);
            })
            .WithName("UpdateShipment")
            .Produces<ShipmentDto>()
            .Produces(StatusCodes.Status404NotFound)
            .ProducesValidationProblem()
            .Produces(StatusCodes.Status401Unauthorized);

        group.MapGet("/", async (
                ShipmentStatus? status,
                ClaimsPrincipal user,
                ShipmentService service,
                CancellationToken cancellationToken) =>
                Results.Ok(await service.ListAsync(user.GetOwnerId(), status, cancellationToken)))
            .WithName("GetShipments")
            .Produces<IReadOnlyList<ShipmentSummaryDto>>()
            .Produces(StatusCodes.Status401Unauthorized);

        group.MapGet("/{id:guid}", async (
                Guid id,
                ClaimsPrincipal user,
                ShipmentService service,
                CancellationToken cancellationToken) =>
            {
                var shipment = await service.GetByIdAsync(user.GetOwnerId(), id, cancellationToken);
                return shipment is null ? Results.NotFound() : Results.Ok(shipment);
            })
            .WithName("GetShipmentById")
            .Produces<ShipmentDto>()
            .Produces(StatusCodes.Status404NotFound)
            .Produces(StatusCodes.Status401Unauthorized);
    }

    private static IValidator<SaveShipmentRequest> PickValidator(
        IEnumerable<IValidator<SaveShipmentRequest>> validators, bool isDraft) =>
        isDraft
            ? validators.OfType<SaveDraftShipmentRequestValidator>().Single()
            : validators.OfType<SubmitShipmentRequestValidator>().Single();

    private static ValidationContext<SaveShipmentRequest> BuildValidationContext(
        SaveShipmentRequest request, string ownerId)
    {
        var context = new ValidationContext<SaveShipmentRequest>(request);
        context.RootContextData[LocationOwnershipRule.OwnerIdContextKey] = ownerId;
        return context;
    }
}
