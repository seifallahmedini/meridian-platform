using System.Net;
using System.Net.Http.Json;
using MeridianPlatform.Api.IntegrationTests.Fixtures;
using MeridianPlatform.Application.Locations;
using MeridianPlatform.Application.Shipments;
using MeridianPlatform.Domain;

namespace MeridianPlatform.Api.IntegrationTests;

public class ShipmentEndpointTests(ApiFactory factory) : IClassFixture<ApiFactory>
{
    private static async Task<(Guid OriginId, Guid DestinationId)> CreateLocationsAsync(HttpClient client)
    {
        var origin = await client.PostAsJsonAsync(
            "/api/v1/locations",
            new CreateLocationRequest("Origin", "1 Origin St", null, "Columbus", "OH", "43004", "USA"));
        var destination = await client.PostAsJsonAsync(
            "/api/v1/locations",
            new CreateLocationRequest("Destination", "1 Dest St", null, "Chicago", "IL", "60601", "USA"));

        var originDto = await origin.Content.ReadFromJsonAsync<LocationDto>();
        var destinationDto = await destination.Content.ReadFromJsonAsync<LocationDto>();

        return (originDto!.Id, destinationDto!.Id);
    }

    private static SaveShipmentRequest ValidSubmitRequest(Guid originId, Guid destinationId) => new(
        originId, destinationId, WeightKg: 10, LengthCm: 1, WidthCm: 1, HeightCm: 1,
        FreightClass: "100", IsHazmat: false, HazmatUnNumber: null, HazmatPackingGroup: null,
        HazmatEmergencyContact: null, ServiceLevel: ServiceLevel.Standard, IsDraft: false);

    [Fact]
    public async Task SaveDraft_WithAllFieldsEmpty_Succeeds()
    {
        var client = factory.CreateAuthenticatedClient("owner-draft");

        var request = new SaveShipmentRequest(
            null, null, null, null, null, null, null, false, null, null, null, null, IsDraft: true);

        var response = await client.PostAsJsonAsync("/api/v1/shipments", request);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
    }

    [Fact]
    public async Task Submit_MissingCargoFields_ReturnsValidationProblem()
    {
        var client = factory.CreateAuthenticatedClient("owner-submit-missing");
        var (originId, destinationId) = await CreateLocationsAsync(client);

        var request = new SaveShipmentRequest(
            originId, destinationId, null, null, null, null, null, false, null, null, null, null, IsDraft: false);

        var response = await client.PostAsJsonAsync("/api/v1/shipments", request);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Submit_HazmatMissingFields_ReturnsValidationProblem_ThenSucceedsWithFields()
    {
        var client = factory.CreateAuthenticatedClient("owner-hazmat");
        var (originId, destinationId) = await CreateLocationsAsync(client);
        var baseRequest = ValidSubmitRequest(originId, destinationId);

        var incomplete = baseRequest with { IsHazmat = true };
        var incompleteResponse = await client.PostAsJsonAsync("/api/v1/shipments", incomplete);
        Assert.Equal(HttpStatusCode.BadRequest, incompleteResponse.StatusCode);

        var complete = baseRequest with
        {
            IsHazmat = true,
            HazmatUnNumber = "UN1234",
            HazmatPackingGroup = "II",
            HazmatEmergencyContact = "+1-555-0100",
        };
        var completeResponse = await client.PostAsJsonAsync("/api/v1/shipments", complete);
        Assert.Equal(HttpStatusCode.Created, completeResponse.StatusCode);
    }

    [Fact]
    public async Task Submit_IdenticalOriginAndDestination_ReturnsValidationProblem()
    {
        var client = factory.CreateAuthenticatedClient("owner-same-location");
        var (originId, _) = await CreateLocationsAsync(client);

        var request = ValidSubmitRequest(originId, originId);

        var response = await client.PostAsJsonAsync("/api/v1/shipments", request);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task ListDrafts_DoesNotLeakAnotherOwnersDrafts()
    {
        var ownerA = factory.CreateAuthenticatedClient("owner-list-a");
        var ownerB = factory.CreateAuthenticatedClient("owner-list-b");

        var draftRequest = new SaveShipmentRequest(
            null, null, null, null, null, null, null, false, null, null, null, null, IsDraft: true);
        await ownerA.PostAsJsonAsync("/api/v1/shipments", draftRequest);

        var ownerBDrafts = await ownerB.GetFromJsonAsync<ShipmentSummaryDto[]>(
            "/api/v1/shipments?status=Draft");

        Assert.Empty(ownerBDrafts!);
    }

    [Fact]
    public async Task AnonymousRequests_AreRejected()
    {
        var client = factory.CreateClient();
        var request = ValidSubmitRequest(Guid.NewGuid(), Guid.NewGuid());

        var postResponse = await client.PostAsJsonAsync("/api/v1/shipments", request);
        var getResponse = await client.GetAsync("/api/v1/shipments");

        Assert.Equal(HttpStatusCode.Unauthorized, postResponse.StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, getResponse.StatusCode);
    }
}
