/// <reference types="vite/client" />

declare global {
  interface Window {
    Pusher: typeof import('pusher-js').default
    Echo: typeof import('laravel-echo').default
  }
}

interface ImportMetaEnv {
  readonly VITE_API_URL?: string
  readonly VITE_WS_URL?: string
  readonly VITE_WS_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

export {}

