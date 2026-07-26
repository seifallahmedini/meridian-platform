// Fetches the running Api's OpenAPI document so nswag can generate the typed client from it.
// Requires the Api to be running locally first (`dotnet run --project src/Api`).
const apiUrl = process.env.API_URL ?? 'http://localhost:5299'

const response = await fetch(`${apiUrl}/openapi/v1.json`)
if (!response.ok) {
  throw new Error(`Failed to fetch OpenAPI document from ${apiUrl}: ${response.status}`)
}

const body = await response.text()
await import('node:fs/promises').then((fs) => fs.writeFile('openapi.json', body))
console.log(`Saved OpenAPI document from ${apiUrl} to web/openapi.json`)
