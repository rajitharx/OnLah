using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OnLah.Domain.BusStops;

namespace OnLah.Infrastructure.Persistence.Configurations;

internal sealed class BusStopConfiguration : IEntityTypeConfiguration<BusStop>
{
    public void Configure(EntityTypeBuilder<BusStop> builder)
    {
        builder.HasKey(s => s.BusStopCode);
        builder.Property(s => s.BusStopCode).HasMaxLength(5).IsRequired();
        builder.Property(s => s.RoadName).HasMaxLength(100).IsRequired();
        builder.Property(s => s.Description).HasMaxLength(200).IsRequired();
    }
}
