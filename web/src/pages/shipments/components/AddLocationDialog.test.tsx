import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Toaster } from 'sonner'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AddLocationDialog } from './AddLocationDialog'

const mockClient = {
  createLocation: vi.fn(),
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
  }),
}))

beforeEach(() => {
  mockClient.createLocation.mockReset()
})

function renderDialog({ onCreated = vi.fn(), onOpenChange = vi.fn() } = {}) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return {
    onCreated,
    onOpenChange,
    ...render(
      <QueryClientProvider client={queryClient}>
        <AddLocationDialog open onOpenChange={onOpenChange} onCreated={onCreated} />
        <Toaster />
      </QueryClientProvider>,
    ),
  }
}

async function fillRequiredFields(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/label/i), 'Main Warehouse')
  await user.type(screen.getByLabelText(/address line 1/i), '1 Main St')
  await user.type(screen.getByLabelText(/^city$/i), 'Springfield')
  await user.type(screen.getByLabelText(/^state$/i), 'IL')
  await user.type(screen.getByLabelText(/postal code/i), '62701')
  await user.type(screen.getByLabelText(/^country$/i), 'US')
}

describe('AddLocationDialog', () => {
  it('shows an error toast and keeps the dialog open when saving fails', async () => {
    mockClient.createLocation.mockRejectedValueOnce(new Error('Network error'))
    const user = userEvent.setup()
    const { onCreated, onOpenChange } = renderDialog()

    await fillRequiredFields(user)
    await user.click(screen.getByRole('button', { name: /save address/i }))

    expect(await screen.findByText(/failed to save the address/i)).toBeInTheDocument()
    expect(onCreated).not.toHaveBeenCalled()
    expect(onOpenChange).not.toHaveBeenCalledWith(false)
  })

  it('shows a success toast and closes the dialog when saving succeeds', async () => {
    mockClient.createLocation.mockResolvedValueOnce({ id: 'loc-1', label: 'Main Warehouse' })
    const user = userEvent.setup()
    const { onCreated, onOpenChange } = renderDialog()

    await fillRequiredFields(user)
    await user.click(screen.getByRole('button', { name: /save address/i }))

    expect(await screen.findByText('Address saved.')).toBeInTheDocument()
    expect(onCreated).toHaveBeenCalledWith({ id: 'loc-1', label: 'Main Warehouse' })
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})
