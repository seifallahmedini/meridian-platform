using MeridianPlatform.Domain;
using Microsoft.EntityFrameworkCore;

namespace MeridianPlatform.Infrastructure.Persistence;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<SampleWidget> SampleWidgets => Set<SampleWidget>();
    public DbSet<Location> Locations => Set<Location>();
    public DbSet<Shipment> Shipments => Set<Shipment>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<SampleWidget>(entity =>
        {
            entity.ToTable("SampleWidgets");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
            entity.Property(e => e.CreatedAt).IsRequired();
        });

        modelBuilder.Entity<Location>(entity =>
        {
            entity.ToTable("Locations");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.OwnerId).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Label).IsRequired().HasMaxLength(200);
            entity.Property(e => e.AddressLine1).IsRequired().HasMaxLength(200);
            entity.Property(e => e.AddressLine2).HasMaxLength(200);
            entity.Property(e => e.City).IsRequired().HasMaxLength(100);
            entity.Property(e => e.State).IsRequired().HasMaxLength(100);
            entity.Property(e => e.PostalCode).IsRequired().HasMaxLength(20);
            entity.Property(e => e.Country).IsRequired().HasMaxLength(100);
            entity.Property(e => e.CreatedAt).IsRequired();
            entity.HasIndex(e => e.OwnerId);
        });

        modelBuilder.Entity<Shipment>(entity =>
        {
            entity.ToTable("Shipments");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.OwnerId).IsRequired().HasMaxLength(200);
            entity.Property(e => e.FreightClass).HasMaxLength(10);
            entity.Property(e => e.HazmatUnNumber).HasMaxLength(20);
            entity.Property(e => e.HazmatPackingGroup).HasMaxLength(10);
            entity.Property(e => e.HazmatEmergencyContact).HasMaxLength(200);
            entity.Property(e => e.CreatedAt).IsRequired();
            entity.Property(e => e.UpdatedAt).IsRequired();
            entity.HasIndex(e => new { e.OwnerId, e.Status });

            entity.HasOne<Location>()
                .WithMany()
                .HasForeignKey(e => e.OriginLocationId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne<Location>()
                .WithMany()
                .HasForeignKey(e => e.DestinationLocationId)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }
}
