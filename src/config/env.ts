export default {
  VITE_API_URL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1',
  VITE_WS_URL: import.meta.env.VITE_WS_URL || 'ws://localhost:8080',
  VITE_WS_KEY: import.meta.env.VITE_WS_KEY || 'empirequest-key',
}

