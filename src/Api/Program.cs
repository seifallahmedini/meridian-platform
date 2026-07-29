using System.Text.Json.Serialization;
using FluentValidation;
using MeridianPlatform.Api.Endpoints;
using MeridianPlatform.Api.Middleware;
using MeridianPlatform.Application.Locations;
using MeridianPlatform.Application.SampleWidgets;
using MeridianPlatform.Application.Shipments;
using MeridianPlatform.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using OpenTelemetry.Trace;
using Scalar.AspNetCore;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

builder.Host.UseSerilog((context, configuration) =>
    configuration.ReadFrom.Configuration(context.Configuration).WriteTo.Console());

builder.Services.AddOpenApi();
builder.Services.ConfigureHttpJsonOptions(options =>
    options.SerializerOptions.Converters.Add(new JsonStringEnumConverter()));

const string WebCorsPolicy = "Web";
var webOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
    ?? ["http://localhost:5173", "http://localhost:4173"];
builder.Services.AddCors(options =>
    options.AddPolicy(WebCorsPolicy, policy => policy
        .WithOrigins(webOrigins)
        .AllowAnyHeader()
        .AllowAnyMethod()));

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("Postgres")));

builder.Services.AddScoped<SampleWidgetService>();
builder.Services.AddScoped<LocationService>();
builder.Services.AddScoped<ShipmentService>();
builder.Services.AddValidatorsFromAssemblyContaining<CreateSampleWidgetRequestValidator>();

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.Authority = builder.Configuration["Keycloak:Authority"];
        options.Audience = builder.Configuration["Keycloak:Audience"];
        options.RequireHttpsMetadata = !builder.Environment.IsDevelopment();
    });
builder.Services.AddAuthorization();

builder.Services.AddOpenTelemetry()
    .WithTracing(tracing => tracing
        .AddAspNetCoreInstrumentation()
        .AddSource(builder.Environment.ApplicationName)
        .AddConsoleExporter());

builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
builder.Services.AddProblemDetails();

var app = builder.Build();

app.UseExceptionHandler();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference();

    using var scope = app.Services.CreateScope();
    await scope.ServiceProvider.GetRequiredService<AppDbContext>().Database.MigrateAsync();
}

app.UseCors(WebCorsPolicy);

app.UseAuthentication();
app.UseAuthorization();

app.MapHealthEndpoints();
app.MapSampleEndpoints();
app.MapLocationEndpoints();
app.MapShipmentEndpoints();

app.Run();

public partial class Program;
