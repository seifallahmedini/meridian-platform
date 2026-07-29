import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Toaster } from 'sonner'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NewShipmentPage } from './NewShipmentPage'

const mockClient = {
  getLocations: vi.fn().mockResolvedValue([
    {
      id: '11111111-1111-4111-8111-111111111111',
      label: 'Origin Warehouse',
      addressLine1: '1 St',
      city: 'X',
      state: 'Y',
      postalCode: '1',
      country: 'US',
    },
    {
      id: '22222222-2222-4222-9222-222222222222',
      label: 'Destination Depot',
      addressLine1: '2 Ave',
      city: 'X',
      state: 'Y',
      postalCode: '2',
      country: 'US',
    },
  ]),
  createLocation: vi.fn(),
  createShipment: vi.fn().mockResolvedValue({ id: 'ship-1' }),
  updateShipment: vi.fn(),
  getShipmentById: vi.fn(),
}

const mockNavigate = vi.fn()

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
  useNavigate: () => mockNavigate,
}))

beforeEach(() => {
  mockNavigate.mockReset()
})

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <NewShipmentPage />
      <Toaster />
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

  it('saves as draft even when every field is empty, showing a success toast', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: /save as draft/i }))

    await waitFor(() => expect(mockClient.createShipment).toHaveBeenCalledTimes(1))
    expect(mockClient.createShipment.mock.calls[0][0]).toMatchObject({ isDraft: true })
    expect(await screen.findByText('Draft saved.')).toBeInTheDocument()
  })

  it('selecting an existing location from the combobox populates the field', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('combobox', { name: /origin/i }))
    const option = await screen.findByText('Origin Warehouse')
    await user.click(option)

    expect(screen.getByRole('combobox', { name: /origin/i })).toHaveTextContent('Origin Warehouse')
  })

  it('shows a visible error and does not navigate away when saving a draft fails', async () => {
    mockClient.createShipment.mockRejectedValueOnce(new Error('Network error'))
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: /save as draft/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/network error/i)
  })

  it('cancel button navigates back to drafts without saving', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: /cancel/i }))

    expect(mockNavigate).toHaveBeenCalledWith('/shipments/drafts')
  })

  it('shows a back-to-drafts control on the success screen after creating a shipment', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('combobox', { name: /origin/i }))
    await user.click(await screen.findByText('Origin Warehouse'))

    await user.click(screen.getByRole('combobox', { name: /destination/i }))
    await user.click(await screen.findByText('Destination Depot'))

    await user.type(screen.getByLabelText(/weight/i), '10')
    await user.type(screen.getByLabelText(/length/i), '10')
    await user.type(screen.getByLabelText(/width/i), '10')
    await user.type(screen.getByLabelText(/height/i), '10')

    await user.click(screen.getByRole('combobox', { name: /freight class/i }))
    await user.click(await screen.findByRole('option', { name: '50' }))

    await user.click(screen.getByRole('combobox', { name: /service level/i }))
    await user.click(await screen.findByRole('option', { name: 'Standard' }))

    await user.click(screen.getByRole('button', { name: /create shipment/i }))

    expect(await screen.findByText('Shipment created')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /back to drafts/i }))
    expect(mockNavigate).toHaveBeenCalledWith('/shipments/drafts')
  })
})
