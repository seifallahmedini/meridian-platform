import { createBrowserRouter } from 'react-router'
import { ProtectedRoute } from '@/auth/ProtectedRoute'
import { AppShell } from '@/layouts/AppShell'
import { SampleWidgetsPage } from '@/pages/SampleWidgetsPage'
import { DraftsListPage } from '@/pages/shipments/DraftsListPage'
import { NewShipmentPage } from '@/pages/shipments/NewShipmentPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <SampleWidgetsPage /> },
      {
        path: 'shipments/new',
        element: (
          <ProtectedRoute>
            <NewShipmentPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'shipments/new/:id',
        element: (
          <ProtectedRoute>
            <NewShipmentPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'shipments/drafts',
        element: (
          <ProtectedRoute>
            <DraftsListPage />
          </ProtectedRoute>
        ),
      },
    ],
  },
])
