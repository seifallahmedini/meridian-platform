using FluentValidation;
using MeridianPlatform.Domain;

namespace MeridianPlatform.Application.Shipments;

/// <summary>
/// Applied when saving a shipment as a draft: types/ranges only, nothing required —
/// a draft may have any subset of fields filled in.
/// </summary>
public class SaveDraftShipmentRequestValidator : AbstractValidator<SaveShipmentRequest>
{
    public SaveDraftShipmentRequestValidator()
    {
        RuleFor(x => x.WeightKg).GreaterThan(0).When(x => x.WeightKg.HasValue);
        RuleFor(x => x.LengthCm).GreaterThan(0).When(x => x.LengthCm.HasValue);
        RuleFor(x => x.WidthCm).GreaterThan(0).When(x => x.WidthCm.HasValue);
        RuleFor(x => x.HeightCm).GreaterThan(0).When(x => x.HeightCm.HasValue);
        RuleFor(x => x.FreightClass)
            .Must(fc => FreightClasses.All.Contains(fc!))
            .When(x => x.FreightClass is not null)
            .WithMessage("Freight class must be one of the supported NMFC classes.");
        RuleFor(x => x.ServiceLevel).IsInEnum().When(x => x.ServiceLevel.HasValue);
    }
}
