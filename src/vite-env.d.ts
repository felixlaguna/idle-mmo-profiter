/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_STATIC_MODE?: string
  readonly VITE_API_BASE_URL?: string
  readonly VITE_ALLOWED_HOSTS?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/no-explicit-any
  const component: DefineComponent<{}, {}, any>
  export default component
}
