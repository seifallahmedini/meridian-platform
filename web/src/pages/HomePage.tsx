import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function HomePage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Meridian Platform scaffold</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-sm">
          React + Vite + shadcn/ui app shell is up.
        </p>
      </CardContent>
    </Card>
  )
}
