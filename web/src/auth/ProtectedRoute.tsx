import type { ReactNode } from 'react'
import { useAuth } from 'react-oidc-context'
import { Button } from '@/components/ui/button'

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const auth = useAuth()

  if (auth.isLoading) {
    return <p className="text-muted-foreground text-sm">Loading...</p>
  }

  if (!auth.isAuthenticated) {
    return (
      <Button onClick={() => auth.signinRedirect()}>Log in with Keycloak</Button>
    )
  }

  return <>{children}</>
}
