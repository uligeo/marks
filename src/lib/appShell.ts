/**
 * Makes the page behave like an installed app: the browser must not zoom the whole
 * interface with two fingers or a trackpad pinch. Photo zoom is handled by the stages.
 */
export function lockPageZoom(): void {
  const prevent = (e: Event) => e.preventDefault()
  // iOS Safari ignores user-scalable=no; its proprietary gesture events still let us cancel the pinch.
  for (const type of ['gesturestart', 'gesturechange', 'gestureend']) {
    document.addEventListener(type, prevent, { passive: false })
  }
  document.addEventListener(
    'touchmove',
    (e) => {
      if (e.touches.length > 1) e.preventDefault()
    },
    { passive: false },
  )
  window.addEventListener(
    'wheel',
    (e) => {
      if (e.ctrlKey) e.preventDefault()
    },
    { passive: false },
  )
}
