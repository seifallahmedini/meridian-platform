import { NavLink, Outlet } from 'react-router'
import { cn } from '@/lib/utils'

const navLinkClassName = ({ isActive }: { isActive: boolean }) =>
  cn(
    'rounded-md px-3 py-1.5 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground',
    isActive ? 'bg-accent text-accent-foreground' : 'text-muted-foreground',
  )

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
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-8">
        <Outlet />
      </main>
    </div>
  )
}
