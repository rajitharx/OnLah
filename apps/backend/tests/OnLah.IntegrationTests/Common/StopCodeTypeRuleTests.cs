using System.Reflection;
using System.Runtime.CompilerServices;
using System.Text.RegularExpressions;
using Xunit;

namespace OnLah.IntegrationTests.Common;

/// <summary>
/// Hard rule: bus stop codes are always strings, never numbers (a number drops the leading zero of 01012).
/// The scan goes by name (anything with "StopCode" in it), so a differently named field is not caught.
/// </summary>
public sealed partial class StopCodeTypeRuleTests
{
    private static readonly Type[] NumericTypes =
    [
        typeof(byte), typeof(sbyte), typeof(short), typeof(ushort), typeof(int), typeof(uint),
        typeof(long), typeof(ulong), typeof(float), typeof(double), typeof(decimal),
    ];

    private const BindingFlags AllDeclared =
        BindingFlags.Public | BindingFlags.NonPublic | BindingFlags.Instance | BindingFlags.Static | BindingFlags.DeclaredOnly;

    [GeneratedRegex("stop_?codes?", RegexOptions.IgnoreCase)]
    private static partial Regex StopCodeName();

    [GeneratedRegex(@"\b(?:int|long|short|decimal|double|byte)\.(?:Try)?Parse\([^)]*stop_?code|Convert\.To(?:Int16|Int32|Int64|Decimal|Double|Byte)\([^)]*stop_?code|\(\s*(?:int|long|short)\s*\)\s*\w*stop_?code",
        RegexOptions.IgnoreCase)]
    private static partial Regex NumericConversion();

    [Fact]
    public void BackendTypes_StopCodeMembers_AreNeverNumbers()
    {
        var offenders = BackendAssemblies().SelectMany(a => a.GetTypes()).SelectMany(NumericStopCodeMembers).ToList();

        Assert.True(offenders.Count == 0,
            "Bus stop codes are always string. Offending members:\n" + string.Join("\n", offenders));
    }

    [Fact]
    public void BackendTypes_StopCodeScan_FindsTheStringStopCodesThatExist()
    {
        var inspected = BackendAssemblies().SelectMany(a => a.GetTypes()).SelectMany(StopCodeMembers).ToList();

        Assert.Contains(inspected, m => m.Name == "BusStopCode" && m.Type == typeof(string));
        Assert.True(inspected.Count >= 10, $"Expected many stop code members, found {inspected.Count}. The scan may be broken.");
    }

    [Fact]
    public void BackendSource_StopCodeValues_AreNeverConvertedToNumbers()
    {
        var srcRoot = Path.Combine(FindBackendRoot(), "src");

        var offenders = Directory.EnumerateFiles(srcRoot, "*.cs", SearchOption.AllDirectories)
            .Where(path => !path.Contains($"{Path.DirectorySeparatorChar}obj{Path.DirectorySeparatorChar}")
                        && !path.Contains($"{Path.DirectorySeparatorChar}bin{Path.DirectorySeparatorChar}"))
            .SelectMany(path => File.ReadLines(path).Select(line => (path, line)))
            .Where(x => NumericConversion().IsMatch(x.line))
            .Select(x => $"{Path.GetRelativePath(srcRoot, x.path)}: {x.line.Trim()}")
            .ToList();

        Assert.True(offenders.Count == 0, "Bus stop codes are always string. Conversions:\n" + string.Join("\n", offenders));
    }

    [Theory]
    [InlineData("var n = int.Parse(stopCode);", true)]
    [InlineData("int.TryParse(request.BusStopCode, out var n);", true)]
    [InlineData("var n = Convert.ToInt32(busStopCode);", true)]
    [InlineData("var n = (int)stopCode;", true)]
    [InlineData("var s = stopCode.Trim();", false)]
    [InlineData("var n = int.Parse(distanceText);", false)]
    public void ConversionScan_Line_IsFlaggedOnlyWhenAStopCodeBecomesANumber(string line, bool flagged)
    {
        Assert.Equal(flagged, NumericConversion().IsMatch(line));
    }

    [Theory]
    [InlineData(typeof(SampleWithNumberProperty), "StopCode")]
    [InlineData(typeof(SampleWithNumberField), "busStopCode")]
    [InlineData(typeof(SampleWithNumberParameter), "stopCode")]
    [InlineData(typeof(SampleWithNumberList), "StopCodes")]
    [InlineData(typeof(SampleWithNullableNumber), "BusStopCode")]
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

    private static IEnumerable<Assembly> BackendAssemblies()
    {
        var api = typeof(Program).Assembly;
        yield return api;

        foreach (var name in api.GetReferencedAssemblies().Where(n => n.Name!.StartsWith("OnLah.", StringComparison.Ordinal)))
        {
            yield return Assembly.Load(name);
        }
    }

    private static IEnumerable<string> NumericStopCodeMembers(Type type) =>
        StopCodeMembers(type).Where(m => IsNumeric(m.Type)).Select(m => $"{type.FullName}.{m.Name} is {m.Type.Name}");

    private static IEnumerable<(string Name, Type Type)> StopCodeMembers(Type type)
    {
        if (type.IsDefined(typeof(CompilerGeneratedAttribute), inherit: false))
        {
            yield break;
        }

        var members = type.GetProperties(AllDeclared).Select(p => (p.Name, p.PropertyType))
            .Concat(type.GetFields(AllDeclared).Select(f => (f.Name, f.FieldType)))
            .Concat(type.GetMethods(AllDeclared).Cast<MethodBase>().Concat(type.GetConstructors(AllDeclared))
                .SelectMany(m => m.GetParameters()).Select(p => (p.Name ?? string.Empty, p.ParameterType)));

        foreach (var member in members.Where(m => StopCodeName().IsMatch(m.Item1)))
        {
            yield return member;
        }
    }

    private static bool IsNumeric(Type type)
    {
        var inner = Nullable.GetUnderlyingType(type) ?? type;
        if (inner.IsArray)
        {
            return IsNumeric(inner.GetElementType()!);
        }

        if (inner.IsGenericType && inner.GetGenericArguments().Length == 1)
        {
            return IsNumeric(inner.GetGenericArguments()[0]);
        }

        return NumericTypes.Contains(inner);
    }

    private static string FindBackendRoot()
    {
        var dir = new DirectoryInfo(AppContext.BaseDirectory);
        while (dir is not null && !File.Exists(Path.Combine(dir.FullName, "OnLah.sln")))
        {
            dir = dir.Parent;
        }

        return dir?.FullName ?? throw new InvalidOperationException("Could not find OnLah.sln above the test output folder.");
    }

    private sealed class SampleWithNumberProperty { public int StopCode { get; init; } }
    private sealed class SampleWithNumberField { public long busStopCode = 1; }
    private sealed class SampleWithNumberParameter { public void Run(int stopCode) { } }
    private sealed class SampleWithNumberList { public List<int> StopCodes { get; init; } = []; }
    private sealed class SampleWithNullableNumber { public int? BusStopCode { get; init; } }
    private sealed class SampleWithStrings
    {
        public string StopCode { get; init; } = "";
        public IReadOnlyList<string> StopCodes { get; init; } = [];
        public int StopsAway { get; init; }
    }
}
