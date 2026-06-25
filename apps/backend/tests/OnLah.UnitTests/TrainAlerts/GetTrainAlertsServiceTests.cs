using NSubstitute;
using OnLah.Application.Common.Interfaces;
using OnLah.Application.TrainAlerts;
using OnLah.Domain.Common;
using Xunit;

namespace OnLah.UnitTests.TrainAlerts;

public sealed class GetTrainAlertsServiceTests
{
    private readonly ILtaTrainAlertClient _ltaClient = Substitute.For<ILtaTrainAlertClient>();
    private readonly GetTrainAlertsService _sut;

    public GetTrainAlertsServiceTests() => _sut = new GetTrainAlertsService(_ltaClient);

    [Fact]
    public async Task GetAsync_NormalStatus_ReturnsNormalStatusWithNoAlerts()
    {
        var normal = new TrainAlertsResult(TrainServiceStatus.Normal, []);
        _ltaClient.GetAlertsAsync(Arg.Any<CancellationToken>())
            .Returns(Result.Success(normal));

        var result = await _sut.GetAsync();

        Assert.True(result.IsSuccess);
        Assert.Equal(TrainServiceStatus.Normal, result.Value!.Status);
        Assert.Empty(result.Value!.Alerts);
    }

    [Fact]
    public async Task GetAsync_DisruptedStatus_ReturnsDisruptedWithAlertDetails()
    {
        var alert = new TrainAlertDetail("NEL", "Both", ["NE1", "NE3"], "No service between stations.", DateTimeOffset.UtcNow);
        var disrupted = new TrainAlertsResult(TrainServiceStatus.Disrupted, [alert]);
        _ltaClient.GetAlertsAsync(Arg.Any<CancellationToken>())
            .Returns(Result.Success(disrupted));

        var result = await _sut.GetAsync();

        Assert.True(result.IsSuccess);
        Assert.Equal(TrainServiceStatus.Disrupted, result.Value!.Status);
        Assert.Single(result.Value!.Alerts);
        Assert.Equal("NEL", result.Value!.Alerts[0].Line);
    }

    [Fact]
    public async Task GetAsync_LtaClientReturnsError_PropagatesError()
    {
        var error = DomainError.Validation("LtaClient", "Unable to reach LTA DataMall.");
        _ltaClient.GetAlertsAsync(Arg.Any<CancellationToken>())
            .Returns(Result.Failure<TrainAlertsResult>(error));

        var result = await _sut.GetAsync();

        Assert.True(result.IsFailure);
        Assert.Equal(error.Code, result.Error.Code);
    }
}
