using System.Security.Claims;

namespace MeridianPlatform.Api;

public static class ClaimsPrincipalExtensions
{
    public static string GetOwnerId(this ClaimsPrincipal principal) =>
        principal.FindFirstValue("sub")
        ?? principal.FindFirstValue(ClaimTypes.NameIdentifier)
        ?? throw new InvalidOperationException("JWT is missing a 'sub' claim.");
}
