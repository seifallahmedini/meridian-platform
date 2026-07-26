using MeridianPlatform.Domain;
using MeridianPlatform.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace MeridianPlatform.Application.SampleWidgets;

public class SampleWidgetService(AppDbContext dbContext)
{
    public async Task<IReadOnlyList<SampleWidgetDto>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await dbContext.SampleWidgets
            .OrderBy(w => w.CreatedAt)
            .Select(w => new SampleWidgetDto(w.Id, w.Name, w.CreatedAt))
            .ToListAsync(cancellationToken);
    }

    public async Task<SampleWidgetDto> CreateAsync(CreateSampleWidgetRequest request, CancellationToken cancellationToken = default)
    {
        var widget = new SampleWidget
        {
            Id = Guid.NewGuid(),
            Name = request.Name,
            CreatedAt = DateTimeOffset.UtcNow,
        };

        dbContext.SampleWidgets.Add(widget);
        await dbContext.SaveChangesAsync(cancellationToken);

        return new SampleWidgetDto(widget.Id, widget.Name, widget.CreatedAt);
    }
}
