import Echo from 'laravel-echo'
import Pusher from 'pusher-js'

let echo: Echo | null = null

function getWebSocketConfig() {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1'
  const wsHost = import.meta.env.VITE_WS_HOST
  const wsPort = import.meta.env.VITE_WS_PORT
  
  // If VITE_WS_HOST is explicitly set, use it
  if (wsHost) {
    return {
      host: wsHost.replace(/^https?:\/\//, '').replace(/\/$/, ''), // Remove protocol and trailing slash
      port: wsPort ? parseInt(wsPort) : 8080,
      forceTLS: wsHost.includes('https://') || wsHost.includes('lndo.site'),
    }
  }
  
  // Otherwise, derive from API URL
  try {
    const url = new URL(apiUrl)
    const host = url.hostname
    const isHttps = url.protocol === 'https:' || host.includes('lndo.site')
    
    return {
      host: host,
      port: wsPort ? parseInt(wsPort) : 8080, // Laravel Reverb default port
      forceTLS: isHttps,
    }
  } catch {
    // Fallback to environment variables or defaults
    return {
      host: 'localhost',
      port: wsPort ? parseInt(wsPort) : 51370,
      forceTLS: false,
    }
  }
}

export function initializeEcho(token: string): Echo {
  if (echo) {
    return echo
  }

  window.Pusher = Pusher
  
  const wsConfig = getWebSocketConfig()
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1'
  
  // Extract base URL for auth endpoint
  let authEndpoint = '/broadcasting/auth'
  try {
    const url = new URL(apiUrl)
    // Remove /api/v1 and add /broadcasting/auth
    authEndpoint = `${url.protocol}//${url.host}/broadcasting/auth`
  } catch {
    // Fallback
    authEndpoint = '/broadcasting/auth'
  }
  
  console.log('WebSocket config:', wsConfig)
  console.log('Auth endpoint:', authEndpoint)

  // Laravel Reverb configuration
  // Note: Reverb uses Pusher protocol internally but connects directly to Reverb server
  // For HTTPS sites (like Lando), WebSocket might need to go through port 443 with a proxy
  // If direct connection fails, try using the main HTTPS port
  
  // For Lando/HTTPS, try connecting through the main port if WS port fails
  const useMainPort = wsConfig.forceTLS && wsConfig.host.includes('lndo.site')
  const finalPort = useMainPort ? 443 : wsConfig.port
  
  const echoConfig: any = {
    broadcaster: 'reverb',
    key: import.meta.env.VITE_WS_KEY || 'o714i1l2lrdflpgv7mwg',
    wsHost: wsConfig.host,
    wsPort: finalPort,
    wssPort: finalPort,
    forceTLS: wsConfig.forceTLS,
    encrypted: wsConfig.forceTLS,
    disableStats: true,
    enabledTransports: wsConfig.forceTLS ? ['wss'] : ['ws'],
    authEndpoint: authEndpoint,
    auth: {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    },
  }
  
  console.log('Using WebSocket port:', finalPort, '(main port for HTTPS:', useMainPort, ')')

  console.log('Echo configuration:', echoConfig)

  echo = new Echo(echoConfig)

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


