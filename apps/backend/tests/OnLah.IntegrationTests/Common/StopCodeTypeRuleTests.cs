using System.Reflection;
using System.Runtime.CompilerServices;
using System.Text.RegularExpressions;
using OnLah.Application.BusArrivals;
using OnLah.Domain.BusStops;
using OnLah.Infrastructure.Persistence;
using Xunit;

namespace OnLah.IntegrationTests.Common;

/// <summary>
/// Hard rule: bus stop codes are always strings, never numbers (a number drops the leading zero of 01012).
/// Both scans go by name (anything with "StopCode" in it). A stop code held under another name, a local
/// variable declared as a number, or a code copied into an untyped value is not caught.
/// </summary>
public sealed partial class StopCodeTypeRuleTests
{
    private const string NumericKeywords = "int|uint|long|ulong|short|ushort|byte|sbyte|decimal|double|float";
    private const string NumericClrNames = "Int16|UInt16|Int32|UInt32|Int64|UInt64|Byte|SByte|Decimal|Double|Single";
    private const string NumericNames = $"(?:{NumericKeywords}|{NumericClrNames})";
    private const string StopCodeToken = "stop_?codes?";

    private static readonly Type[] NumericTypes =
    [
        typeof(byte), typeof(sbyte), typeof(short), typeof(ushort), typeof(int), typeof(uint),
        typeof(long), typeof(ulong), typeof(float), typeof(double), typeof(decimal),
    ];

    private const BindingFlags AllDeclared =
        BindingFlags.Public | BindingFlags.NonPublic | BindingFlags.Instance | BindingFlags.Static | BindingFlags.DeclaredOnly;

    [GeneratedRegex(StopCodeToken, RegexOptions.IgnoreCase)]
    private static partial Regex StopCodeName();

    [GeneratedRegex(
        $@"\b{NumericNames}\.(?:Try)?Parse\([^;]*?{StopCodeToken}"
        + $@"|\bConvert\.To(?:{NumericClrNames})\([^;]*?{StopCodeToken}"
        + $@"|\(\s*{NumericNames}\s*\)\s*[\w.]*{StopCodeToken}",
        RegexOptions.IgnoreCase)]
    private static partial Regex NumericConversion();

    [GeneratedRegex(@"/\*.*?\*/|//[^\n]*", RegexOptions.Singleline)]
    private static partial Regex Comment();

    [Fact]
    public void BackendTypes_StopCodeMembers_AreNeverNumbers()
    {
        var offenders = ScannedTypes().SelectMany(NumericStopCodeMembers).ToList();

        Assert.True(offenders.Count == 0,
            "Bus stop codes are always string. Offending members:\n" + string.Join("\n", offenders));
    }

    [Fact]
    public void BackendTypes_StopCodeScan_CoversEveryBackendAssemblyAndFindsRealStopCodes()
    {
        var assemblies = BackendAssemblies().Select(a => a.GetName().Name).ToList();
        var inspected = ScannedTypes().SelectMany(StopCodeMembers).ToList();

        Assert.Equal(["OnLah.Api", "OnLah.Application", "OnLah.Domain", "OnLah.Infrastructure"], assemblies.Order());
        Assert.Contains(inspected, m => m.Name == "BusStopCode" && m.Type == typeof(string));
        Assert.True(inspected.Count >= 10, $"Expected many stop code members, found {inspected.Count}. The scan may be broken.");
    }

    [Fact]
    public void BackendSource_StopCodeValues_AreNeverConvertedToNumbers()
    {
        var srcRoot = Path.Combine(FindBackendRoot(), "src");
        var files = Directory.EnumerateFiles(srcRoot, "*.cs", SearchOption.AllDirectories)
            .Where(path => !Path.GetRelativePath(srcRoot, path).Split(Path.DirectorySeparatorChar).Any(p => p is "obj" or "bin"))
            .ToList();

        var offenders = files.SelectMany(path => NumericConversions(File.ReadAllText(path))
            .Select(hit => $"{Path.GetRelativePath(srcRoot, path)}: {hit}")).ToList();

        Assert.True(files.Count >= 20, $"Expected to scan the backend source, found {files.Count} files under {srcRoot}.");
        Assert.True(offenders.Count == 0, "Bus stop codes are always string. Conversions:\n" + string.Join("\n", offenders));
    }

    [Theory]
    [InlineData("var n = int.Parse(stopCode);", true)]
    [InlineData("int.TryParse(request.BusStopCode, out var n);", true)]
    [InlineData("var n = Convert.ToInt32(busStopCode);", true)]
    [InlineData("var n = (int)stopCode;", true)]
    [InlineData("var n = (int)request.BusStopCode;", true)]
    [InlineData("var n = (decimal)stop.BusStopCode;", true)]
    [InlineData("var n = uint.Parse(stopCode);", true)]
    [InlineData("var n = Int32.Parse(stopCode);", true)]
    [InlineData("var n = System.Int32.Parse(stopCode);", true)]
    [InlineData("var n = Convert.ToUInt32(stopCode);", true)]
    [InlineData("var n = int.Parse(Normalize(x) + stopCode);", true)]
    [InlineData("var n = int.Parse(\n    stopCode);", true)]
    [InlineData("var s = stopCode.Trim();", false)]
    [InlineData("var n = int.Parse(distanceText);", false)]
    [InlineData("// int.Parse(stopCode) is wrong", false)]
    [InlineData("/* int.Parse(stopCode) */ var x = 1;", false)]
    [InlineData("var s = Convert.ToString(stopCode);", false)]
    public void ConversionScan_Code_IsFlaggedOnlyWhenAStopCodeBecomesANumber(string code, bool flagged)
    {
        Assert.Equal(flagged, NumericConversions(code).Any());
    }

    [Theory]
    [InlineData(typeof(SampleWithNumberProperty), "StopCode")]
    [InlineData(typeof(SampleWithNumberField), "busStopCode")]
    [InlineData(typeof(SampleWithNumberParameter), "stopCode")]
    [InlineData(typeof(SampleWithNumberList), "StopCodes")]
    [InlineData(typeof(SampleWithNullableNumber), "BusStopCode")]
    [InlineData(typeof(SampleWithNumberKeyedMap), "StopCodes")]
    [InlineData(typeof(SampleWithNumberTuple), "StopCode")]
    [InlineData(typeof(SampleWithNumberReturn), "GetStopCode")]
    public void MemberScan_NumericStopCode_IsFlagged(Type sample, string memberName)
    {
        var found = NumericStopCodeMembers(sample).ToList();

        Assert.Contains(found, f => f.Contains(memberName));
    }

    [Fact]
    public void MemberScan_StringStopCodeAndNumericNonStopCode_AreNotFlagged()
    {
        Assert.Empty(NumericStopCodeMembers(typeof(SampleWithStrings)));
    }

    private static IEnumerable<string> NumericConversions(string code) =>
        NumericConversion().Matches(Comment().Replace(code, " ")).Select(m => m.Value.ReplaceLineEndings(" "));

    private static IEnumerable<Assembly> BackendAssemblies() =>
        new[]
        {
            typeof(Program).Assembly,
            typeof(BusStop).Assembly,
            typeof(BusArrival).Assembly,
            typeof(OnLahDbContext).Assembly,
        }.Distinct();

    private static IEnumerable<Type> ScannedTypes() => BackendAssemblies().SelectMany(a => a.GetTypes());

    private static IEnumerable<string> NumericStopCodeMembers(Type type) =>
        StopCodeMembers(type).Where(m => IsNumeric(m.Type)).Select(m => $"{type.FullName}.{m.Name} is {m.Type.Name}");

    private static IEnumerable<(string Name, Type Type)> StopCodeMembers(Type type)
    {
        if (type.IsDefined(typeof(CompilerGeneratedAttribute), inherit: false))
        {
            yield break;
        }

        var methods = type.GetMethods(AllDeclared).Cast<MethodBase>().Concat(type.GetConstructors(AllDeclared)).ToList();
        var members = type.GetProperties(AllDeclared).Select(p => (p.Name, p.PropertyType))
            .Concat(type.GetFields(AllDeclared).Select(f => (f.Name, f.FieldType)))
            .Concat(methods.SelectMany(m => m.GetParameters()).Select(p => (p.Name ?? string.Empty, p.ParameterType)))
            .Concat(type.GetMethods(AllDeclared).Select(m => (m.Name, m.ReturnType)));

        foreach (var member in members.Where(m => StopCodeName().IsMatch(m.Item1)))
        {
            yield return member;
        }
    }

    private static bool IsNumeric(Type type)
    {
        var inner = Nullable.GetUnderlyingType(type) ?? type;

        return inner.IsArray
            ? IsNumeric(inner.GetElementType()!)
            : inner.IsGenericType
                ? inner.GetGenericArguments().Any(IsNumeric)
                : NumericTypes.Contains(inner);
    }

    private static string FindBackendRoot()
    {
        var dir = new DirectoryInfo(AppContext.BaseDirectory);
        while (dir is not null && !Directory.Exists(Path.Combine(dir.FullName, "src", "OnLah.Domain")))
        {
            dir = dir.Parent;
        }

        return dir?.FullName ?? throw new InvalidOperationException("Could not find the backend folder (the one holding src/OnLah.Domain) above the test output.");
    }

    private sealed class SampleWithNumberProperty { public int StopCode { get; init; } }
    private sealed class SampleWithNumberField { public long busStopCode = 1; }
    private sealed class SampleWithNumberParameter { public void Run(int stopCode) { } }
    private sealed class SampleWithNumberList { public List<int> StopCodes { get; init; } = []; }
    private sealed class SampleWithNullableNumber { public int? BusStopCode { get; init; } }
    private sealed class SampleWithNumberKeyedMap { public Dictionary<int, string> StopCodes { get; init; } = []; }
    private sealed class SampleWithNumberTuple { public (int, string) StopCode { get; init; } }
    private sealed class SampleWithNumberReturn { public int GetStopCode() => 1; }
    private sealed class SampleWithStrings
    {
        public string StopCode { get; init; } = "";
        public IReadOnlyList<string> StopCodes { get; init; } = [];
        public int StopsAway { get; init; }
    }
}
