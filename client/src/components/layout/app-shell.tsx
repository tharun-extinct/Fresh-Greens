import { Outlet } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AppHeader } from './app-header'
import { AppFooter } from './app-footer'

export const AppShell = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppHeader />
      <main className="mx-auto w-full max-w-7xl px-4 py-7 md:py-8">
        <Outlet />
      </main>
      <AppFooter />
      <Toaster richColors position="top-right" />
    </div>
  )
}
