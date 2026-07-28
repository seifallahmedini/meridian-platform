using System.Net;
using System.Net.Http.Json;
using MeridianPlatform.Api.IntegrationTests.Fixtures;
using MeridianPlatform.Application.Locations;

namespace MeridianPlatform.Api.IntegrationTests;

public class LocationEndpointTests(ApiFactory factory) : IClassFixture<ApiFactory>
{
    private static readonly CreateLocationRequest SampleRequest = new(
        "Main Warehouse", "123 Dock St", null, "Columbus", "OH", "43004", "USA");

    [Fact]
    public async Task CreateAndSearch_ReturnsTheCreatedLocation()
    {
        var client = factory.CreateAuthenticatedClient("owner-a");

        var createResponse = await client.PostAsJsonAsync("/api/v1/locations", SampleRequest);
        Assert.Equal(HttpStatusCode.Created, createResponse.StatusCode);

        var searchResponse = await client.GetAsync("/api/v1/locations?query=Main");
        Assert.Equal(HttpStatusCode.OK, searchResponse.StatusCode);

        var results = await searchResponse.Content.ReadFromJsonAsync<LocationDto[]>();
        Assert.Contains(results!, l => l.Label == "Main Warehouse");
    }

    [Fact]
    public async Task Search_DoesNotLeakAnotherOwnersLocations()
    {
        var ownerA = factory.CreateAuthenticatedClient("owner-search-a");
        var ownerB = factory.CreateAuthenticatedClient("owner-search-b");

        await ownerA.PostAsJsonAsync("/api/v1/locations", SampleRequest with { Label = "Owner A Only" });

        var ownerBResults = await ownerB.GetFromJsonAsync<LocationDto[]>("/api/v1/locations?query=Owner A Only");

        Assert.Empty(ownerBResults!);
    }

    [Fact]
    public async Task Create_MissingRequiredFields_ReturnsValidationProblem()
    {
        var client = factory.CreateAuthenticatedClient("owner-a");

        var response = await client.PostAsJsonAsync(
            "/api/v1/locations", SampleRequest with { Label = "", City = "" });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task AnonymousRequests_AreRejected()
    {
        var client = factory.CreateClient();

        var getResponse = await client.GetAsync("/api/v1/locations");
        var postResponse = await client.PostAsJsonAsync("/api/v1/locations", SampleRequest);

        Assert.Equal(HttpStatusCode.Unauthorized, getResponse.StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, postResponse.StatusCode);
    }
}
