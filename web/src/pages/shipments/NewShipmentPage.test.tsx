import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { NewShipmentPage } from './NewShipmentPage'

const mockClient = {
  getLocations: vi.fn().mockResolvedValue([
    { id: 'loc-1', label: 'Origin Warehouse', addressLine1: '1 St', city: 'X', state: 'Y', postalCode: '1', country: 'US' },
  ]),
  createLocation: vi.fn(),
  createShipment: vi.fn().mockResolvedValue({ id: 'ship-1' }),
  updateShipment: vi.fn(),
  getShipmentById: vi.fn(),
}

vi.mock('@/lib/api-client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api-client')>()
  return {
    ...actual,
    createAuthenticatedClient: () => mockClient,
  }
})

vi.mock('react-oidc-context', () => ({
  useAuth: () => ({
    isAuthenticated: true,
    isLoading: false,
    user: { access_token: 'test-token' },
    signinRedirect: vi.fn(),
  }),
}))

vi.mock('react-router', () => ({
  useParams: () => ({}),
  useNavigate: () => vi.fn(),
}))

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <NewShipmentPage />
    </QueryClientProvider>,
  )
}

describe('NewShipmentPage', () => {
  it('reveals hazmat fields and blocks submit until they are filled in', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('switch', { name: /hazardous material/i }))
    expect(screen.getByLabelText(/un number/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /create shipment/i }))

    expect(await screen.findByText(/UN number must match/i)).toBeInTheDocument()
    expect(mockClient.createShipment).not.toHaveBeenCalled()
  })

  it('saves as draft even when every field is empty', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: /save as draft/i }))

    await waitFor(() => expect(mockClient.createShipment).toHaveBeenCalledTimes(1))
    expect(mockClient.createShipment.mock.calls[0][0]).toMatchObject({ isDraft: true })
  })

  it('selecting an existing location from the combobox populates the field', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('combobox', { name: /origin/i }))
    const option = await screen.findByText('Origin Warehouse')
    await user.click(option)

    expect(screen.getByRole('combobox', { name: /origin/i })).toHaveTextContent('Origin Warehouse')
  })
})
