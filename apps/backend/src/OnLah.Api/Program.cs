using OnLah.Api.Extensions;
using OnLah.Infrastructure.Extensions;
using OnLah.Infrastructure.Persistence;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddApiServices(builder.Configuration);
builder.Services.AddInfrastructureServices(builder.Configuration);

var app = builder.Build();

// Initialise DB schema. Replace EnsureCreated with MigrateAsync once migrations are added:
//   dotnet ef migrations add InitialCreate --project src/OnLah.Infrastructure --startup-project src/OnLah.Api
await using (var scope = app.Services.CreateAsyncScope())
{
    var db = scope.ServiceProvider.GetRequiredService<OnLahDbContext>();
    await db.Database.EnsureCreatedAsync();
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
