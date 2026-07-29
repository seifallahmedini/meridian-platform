import { useAuth } from 'react-oidc-context'
import { NavLink, Outlet } from 'react-router'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

const navLinkClassName = ({ isActive }: { isActive: boolean }) =>
  cn(
    'rounded-md px-3 py-1.5 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground',
    isActive ? 'bg-accent text-accent-foreground' : 'text-muted-foreground',
  )

function UserMenu() {
  const auth = useAuth()

  if (auth.isLoading) {
    return null
  }

  if (!auth.isAuthenticated) {
    return (
      <Button variant="outline" size="sm" onClick={() => auth.signinRedirect()}>
        Log in
      </Button>
    )
  }

  const displayName = auth.user?.profile.name ?? auth.user?.profile.email ?? 'Account'

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm">
          {displayName}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-48">
        <Button variant="outline" size="sm" className="w-full" onClick={() => auth.signoutRedirect()}>
          Sign out
        </Button>
      </PopoverContent>
    </Popover>
  )
}

export function AppShell() {
  return (
    <div className="min-h-svh bg-background text-foreground">
      <header className="border-b">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-6 py-4">
          <span className="text-lg font-semibold">Meridian Platform</span>
          <nav aria-label="Main" className="flex items-center gap-1">
            <NavLink to="/" end className={navLinkClassName}>
              Home
            </NavLink>
            <NavLink to="/shipments/new" className={navLinkClassName}>
              New Shipment
            </NavLink>
            <NavLink to="/shipments/drafts" className={navLinkClassName}>
              Drafts
            </NavLink>
          </nav>
          <UserMenu />
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-8">
        <Outlet />
      </main>
    </div>
  )
}
