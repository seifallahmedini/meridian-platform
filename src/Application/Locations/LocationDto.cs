namespace MeridianPlatform.Application.Locations;

public record LocationDto(
    Guid Id,
    string Label,
    string AddressLine1,
    string? AddressLine2,
    string City,
    string State,
    string PostalCode,
    string Country
);

public record CreateLocationRequest(
    string Label,
    string AddressLine1,
    string? AddressLine2,
    string City,
    string State,
    string PostalCode,
    string Country
);
