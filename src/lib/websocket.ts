import Echo from 'laravel-echo'
import Pusher from 'pusher-js'

let echo: Echo | null = null

export function initializeEcho(token: string): Echo {
  if (echo) {
    return echo
  }

  window.Pusher = Pusher

  echo = new Echo({
    broadcaster: 'reverb',
    key: import.meta.env.VITE_WS_KEY || 'o714i1l2lrdflpgv7mwg',
    wsHost: import.meta.env.VITE_WS_HOST || 'localhost',
    wsPort: parseInt(import.meta.env.VITE_WS_PORT || '51370'),
    forceTLS: false,
    encrypted: false,
    disableStats: true,
    enabledTransports: ['ws', 'wss'],
    auth: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  })

  return echo
}

export function getEcho(): Echo | null {
  return echo
}

export function disconnectEcho(): void {
  if (echo) {
    echo.disconnect()
    echo = null
  }
}

