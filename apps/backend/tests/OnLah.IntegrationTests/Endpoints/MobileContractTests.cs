using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using Microsoft.Extensions.DependencyInjection;
using NSubstitute;
using OnLah.Application.BusArrivals;
using OnLah.Application.RouteTracker;
using OnLah.Application.TrainAlerts;
using OnLah.Domain.BusNetwork;
using OnLah.Domain.BusStops;
using OnLah.Domain.Common;
using OnLah.Infrastructure.Persistence;
using OnLah.IntegrationTests.Common;
using Xunit;

namespace OnLah.IntegrationTests.Endpoints;

/// <summary>
/// The mobile app reads these responses through the types in apps/mobile/src/types/domain.ts. Each endpoint the mobile
/// client calls is requested here through the real pipeline and compared with a fixture under
/// apps/mobile/__tests__/contract. The mobile test type-checks the same fixtures against its types and checks that its
/// client builds the same request. After an intended API change, run with UPDATE_CONTRACT_FIXTURES=1 and commit the files.
/// </summary>
public sealed class MobileContractTests(ApiFactory factory) : IClassFixture<ApiFactory>, IAsyncLifetime
{
    private const string UpdateVariable = "UPDATE_CONTRACT_FIXTURES";
    private const string FixedTime = "2026-01-01T00:00:00+00:00";

    private static readonly JsonSerializerOptions Pretty = new()
    {
        WriteIndented = true,
        Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping,
    };

    private readonly HttpClient _client = factory.CreateClient();

    public static TheoryData<string, string> Contracts => new()
    {
        { "bus-arrivals", "/api/v1/bus-arrivals?stopCode=83140" },
        { "bus-stops-nearby", "/api/v1/bus-stops/nearby?lat=1.305&lng=103.8&radiusMeters=500" },
        { "bus-stops-search", "/api/v1/bus-stops/search?query=Terminus" },
        { "train-alerts", "/api/v1/train-alerts" },
        { "bus-service", "/api/v1/bus-services/TRK1" },
        { "route-tracker", "/api/v1/route-tracker?busStopCode=90003&serviceNo=TRK1" },
        { "route-tracker-with-destination", "/api/v1/route-tracker?busStopCode=90003&serviceNo=TRK1&destinationCode=90003" },
    };

    public async Task InitializeAsync()
    {
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<OnLahDbContext>();
        StubLta();
        if (db.BusServices.Any(s => s.ServiceNo == "TRK1"))
        {
            return;
        }

        db.BusStops.AddRange(
            BusStop.Create("90001", "Contract Road", "Start", 1.3010, 103.8),
            BusStop.Create("90002", "Contract Road", "Middle", 1.3030, 103.8),
            BusStop.Create("90003", "Contract Road", "Terminus", 1.3050, 103.8),
            BusStop.Create("83140", "Contract Road", "Midway", 1.3060, 103.8));
        db.BusServices.AddRange(
            BusService.Create("TRK1", 1, "SBST", "TRUNK", "90001", "90003", "9-11", "09-13", "10-12", "12-16", null),
            BusService.Create("15", 1, "GAS", "TRUNK", "90001", "90003", "9-11", "09-13", "10-12", "12-16", null));
        db.BusRoutes.AddRange(
            Route("TRK1", 1, "90001"), Route("TRK1", 2, "90002"), Route("TRK1", 3, "90003"),
            Route("15", 1, "90001"), Route("15", 2, "83140"), Route("15", 3, "90003"));
        await db.SaveChangesAsync();
    }

    public Task DisposeAsync() => Task.CompletedTask;

    [Theory]
    [MemberData(nameof(Contracts))]
    public async Task Endpoint_ResponseShape_MatchesTheFixtureTheMobileAppIsCheckedAgainst(string name, string request)
    {
        var response = await _client.GetAsync(request);
        response.EnsureSuccessStatusCode();
        var actual = new JsonObject
        {
            ["request"] = request,
            ["response"] = Normalised(JsonNode.Parse(await response.Content.ReadAsStringAsync())!),
        };

        var path = Path.Combine(FixtureFolder(), $"{name}.json");
        if (Environment.GetEnvironmentVariable(UpdateVariable) == "1")
        {
            await File.WriteAllTextAsync(path, actual.ToJsonString(Pretty) + "\n", new UTF8Encoding(false));
            return;
        }

        Assert.True(File.Exists(path), $"Missing {path}. Run with {UpdateVariable}=1 to create it.");
        var expected = JsonNode.Parse(await File.ReadAllTextAsync(path));
        Assert.True(JsonNode.DeepEquals(expected, actual),
            $"{name}.json no longer matches the API. If the change is intended, run with {UpdateVariable}=1, update " +
            $"apps/mobile/src/types/domain.ts if needed and commit the fixtures.\nActual:\n{actual.ToJsonString(Pretty)}");
    }

    [Fact]
    public void Fixtures_Folder_HoldsExactlyTheContractsTested()
    {
        var onDisk = Directory.GetFiles(FixtureFolder(), "*.json").Select(Path.GetFileNameWithoutExtension).Order();
        var tested = Contracts.Select(c => (string)c[0]).Order();

        Assert.Equal(tested, onDisk);
    }

    private void StubLta()
    {
        var timing = new ArrivalTiming(new DateTimeOffset(2026, 1, 1, 8, 0, 0, TimeSpan.FromHours(8)),
            CrowdLevel.LimitedStanding, true, BusType.DoubleDeck, true, false, "90003");
        IReadOnlyList<BusArrival> services = [new("15", "GAS", timing, timing with { Load = CrowdLevel.SeatsAvailable, IsMonitored = false }, timing with { DestinationCode = null })];
        factory.LtaBusClient.GetArrivalsAsync("83140", Arg.Any<CancellationToken>()).Returns(Result.Success(services));

        factory.LtaTrainAlertClient.GetAlertsAsync(Arg.Any<CancellationToken>()).Returns(Result.Success(new TrainAlertsResult(
            TrainServiceStatus.Disrupted,
            [new TrainAlertDetail("NSL", "Jurong East", ["NS1", "NS2"], "No train service", new DateTimeOffset(2026, 1, 1, 7, 0, 0, TimeSpan.Zero))])));

        factory.LtaLiveArrivalClient.GetLiveArrivalsAsync("90003", Arg.Any<CancellationToken>()).Returns(new List<LiveServiceArrival>
        {
            new("TRK1",
            [
                new LiveBus(DateTimeOffset.UtcNow.AddMinutes(6), true, new GeoPoint(1.3011, 103.8), "90003", 1,
                    CrowdLevel.SeatsAvailable, true, BusType.SingleDeck),
                new LiveBus(DateTimeOffset.UtcNow.AddMinutes(12), false, null, "90003", 1,
                    CrowdLevel.StandingAvailable, false, BusType.DoubleDeck),
            ]),
        });
    }

    // Values that depend on the clock are replaced, but only after checking they have the kind the app expects.
    private static JsonNode Normalised(JsonNode node)
    {
        if (node is JsonObject obj)
        {
            foreach (var key in obj.Select(p => p.Key).ToList())
            {
                obj[key] = Pinned(obj, key) ?? (obj[key] is null ? null : Normalised(obj[key]!.DeepClone()));
            }
        }
        else if (node is JsonArray array)
        {
            for (var i = 0; i < array.Count; i++)
            {
                array[i] = array[i] is null ? null : Normalised(array[i]!.DeepClone());
            }
        }

        return node;
    }

    private static JsonNode? Pinned(JsonObject obj, string key) => key switch
    {
        "fetchedAt" => PinIf(obj[key], JsonValueKind.String, FixedTime),
        "estimatedArrival" when obj.ContainsKey("etaMinutes") => PinIf(obj[key], JsonValueKind.String, FixedTime),
        "etaMinutes" => PinIf(obj[key], JsonValueKind.Number, 6),
        "etaLabel" => PinIf(obj[key], JsonValueKind.String, "6 min"),
        _ => null,
    };

    private static JsonNode PinIf(JsonNode? actual, JsonValueKind kind, JsonNode replacement)
    {
        var found = actual is JsonValue value ? value.GetValueKind() : JsonValueKind.Null;
        Assert.True(found == kind, $"Expected a {kind} but the API sent {found}: {actual?.ToJsonString()}");
        return replacement;
    }

    private static string FixtureFolder()
    {
        var dir = new DirectoryInfo(AppContext.BaseDirectory);
        while (dir is not null && !Directory.Exists(Path.Combine(dir.FullName, "apps", "mobile", "__tests__")))
        {
            dir = dir.Parent;
        }

        var root = dir?.FullName ?? throw new InvalidOperationException("Could not find the repository root above the test output.");
        var folder = Path.Combine(root, "apps", "mobile", "__tests__", "contract");
        Directory.CreateDirectory(folder);
        return folder;
    }

    private static BusRoute Route(string serviceNo, int sequence, string stopCode) =>
        BusRoute.Create(serviceNo, 1, sequence, stopCode, "SBST", sequence * 0.5, "0000", "2359", "0000", "2359", "0000", "2359");
}
