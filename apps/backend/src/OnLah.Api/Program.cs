using OnLah.Api.Extensions;
using OnLah.Infrastructure.Extensions;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddApiServices(builder.Configuration);
builder.Services.AddInfrastructureServices(builder.Configuration);

var app = builder.Build();

app.UseForwardedHeaders();
app.UseExceptionHandler();
app.UseSecurityHeaders();
app.UseCors("AllowedOrigins");

if (app.Environment.IsDevelopment())
    app.MapOpenApi();

app.MapApiEndpoints();

app.Run();

public partial class Program { }
