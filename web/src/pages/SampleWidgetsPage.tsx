import { useQuery } from '@tanstack/react-query'
import { useAuth } from 'react-oidc-context'
import { ProtectedRoute } from '@/auth/ProtectedRoute'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { apiClient, createAuthenticatedClient } from '@/lib/api-client'

export function SampleWidgetsPage() {
  const auth = useAuth()

  const healthQuery = useQuery({
    queryKey: ['health'],
    queryFn: () => apiClient.getHealth(),
  })

  const widgetsQuery = useQuery({
    queryKey: ['sample-widgets'],
    queryFn: () => apiClient.getSampleWidgets(),
  })

  const protectedWidgetsQuery = useQuery({
    queryKey: ['sample-widgets', 'protected', auth.user?.access_token],
    queryFn: () => createAuthenticatedClient(auth.user!.access_token).getSampleWidgetsProtected(),
    enabled: auth.isAuthenticated && !!auth.user?.access_token,
  })

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>API health</CardTitle>
        </CardHeader>
        <CardContent>
          {healthQuery.isLoading && <p className="text-muted-foreground text-sm">Checking...</p>}
          {healthQuery.isError && <p className="text-destructive text-sm">Unreachable</p>}
          {healthQuery.data && <p className="text-sm">Status: {healthQuery.data.status}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sample widgets</CardTitle>
        </CardHeader>
        <CardContent>
          {widgetsQuery.isLoading && <p className="text-muted-foreground text-sm">Loading...</p>}
          {widgetsQuery.isError && <p className="text-destructive text-sm">Failed to load</p>}
          {widgetsQuery.data && widgetsQuery.data.length === 0 && (
            <p className="text-muted-foreground text-sm">No sample widgets yet.</p>
          )}
          <ul className="flex flex-col gap-1">
            {widgetsQuery.data?.map((widget) => (
              <li key={widget.id} className="text-sm">
                {widget.name}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Protected sample widgets</CardTitle>
        </CardHeader>
        <CardContent>
          <ProtectedRoute>
            {protectedWidgetsQuery.isLoading && (
              <p className="text-muted-foreground text-sm">Loading...</p>
            )}
            {protectedWidgetsQuery.isError && (
              <p className="text-destructive text-sm">Failed to load</p>
            )}
            <ul className="flex flex-col gap-1">
              {protectedWidgetsQuery.data?.map((widget) => (
                <li key={widget.id} className="text-sm">
                  {widget.name}
                </li>
              ))}
            </ul>
          </ProtectedRoute>
        </CardContent>
      </Card>
    </div>
  )
}
