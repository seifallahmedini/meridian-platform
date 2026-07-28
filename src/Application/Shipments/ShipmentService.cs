using MeridianPlatform.Domain;
using MeridianPlatform.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace MeridianPlatform.Application.Shipments;

public class ShipmentService(AppDbContext dbContext)
{
    public async Task<ShipmentDto?> CreateAsync(
        string ownerId, SaveShipmentRequest request, CancellationToken cancellationToken = default)
    {
        var shipment = new Shipment
        {
            Id = Guid.NewGuid(),
            OwnerId = ownerId,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow,
        };

        Apply(shipment, request);

        dbContext.Shipments.Add(shipment);
        await dbContext.SaveChangesAsync(cancellationToken);

        return await GetByIdAsync(ownerId, shipment.Id, cancellationToken);
    }

    public async Task<ShipmentDto?> UpdateAsync(
        string ownerId, Guid id, SaveShipmentRequest request, CancellationToken cancellationToken = default)
    {
        var shipment = await dbContext.Shipments
            .FirstOrDefaultAsync(s => s.Id == id && s.OwnerId == ownerId, cancellationToken);

        if (shipment is null || shipment.Status != ShipmentStatus.Draft)
        {
            return null;
        }

        Apply(shipment, request);
        shipment.UpdatedAt = DateTimeOffset.UtcNow;

        await dbContext.SaveChangesAsync(cancellationToken);

        return await GetByIdAsync(ownerId, shipment.Id, cancellationToken);
    }

    public async Task<ShipmentDto?> GetByIdAsync(
        string ownerId, Guid id, CancellationToken cancellationToken = default)
    {
        return await Project(dbContext.Shipments.Where(s => s.Id == id && s.OwnerId == ownerId))
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<ShipmentSummaryDto>> ListAsync(
        string ownerId, ShipmentStatus? status, CancellationToken cancellationToken = default)
    {
        var shipments = dbContext.Shipments.Where(s => s.OwnerId == ownerId);

        if (status.HasValue)
        {
            shipments = shipments.Where(s => s.Status == status.Value);
        }

        return await shipments
            .OrderByDescending(s => s.UpdatedAt)
            .Select(s => new ShipmentSummaryDto(
                s.Id,
                dbContext.Locations.Where(l => l.Id == s.OriginLocationId).Select(l => l.Label).FirstOrDefault(),
                dbContext.Locations.Where(l => l.Id == s.DestinationLocationId).Select(l => l.Label).FirstOrDefault(),
                s.ServiceLevel,
                s.UpdatedAt))
            .ToListAsync(cancellationToken);
    }

    private static void Apply(Shipment shipment, SaveShipmentRequest request)
    {
        shipment.OriginLocationId = request.OriginLocationId;
        shipment.DestinationLocationId = request.DestinationLocationId;
        shipment.WeightKg = request.WeightKg;
        shipment.LengthCm = request.LengthCm;
        shipment.WidthCm = request.WidthCm;
        shipment.HeightCm = request.HeightCm;
        shipment.FreightClass = request.FreightClass;
        shipment.IsHazmat = request.IsHazmat;
        shipment.HazmatUnNumber = request.IsHazmat ? request.HazmatUnNumber : null;
        shipment.HazmatPackingGroup = request.IsHazmat ? request.HazmatPackingGroup : null;
        shipment.HazmatEmergencyContact = request.IsHazmat ? request.HazmatEmergencyContact : null;
        shipment.ServiceLevel = request.ServiceLevel;
        shipment.Status = request.IsDraft ? ShipmentStatus.Draft : ShipmentStatus.Submitted;
    }

    private IQueryable<ShipmentDto> Project(IQueryable<Shipment> shipments) =>
        shipments.Select(s => new ShipmentDto(
            s.Id,
            s.OriginLocationId,
            dbContext.Locations.Where(l => l.Id == s.OriginLocationId).Select(l => l.Label).FirstOrDefault(),
            s.DestinationLocationId,
            dbContext.Locations.Where(l => l.Id == s.DestinationLocationId).Select(l => l.Label).FirstOrDefault(),
            s.WeightKg,
            s.LengthCm,
            s.WidthCm,
            s.HeightCm,
            s.FreightClass,
            s.IsHazmat,
            s.HazmatUnNumber,
            s.HazmatPackingGroup,
            s.HazmatEmergencyContact,
            s.ServiceLevel,
            s.Status,
            s.CreatedAt,
            s.UpdatedAt));
}
