import { useRegisterSW } from 'virtual:pwa-register/react'

const CHECK_EVERY_MS = 60 * 60 * 1000

/** Offers to reload when a new version is ready, so nobody loses an edit to a silent update. */
export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      if (registration) setInterval(() => registration.update(), CHECK_EVERY_MS)
    },
  })

  if (!needRefresh) return null
  return (
    <div className="update-prompt" role="status">
      <span>Hay una versión nueva de la app.</span>
      <button type="button" className="btn btn-ghost" onClick={() => setNeedRefresh(false)}>Después</button>
      <button type="button" className="btn btn-primary" onClick={() => updateServiceWorker(true)}>Actualizar</button>
    </div>
  )
}
