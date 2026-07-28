import { useMemo } from 'react'
import { useAuth } from 'react-oidc-context'
import { createAuthenticatedClient } from '@/lib/api-client'

/** Returns an authenticated API client, or null until the user is logged in. */
export function useApiClient() {
  const auth = useAuth()
  const token = auth.user?.access_token

  return useMemo(() => (token ? createAuthenticatedClient(token) : null), [token])
}
