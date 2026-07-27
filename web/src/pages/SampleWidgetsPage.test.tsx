import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { SampleWidgetsPage } from './SampleWidgetsPage'

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    getHealth: vi.fn().mockResolvedValue({ status: 'healthy' }),
    getSampleWidgets: vi.fn().mockResolvedValue([{ id: '1', name: 'Widget A', createdAt: '' }]),
  },
  createAuthenticatedClient: vi.fn(),
}))

vi.mock('react-oidc-context', () => ({
  useAuth: () => ({ isAuthenticated: false, isLoading: false, signinRedirect: vi.fn() }),
}))

function renderWithQueryClient() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <SampleWidgetsPage />
    </QueryClientProvider>,
  )
}

describe('SampleWidgetsPage', () => {
  it('renders health status and sample widgets from the API client', async () => {
    renderWithQueryClient()

    expect(screen.getByText('API health')).toBeInTheDocument()
    expect(screen.getByText('Sample widgets')).toBeInTheDocument()

    await waitFor(() => expect(screen.getByText('Status: healthy')).toBeInTheDocument())
    await waitFor(() => expect(screen.getByText('Widget A')).toBeInTheDocument())

    expect(screen.getByRole('button', { name: 'Log in with Keycloak' })).toBeInTheDocument()
  })
})
