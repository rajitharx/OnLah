using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OnLah.Domain.BusNetwork;

namespace OnLah.Infrastructure.Persistence.Configurations;

internal sealed class BusServiceConfiguration : IEntityTypeConfiguration<BusService>
{
    public void Configure(EntityTypeBuilder<BusService> builder)
    {
        builder.ToTable("BusServices");
        builder.HasKey(s => new { s.ServiceNo, s.Direction });
        builder.Property(s => s.ServiceNo).HasMaxLength(10).IsRequired();
        builder.Property(s => s.Operator).HasMaxLength(10).IsRequired();
        builder.Property(s => s.Category).HasMaxLength(20).IsRequired();
        builder.Property(s => s.OriginCode).HasMaxLength(5).IsRequired();
        builder.Property(s => s.DestinationCode).HasMaxLength(5).IsRequired();
        builder.Property(s => s.AmPeakFreq).HasMaxLength(20);
        builder.Property(s => s.AmOffpeakFreq).HasMaxLength(20);
        builder.Property(s => s.PmPeakFreq).HasMaxLength(20);
        builder.Property(s => s.PmOffpeakFreq).HasMaxLength(20);
        builder.Property(s => s.LoopDesc).HasMaxLength(200);
    }
}

internal sealed class BusRouteConfiguration : IEntityTypeConfiguration<BusRoute>
{
    public void Configure(EntityTypeBuilder<BusRoute> builder)
    {
        builder.ToTable("BusRoutes");
        builder.HasKey(r => new { r.ServiceNo, r.Direction, r.StopSequence });
        builder.Property(r => r.ServiceNo).HasMaxLength(10).IsRequired();
        builder.Property(r => r.Operator).HasMaxLength(10).IsRequired();
        builder.Property(r => r.BusStopCode).HasMaxLength(5).IsRequired();
        builder.Property(r => r.WdFirst).HasMaxLength(4).IsRequired();
        builder.Property(r => r.WdLast).HasMaxLength(4).IsRequired();
        builder.Property(r => r.SatFirst).HasMaxLength(4).IsRequired();
        builder.Property(r => r.SatLast).HasMaxLength(4).IsRequired();
        builder.Property(r => r.SunFirst).HasMaxLength(4).IsRequired();
        builder.Property(r => r.SunLast).HasMaxLength(4).IsRequired();
        builder.HasIndex(r => r.ServiceNo);
        builder.HasIndex(r => r.BusStopCode);
    }
}
