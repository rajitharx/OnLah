using Microsoft.EntityFrameworkCore;
using OnLah.Domain.BusNetwork;
using OnLah.Domain.BusStops;

namespace OnLah.Infrastructure.Persistence;

public sealed class OnLahDbContext : DbContext
{
    public OnLahDbContext(DbContextOptions<OnLahDbContext> options) : base(options) { }

    public DbSet<BusStop> BusStops => Set<BusStop>();
    public DbSet<BusService> BusServices => Set<BusService>();
    public DbSet<BusRoute> BusRoutes => Set<BusRoute>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(OnLahDbContext).Assembly);
        base.OnModelCreating(modelBuilder);
    }
}
