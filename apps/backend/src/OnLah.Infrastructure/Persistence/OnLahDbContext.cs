using Microsoft.EntityFrameworkCore;
using OnLah.Domain.BusStops;

namespace OnLah.Infrastructure.Persistence;

public sealed class OnLahDbContext : DbContext
{
    public OnLahDbContext(DbContextOptions<OnLahDbContext> options) : base(options) { }

    public DbSet<BusStop> BusStops => Set<BusStop>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(OnLahDbContext).Assembly);
        base.OnModelCreating(modelBuilder);
    }
}
