using FluentValidation;
using MeridianPlatform.Domain;
using MeridianPlatform.Infrastructure.Persistence;

namespace MeridianPlatform.Application.Shipments;

/// <summary>
/// Applied when saving a shipment as a draft: types/ranges only, nothing required —
/// a draft may have any subset of fields filled in.
/// </summary>
public class SaveDraftShipmentRequestValidator : AbstractValidator<SaveShipmentRequest>
{
    public SaveDraftShipmentRequestValidator(AppDbContext dbContext)
    {
        RuleFor(x => x.OriginLocationId).MustBeOwnedLocation(dbContext).When(x => x.OriginLocationId.HasValue);
        RuleFor(x => x.DestinationLocationId).MustBeOwnedLocation(dbContext).When(x => x.DestinationLocationId.HasValue);

        RuleFor(x => x.WeightKg).GreaterThan(0).When(x => x.WeightKg.HasValue);
        RuleFor(x => x.LengthCm).GreaterThan(0).When(x => x.LengthCm.HasValue);
        RuleFor(x => x.WidthCm).GreaterThan(0).When(x => x.WidthCm.HasValue);
        RuleFor(x => x.HeightCm).GreaterThan(0).When(x => x.HeightCm.HasValue);
        RuleFor(x => x.FreightClass)
            .Must(fc => FreightClasses.All.Contains(fc!))
            .When(x => x.FreightClass is not null)
            .WithMessage("Freight class must be one of the supported NMFC classes.");
        RuleFor(x => x.ServiceLevel)
            .Must(sl => Enum.TryParse<ServiceLevel>(sl, out _))
            .When(x => x.ServiceLevel is not null)
            .WithMessage("Service level must be one of Standard, Expedited, Guaranteed.");
    }
}
