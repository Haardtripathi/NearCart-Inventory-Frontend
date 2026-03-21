import { RouterProvider } from 'react-router-dom'

import { AppProviders } from '@/app/providers'
import { router } from '@/app/router'
import { useMeQuery } from '@/features/auth/auth.api'
import { useAuthStore } from '@/store/auth.store'

function SessionBootstrap() {
  const token = useAuthStore((state) => state.token)
  useMeQuery(Boolean(token))
  return null
}

function App() {
  return (
    <AppProviders>
      <SessionBootstrap />
      <RouterProvider router={router} />
    </AppProviders>
  )
}

export default App
