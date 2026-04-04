import { createBrowserRouter, Navigate } from 'react-router-dom'
import type { ReactElement } from 'react'
import { AppShell } from '../components/layout/app-shell'
import { useAuth } from '../context/auth-context'
import { AdminPage } from '../pages/admin-page'
import { CartPage } from '../pages/cart-page'
import { CheckoutPage } from '../pages/checkout-page'
import { HomePage } from '../pages/home-page'
import { LoginPage } from '../pages/login-page'
import { NotFoundPage } from '../pages/not-found-page'
import { OrdersPage } from '../pages/orders-page'
import { ProductDetailPage } from '../pages/product-detail-page'
import { ProfilePage } from '../pages/profile-page'
import { SettingsPage } from '../pages/settings-page'

const RequireAuth = ({ children }: { children: ReactElement }) => {
  const { isAuthenticated, isLoading } = useAuth()
  if (isLoading) return <div className="py-16 text-center text-sm text-muted-foreground">Checking session...</div>
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return children
}

const RequireAdmin = ({ children }: { children: ReactElement }) => {
  const { user } = useAuth()
  if (user?.role !== 'ADMIN') {
    return <Navigate to="/" replace />
  }
  return children
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'products/:id', element: <ProductDetailPage /> },
      {
        path: 'cart',
        element: (
          <RequireAuth>
            <CartPage />
          </RequireAuth>
        ),
      },
      {
        path: 'checkout',
        element: (
          <RequireAuth>
            <CheckoutPage />
          </RequireAuth>
        ),
      },
      {
        path: 'profile',
        element: (
          <RequireAuth>
            <ProfilePage />
          </RequireAuth>
        ),
      },
      {
        path: 'orders',
        element: (
          <RequireAuth>
            <OrdersPage />
          </RequireAuth>
        ),
      },
      {
        path: 'settings',
        element: (
          <RequireAuth>
            <SettingsPage />
          </RequireAuth>
        ),
      },
      {
        path: 'admin',
        element: (
          <RequireAuth>
            <RequireAdmin>
              <AdminPage />
            </RequireAdmin>
          </RequireAuth>
        ),
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
