import type { ReactNode } from 'react'
import { AuthProvider as OidcAuthProvider } from 'react-oidc-context'

const oidcConfig = {
  authority: import.meta.env.VITE_KEYCLOAK_AUTHORITY ?? 'http://localhost:8080/realms/meridian',
  client_id: import.meta.env.VITE_KEYCLOAK_CLIENT_ID ?? 'meridian-web',
  redirect_uri: window.location.origin,
  post_logout_redirect_uri: window.location.origin,
  response_type: 'code',
  scope: 'openid profile email',
}

export function AuthProvider({ children }: { children: ReactNode }) {
  return <OidcAuthProvider {...oidcConfig}>{children}</OidcAuthProvider>
}
