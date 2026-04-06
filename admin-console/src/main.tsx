import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@shared/index.css'
import { AdminApp } from '@shared/app/admin-app'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AdminApp />
  </StrictMode>,
)
