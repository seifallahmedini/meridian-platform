namespace MeridianPlatform.Domain;

public class Location
{
    public Guid Id { get; set; }
    public required string OwnerId { get; set; }
    public required string Label { get; set; }
    public required string AddressLine1 { get; set; }
    public string? AddressLine2 { get; set; }
    public required string City { get; set; }
    public required string State { get; set; }
    public required string PostalCode { get; set; }
    public required string Country { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}
