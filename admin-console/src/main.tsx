import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@shared/index.css'
import './admin.css'
import { AdminConsoleApp } from './admin-console-app'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AdminConsoleApp />
  </StrictMode>,
)
