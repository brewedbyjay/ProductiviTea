import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './ui/App.tsx'
import { ensureDataVersion } from './infrastructure/dexie/dataVersion.ts'

// Wipe stale local data before the first paint when DATA_VERSION has been bumped,
// so the UI never renders records that predate the current model.
void ensureDataVersion().finally(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})
