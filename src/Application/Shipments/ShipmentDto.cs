using MeridianPlatform.Domain;

namespace MeridianPlatform.Application.Shipments;

public record ShipmentDto(
    Guid Id,
    Guid? OriginLocationId,
    string? OriginLocationLabel,
    Guid? DestinationLocationId,
    string? DestinationLocationLabel,
    decimal? WeightKg,
    decimal? LengthCm,
    decimal? WidthCm,
    decimal? HeightCm,
    string? FreightClass,
    bool IsHazmat,
    string? HazmatUnNumber,
    string? HazmatPackingGroup,
    string? HazmatEmergencyContact,
    ServiceLevel? ServiceLevel,
    ShipmentStatus Status,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt
);

public record ShipmentSummaryDto(
    Guid Id,
    string? OriginLocationLabel,
    string? DestinationLocationLabel,
    ServiceLevel? ServiceLevel,
    DateTimeOffset UpdatedAt
);

public record SaveShipmentRequest(
    Guid? OriginLocationId,
    Guid? DestinationLocationId,
    decimal? WeightKg,
    decimal? LengthCm,
    decimal? WidthCm,
    decimal? HeightCm,
    string? FreightClass,
    bool IsHazmat,
    string? HazmatUnNumber,
    string? HazmatPackingGroup,
    string? HazmatEmergencyContact,
    ServiceLevel? ServiceLevel,
    bool IsDraft
);
