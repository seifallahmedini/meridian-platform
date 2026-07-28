using FluentValidation;
using MeridianPlatform.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace MeridianPlatform.Application.Shipments;

/// <summary>
/// Shared by both shipment validators: confirms Origin/DestinationLocationId resolve to a
/// Location owned by the caller, so a cross-tenant GUID 400s here instead of either leaking
/// another owner's address (no check at all) or 500ing on an FK violation (nonexistent GUID).
/// The caller's OwnerId travels via ValidationContext.RootContextData, since FluentValidation
/// validators are resolved from DI without per-request data.
/// </summary>
public static class LocationOwnershipRule
{
    public const string OwnerIdContextKey = "OwnerId";

    public static IRuleBuilderOptions<SaveShipmentRequest, Guid?> MustBeOwnedLocation(
        this IRuleBuilder<SaveShipmentRequest, Guid?> ruleBuilder, AppDbContext dbContext) =>
        ruleBuilder
            .MustAsync(async (_, locationId, context, cancellationToken) =>
            {
                var ownerId = (string)context.RootContextData[OwnerIdContextKey];
                return await dbContext.Locations.AnyAsync(
                    l => l.Id == locationId && l.OwnerId == ownerId, cancellationToken);
            })
            .WithMessage("Location was not found.");
}
