namespace MeridianPlatform.Application.SampleWidgets;

public record SampleWidgetDto(Guid Id, string Name, DateTimeOffset CreatedAt);

public record CreateSampleWidgetRequest(string Name);
