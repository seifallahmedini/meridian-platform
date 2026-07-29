using MeridianPlatform.Domain;
using MeridianPlatform.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace MeridianPlatform.Application.Locations;

public class LocationService(AppDbContext dbContext)
{
    public async Task<IReadOnlyList<LocationDto>> SearchAsync(
        string ownerId, string? query, CancellationToken cancellationToken = default)
    {
        var locations = dbContext.Locations.Where(l => l.OwnerId == ownerId);

        if (!string.IsNullOrWhiteSpace(query))
        {
            var pattern = $"%{query}%";
            locations = locations.Where(l =>
                EF.Functions.ILike(l.Label, pattern) || EF.Functions.ILike(l.City, pattern));
        }

        return await locations
            .OrderBy(l => l.Label)
            .Select(l => ToDto(l))
            .ToListAsync(cancellationToken);
    }

    public async Task<LocationDto> CreateAsync(
        string ownerId, CreateLocationRequest request, CancellationToken cancellationToken = default)
    {
        var location = new Location
        {
            Id = Guid.NewGuid(),
            OwnerId = ownerId,
            Label = request.Label,
            AddressLine1 = request.AddressLine1,
            AddressLine2 = request.AddressLine2,
            City = request.City,
            State = request.State,
            PostalCode = request.PostalCode,
            Country = request.Country,
            CreatedAt = DateTimeOffset.UtcNow,
        };

        dbContext.Locations.Add(location);
        await dbContext.SaveChangesAsync(cancellationToken);

        return ToDto(location);
    }

    private static LocationDto ToDto(Location l) => new(
        l.Id, l.Label, l.AddressLine1, l.AddressLine2, l.City, l.State, l.PostalCode, l.Country);
}
