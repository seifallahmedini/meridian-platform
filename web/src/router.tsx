import { createBrowserRouter } from 'react-router'
import { AppShell } from '@/layouts/AppShell'
import { SampleWidgetsPage } from '@/pages/SampleWidgetsPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [{ index: true, element: <SampleWidgetsPage /> }],
  },
])
