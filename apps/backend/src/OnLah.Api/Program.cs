using Microsoft.EntityFrameworkCore;
using OnLah.Api.Extensions;
using OnLah.Infrastructure.Extensions;
using OnLah.Infrastructure.Persistence;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddApiServices(builder.Configuration);
builder.Services.AddInfrastructureServices(builder.Configuration);

var app = builder.Build();

// Apply pending migrations. Add one with:
//   dotnet ef migrations add <Name> --project src/OnLah.Infrastructure --startup-project src/OnLah.Api --output-dir Persistence/Migrations
await using (var scope = app.Services.CreateAsyncScope())
{
    var db = scope.ServiceProvider.GetRequiredService<OnLahDbContext>();
    await db.Database.MigrateAsync();
}

app.UseExceptionHandler();
app.UseSecurityHeaders();
app.UseCors("AllowedOrigins");

if (app.Environment.IsDevelopment())
    app.MapOpenApi();

app.UseHttpsRedirection();
app.MapApiEndpoints();

app.Run();

public partial class Program { }
