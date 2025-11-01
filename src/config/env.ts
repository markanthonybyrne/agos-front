export default {
  VITE_API_URL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1',
  VITE_WS_URL: import.meta.env.VITE_WS_URL || 'ws://127.0.0.1:8080',
  VITE_WS_KEY: import.meta.env.VITE_WS_KEY || import.meta.env.REVERB_APP_KEY || 'o714i1l2lrdflpgv7mwg',
  VITE_WS_HOST: import.meta.env.VITE_WS_HOST || import.meta.env.REVERB_HOST,
  VITE_WS_PORT: import.meta.env.VITE_WS_PORT || import.meta.env.REVERB_PORT,
  VITE_WS_SCHEME: import.meta.env.VITE_WS_SCHEME || import.meta.env.REVERB_SCHEME,
}

