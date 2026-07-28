namespace MeridianPlatform.Domain;

public class Shipment
{
    public Guid Id { get; set; }
    public required string OwnerId { get; set; }
    public Guid? OriginLocationId { get; set; }
    public Guid? DestinationLocationId { get; set; }
    public decimal? WeightKg { get; set; }
    public decimal? LengthCm { get; set; }
    public decimal? WidthCm { get; set; }
    public decimal? HeightCm { get; set; }
    public string? FreightClass { get; set; }
    public bool IsHazmat { get; set; }
    public string? HazmatUnNumber { get; set; }
    public string? HazmatPackingGroup { get; set; }
    public string? HazmatEmergencyContact { get; set; }
    public ServiceLevel? ServiceLevel { get; set; }
    public ShipmentStatus Status { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
}
