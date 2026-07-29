import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useApiClient } from '@/lib/api-client/useApiClient'
import { ShipmentStatus } from '@/lib/api-client'

export function DraftsListPage() {
  const client = useApiClient()

  const draftsQuery = useQuery({
    queryKey: ['shipments', 'drafts'],
    queryFn: () => client!.getShipments(ShipmentStatus.Draft),
    enabled: !!client,
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Draft shipments</CardTitle>
      </CardHeader>
      <CardContent>
        {draftsQuery.isLoading && <p className="text-muted-foreground text-sm">Loading...</p>}
        {draftsQuery.isError && <p className="text-destructive text-sm">Failed to load drafts.</p>}
        {draftsQuery.data && draftsQuery.data.length === 0 && (
          <p className="text-muted-foreground text-sm">No drafts yet.</p>
        )}
        <ul className="flex flex-col gap-2">
          {draftsQuery.data?.map((draft) => (
            <li key={draft.id}>
              <Link
                to={`/shipments/new/${draft.id}`}
                className="hover:bg-accent flex flex-col rounded-md border p-3 text-sm"
              >
                <span className="font-medium">
                  {draft.originLocationLabel ?? 'No origin'} &rarr;{' '}
                  {draft.destinationLocationLabel ?? 'No destination'}
                </span>
                <span className="text-muted-foreground">
                  {draft.serviceLevel ?? 'No service level'} · updated{' '}
                  {draft.updatedAt.toLocaleString()}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
