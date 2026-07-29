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
    // Wire contract uses a plain string (not the ServiceLevel enum) because ASP.NET Core's
    // OpenAPI 3.1 output represents a nullable enum property as oneOf:[null, $ref], which NSwag's
    // TypeScript client generator does not resolve back to the shared enum — it synthesizes a
    // fresh duplicate type per occurrence instead. A plain string avoids the bug entirely; the
    // enum is still enforced server-side (see the FluentValidation validators).
    string? ServiceLevel,
    ShipmentStatus Status,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt
);

public record ShipmentSummaryDto(
    Guid Id,
    string? OriginLocationLabel,
    string? DestinationLocationLabel,
    string? ServiceLevel,
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
    string? ServiceLevel,
    bool IsDraft
);
