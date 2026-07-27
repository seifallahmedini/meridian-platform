import { Client } from './generated-client'

export * from './generated-client'

const baseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5299'

export const apiClient = new Client(baseUrl)

export function createAuthenticatedClient(accessToken: string): Client {
  return new Client(baseUrl, {
    fetch: (url, init) =>
      fetch(url, {
        ...init,
        headers: { ...init?.headers, Authorization: `Bearer ${accessToken}` },
      }),
  })
}
