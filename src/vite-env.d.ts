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

// Type declaration for raw markdown imports
declare module '*.md?raw' {
  const content: string
  export default content
}

declare module '*.mp4' {
  const src: string
  export default src
}

declare module '*.mp3' {
  const src: string
  export default src
}

export {}

