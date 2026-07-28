using System.Text.RegularExpressions;
using FluentValidation;
using MeridianPlatform.Domain;

namespace MeridianPlatform.Application.Shipments;

/// <summary>
/// Applied when creating/updating a non-draft shipment: every cargo field is required, and the
/// hazmat fields become required when IsHazmat is set.
/// </summary>
public partial class SubmitShipmentRequestValidator : AbstractValidator<SaveShipmentRequest>
{
    public SubmitShipmentRequestValidator()
    {
        RuleFor(x => x.OriginLocationId).NotEmpty();
        RuleFor(x => x.DestinationLocationId).NotEmpty();
        RuleFor(x => x)
            .Must(x => x.OriginLocationId != x.DestinationLocationId)
            .WithMessage("Origin and destination must be different locations.")
            .WithName("DestinationLocationId")
            .When(x => x.OriginLocationId.HasValue && x.DestinationLocationId.HasValue);

        RuleFor(x => x.WeightKg).NotNull().GreaterThan(0);
        RuleFor(x => x.LengthCm).NotNull().GreaterThan(0);
        RuleFor(x => x.WidthCm).NotNull().GreaterThan(0);
        RuleFor(x => x.HeightCm).NotNull().GreaterThan(0);

        RuleFor(x => x.FreightClass)
            .NotEmpty()
            .Must(fc => FreightClasses.All.Contains(fc!))
            .WithMessage("Freight class must be one of the supported NMFC classes.");

        RuleFor(x => x.ServiceLevel).NotNull().IsInEnum();

        When(x => x.IsHazmat, () =>
        {
            RuleFor(x => x.HazmatUnNumber)
                .NotEmpty()
                .Must(v => UnNumberRegex().IsMatch(v!))
                .WithMessage("UN number must match the format UN####.");
            RuleFor(x => x.HazmatPackingGroup)
                .NotEmpty()
                .Must(v => v is "I" or "II" or "III")
                .WithMessage("Packing group must be I, II, or III.");
            RuleFor(x => x.HazmatEmergencyContact).NotEmpty();
        });
    }

    [GeneratedRegex(@"^UN\d{4}$")]
    private static partial Regex UnNumberRegex();
}
