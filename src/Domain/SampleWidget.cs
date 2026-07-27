namespace MeridianPlatform.Domain;

public class SampleWidget
{
    public Guid Id { get; set; }
    public required string Name { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}
