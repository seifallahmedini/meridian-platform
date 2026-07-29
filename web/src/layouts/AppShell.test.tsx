import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AppShell } from './AppShell'

const mockUseAuth = vi.fn()

vi.mock('react-oidc-context', () => ({
  useAuth: () => mockUseAuth(),
}))

function renderShellAt(initialPath: string) {
  const router = createMemoryRouter(
    [
      {
        path: '/',
        element: <AppShell />,
        children: [
          { index: true, element: <p>Home page</p> },
          { path: 'shipments/new', element: <p>New shipment page</p> },
          { path: 'shipments/new/:id', element: <p>Edit shipment page</p> },
          { path: 'shipments/drafts', element: <p>Drafts page</p> },
        ],
      },
    ],
    { initialEntries: [initialPath] },
  )
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
}

describe('AppShell', () => {
  beforeEach(() => {
    mockUseAuth.mockReset()
  })

  it('renders nav links to Home, New Shipment, and Drafts', () => {
    mockUseAuth.mockReturnValue({ isLoading: false, isAuthenticated: false, signinRedirect: vi.fn() })
    renderShellAt('/')

    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/')
    expect(screen.getByRole('link', { name: 'New Shipment' })).toHaveAttribute('href', '/shipments/new')
    expect(screen.getByRole('link', { name: 'Drafts' })).toHaveAttribute('href', '/shipments/drafts')
  })

  it('marks the active route with aria-current, including the nested edit route', () => {
    mockUseAuth.mockReturnValue({ isLoading: false, isAuthenticated: false, signinRedirect: vi.fn() })
    renderShellAt('/shipments/new/abc-123')

    expect(screen.getByRole('link', { name: 'New Shipment' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Home' })).not.toHaveAttribute('aria-current')
  })

  it('shows a Log in affordance when unauthenticated', () => {
    mockUseAuth.mockReturnValue({ isLoading: false, isAuthenticated: false, signinRedirect: vi.fn() })
    renderShellAt('/')

    expect(screen.getByRole('button', { name: 'Log in' })).toBeInTheDocument()
  })

  it('renders nothing in the user-menu slot while auth is loading', () => {
    mockUseAuth.mockReturnValue({ isLoading: true, isAuthenticated: false })
    renderShellAt('/')

    expect(screen.queryByRole('button', { name: 'Log in' })).not.toBeInTheDocument()
  })

  it('shows the user menu and signs out when authenticated', async () => {
    const user = userEvent.setup()
    const signoutRedirect = vi.fn()
    mockUseAuth.mockReturnValue({
      isLoading: false,
      isAuthenticated: true,
      user: { profile: { name: 'Jane Doe', email: 'jane@example.com' } },
      signoutRedirect,
    })
    renderShellAt('/')

    await user.click(screen.getByRole('button', { name: 'Jane Doe' }))
    await user.click(screen.getByRole('button', { name: 'Sign out' }))

    expect(signoutRedirect).toHaveBeenCalled()
  })

  it('falls back to email, then a generic label, when no name claim is present', () => {
    mockUseAuth.mockReturnValue({
      isLoading: false,
      isAuthenticated: true,
      user: { profile: { email: 'jane@example.com' } },
      signoutRedirect: vi.fn(),
    })
    renderShellAt('/')

    expect(screen.getByRole('button', { name: 'jane@example.com' })).toBeInTheDocument()
  })
})
