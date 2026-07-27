var builder = DistributedApplication.CreateBuilder(args);

// Connection-string resource name is "Postgres" (not "meridian") so the injected
// ConnectionStrings__Postgres env var matches what appsettings.json/docker-compose
// already use in src/Api's Program.cs.
var postgres = builder.AddPostgres("postgres")
    .WithDataVolume()
    .AddDatabase("Postgres", databaseName: "meridian");

var redis = builder.AddRedis("redis");

// KC_HOSTNAME=localhost keeps the issuer/URLs Keycloak reports as
// http://localhost:8080 regardless of whether the request came from the
// browser or from the Api's server-to-server metadata fetch, so JWTs issued
// via the browser validate correctly against the Api's JWT bearer config.
var keycloak = builder.AddContainer("keycloak", "quay.io/keycloak/keycloak", "26.0")
    .WithArgs("start-dev", "--import-realm")
    .WithEnvironment("KEYCLOAK_ADMIN", "admin")
    .WithEnvironment("KEYCLOAK_ADMIN_PASSWORD", "admin")
    .WithEnvironment("KC_HOSTNAME", "http://localhost:8080")
    .WithEnvironment("KC_HOSTNAME_STRICT", "false")
    .WithEnvironment("KC_HOSTNAME_BACKCHANNEL_DYNAMIC", "true")
    .WithEnvironment("KC_HTTP_ENABLED", "true")
    .WithBindMount("../../deploy/keycloak/realm-export.json", "/opt/keycloak/data/import/realm-export.json", isReadOnly: true)
    .WithHttpEndpoint(port: 8080, targetPort: 8080, name: "http")
    // Without this, WaitFor(keycloak) below only waits for the container to
    // start, not for Keycloak to finish booting and importing the realm — the
    // Api's JWT discovery fetch can race that and cache a permanent failure.
    .WithHttpHealthCheck("/realms/meridian/.well-known/openid-configuration");

var keycloakEndpoint = keycloak.GetEndpoint("http");
var keycloakRealmUrl = ReferenceExpression.Create($"{keycloakEndpoint}/realms/meridian");

var api = builder.AddProject<Projects.Api>("api")
    .WithReference(postgres)
    .WithReference(redis)
    .WaitFor(postgres)
    .WaitFor(keycloak)
    .WithEnvironment("Keycloak__Authority", keycloakRealmUrl)
    .WithEnvironment("Keycloak__Audience", "meridian-api")
    .WithEnvironment("Cors__AllowedOrigins__0", "http://localhost:5173");

builder.AddNpmApp("web", "../../web", "dev")
    .WithReference(api)
    .WaitFor(api)
    .WithEnvironment("VITE_API_BASE_URL", api.GetEndpoint("http"))
    .WithEnvironment("VITE_KEYCLOAK_AUTHORITY", keycloakRealmUrl)
    .WithEnvironment("VITE_KEYCLOAK_CLIENT_ID", "meridian-web")
    .WithHttpEndpoint(port: 5173, targetPort: 5173, env: "PORT")
    .WithExternalHttpEndpoints();

builder.Build().Run();
