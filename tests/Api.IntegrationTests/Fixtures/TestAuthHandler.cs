using System.Security.Claims;
using System.Text.Encodings.Web;
using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace MeridianPlatform.Api.IntegrationTests.Fixtures;

/// <summary>
/// Replaces the real Keycloak JWT bearer scheme in tests. Treats whatever follows "Bearer " in
/// the Authorization header as the caller's "sub" claim directly — no real token needed. A
/// missing/malformed Authorization header yields NoResult(), which still challenges to 401 on
/// endpoints that RequireAuthorization(), so anonymous-access tests work unchanged.
/// </summary>
public class TestAuthHandler(
    IOptionsMonitor<AuthenticationSchemeOptions> options,
    ILoggerFactory logger,
    UrlEncoder encoder) : AuthenticationHandler<AuthenticationSchemeOptions>(options, logger, encoder)
{
    public const string SchemeName = "Test";

    protected override Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        if (!Request.Headers.TryGetValue("Authorization", out var authHeader) ||
            !authHeader.ToString().StartsWith("Bearer ", StringComparison.Ordinal))
        {
            return Task.FromResult(AuthenticateResult.NoResult());
        }

        var ownerId = authHeader.ToString()["Bearer ".Length..];
        var identity = new ClaimsIdentity([new Claim("sub", ownerId)], SchemeName);
        var ticket = new AuthenticationTicket(new ClaimsPrincipal(identity), SchemeName);
        return Task.FromResult(AuthenticateResult.Success(ticket));
    }
}
