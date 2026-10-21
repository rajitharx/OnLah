namespace OnLah.Domain.Common;

public readonly record struct GeoPoint(double Latitude, double Longitude)
{
    private const double EarthRadiusMeters = 6_371_000;

    // LTA reports "0.0" for a bus it does not track, so a point outside the island is never a real position.
    public bool IsWithinSingapore =>
        Latitude is >= 1.1 and <= 1.5 && Longitude is >= 103.5 and <= 104.2;

    public double DistanceMetersTo(GeoPoint other)
    {
        var dLat = ToRadians(other.Latitude - Latitude);
        var dLon = ToRadians(other.Longitude - Longitude);
        var h = Math.Sin(dLat / 2) * Math.Sin(dLat / 2)
            + Math.Cos(ToRadians(Latitude)) * Math.Cos(ToRadians(other.Latitude)) * Math.Sin(dLon / 2) * Math.Sin(dLon / 2);
        return 2 * EarthRadiusMeters * Math.Asin(Math.Min(1, Math.Sqrt(h)));
    }

    private static double ToRadians(double degrees) => degrees * Math.PI / 180;
}
