using MeridianPlatform.Domain;
using Microsoft.EntityFrameworkCore;

namespace MeridianPlatform.Infrastructure.Persistence;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<SampleWidget> SampleWidgets => Set<SampleWidget>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<SampleWidget>(entity =>
        {
            entity.ToTable("SampleWidgets");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
            entity.Property(e => e.CreatedAt).IsRequired();
        });
    }
}
