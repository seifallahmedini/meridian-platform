using FluentValidation;

namespace MeridianPlatform.Application.SampleWidgets;

public class CreateSampleWidgetRequestValidator : AbstractValidator<CreateSampleWidgetRequest>
{
    public CreateSampleWidgetRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty()
            .MaximumLength(200);
    }
}
