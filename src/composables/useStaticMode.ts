/**
 * Build-time static mode composable.
 * When VITE_STATIC_MODE=true, all interactive/API-dependent UI is excluded.
 * This is used for GitHub Pages deployment where no API proxy is available.
 */
export function useStaticMode() {
  // Vite replaces import.meta.env.VITE_STATIC_MODE at build time,
  // so dead-code elimination removes the interactive branches from the bundle.
  const isStaticMode = import.meta.env.VITE_STATIC_MODE === 'true'
  return { isStaticMode }
}
