# Build from the repository root: docker build -t onlah-api .
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY apps/backend/global.json apps/backend/Directory.Build.props apps/backend/Directory.Packages.props ./
COPY apps/backend/src/ ./src/
RUN dotnet restore src/OnLah.Api/OnLah.Api.csproj
RUN dotnet publish src/OnLah.Api/OnLah.Api.csproj -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
ENV ASPNETCORE_ENVIRONMENT=Production
COPY --from=build /app/publish .
USER app
EXPOSE 8080

# Render injects PORT. The shell form lets it expand.
CMD ["sh", "-c", "ASPNETCORE_URLS=http://+:${PORT:-8080} exec dotnet OnLah.Api.dll"]
