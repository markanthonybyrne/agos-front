import Echo from 'laravel-echo'
import Pusher from 'pusher-js'

let echo: Echo | null = null

function getWebSocketConfig() {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1'
  const wsHost = import.meta.env.VITE_WS_HOST || import.meta.env.REVERB_HOST
  const wsPort = import.meta.env.VITE_WS_PORT || import.meta.env.REVERB_PORT
  const wsScheme = import.meta.env.VITE_WS_SCHEME || import.meta.env.REVERB_SCHEME
  
  // If VITE_WS_HOST or REVERB_HOST is explicitly set, use it
  if (wsHost) {
    const host = wsHost.replace(/^wss?:\/\//, '').replace(/^https?:\/\//, '').replace(/\/$/, '') // Remove protocol and trailing slash
    // Check scheme (REVERB_SCHEME or VITE_WS_SCHEME) first, then check if host includes secure protocol
    const isSecure = wsScheme === 'https' || wsScheme === 'wss' || wsHost.includes('wss://') || wsHost.includes('https://')
    
    return {
      host: host,
      port: wsPort ? parseInt(wsPort.toString()) : 8081, // Use REVERB_PORT if set, default to 8081
      forceTLS: isSecure && !host.includes('localhost') && !host.includes('127.0.0.1'),
    }
  }
  
  // Otherwise, derive from API URL
  try {
    const url = new URL(apiUrl)
    const host = url.hostname
    // For localhost/local development (including Lando), always use localhost:8080 with WS (not WSS)
    const isLocalhost = host === 'localhost' || host === '127.0.0.1'
    const isLando = host.includes('lndo.site')
    
    // For local development (localhost or Lando), use 127.0.0.1:8080 with plain WS
    if (isLocalhost || isLando) {
      return {
        host: '127.0.0.1', // Use 127.0.0.1 instead of localhost for better compatibility
        port: wsPort ? parseInt(wsPort) : 8080, // Reverb local development port
        forceTLS: false,
      }
    }
    
    // For staging/production domains, use WSS (secure WebSocket)
    // WebSocket goes through Nginx proxy on same hostname as API
    const isHttps = url.protocol === 'https:'
    
    // For WSS, we typically don't need a port (uses 443) or can use 443 explicitly
    // Reverb WebSocket connection
    return {
      host: host, // Use same hostname as API (e.g., api.agameof.space)
      port: wsPort ? parseInt(wsPort) : (isHttps ? 443 : 8080), // Use 443 for WSS, 8080 for WS
      forceTLS: isHttps,
    }
  } catch {
    // Fallback to environment variables or defaults
    return {
      host: '127.0.0.1', // Use 127.0.0.1 instead of localhost for better compatibility
      port: wsPort ? parseInt(wsPort) : 8080, // Reverb local development port
      forceTLS: false,
    }
  }
}

export function initializeEcho(token: string): Echo {
  // If Echo already exists, reuse it
  // Laravel Echo handles authentication per-channel, so each private channel subscription
  // will make its own auth request with the current token from the auth config.
  // We only reinitialize if there's no token (logout scenario).
  if (echo && token) {
    // Update the auth config in case token changed, but don't disconnect
    // Laravel Echo will use the updated auth headers for new channel subscriptions
    const echoWithConnector = echo as any
    if (echoWithConnector.options?.auth?.headers) {
      echoWithConnector.options.auth.headers.Authorization = `Bearer ${token}`
    }
    return echo
  }
  
  // If token is missing or Echo doesn't exist, disconnect and clean up
  if (echo && !token) {
    console.log('[WebSocket] No token provided, disconnecting Echo...')
    echo.disconnect()
    echo = null
  }

  // Laravel Echo with Reverb still requires pusher-js library and window.Pusher
  // We're using Reverb broadcaster which connects to our Reverb server, not Pusher service
  window.Pusher = Pusher
  
  const wsConfig = getWebSocketConfig()
  const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1'
  
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
  
  const wsKey = import.meta.env.VITE_WS_KEY || import.meta.env.REVERB_APP_KEY || 'o714i1l2lrdflpgv7mwg'
  const finalPort = wsConfig.port
  
  const echoConfig = {
    broadcaster: 'reverb',
    key: wsKey,
    wsHost: wsConfig.host,
    wsPort: finalPort,
    wssPort: finalPort,
    forceTLS: wsConfig.forceTLS,
    encrypted: wsConfig.forceTLS,
    disableStats: true,
    enabledTransports: wsConfig.forceTLS ? ['ws', 'wss'] : ['ws'],
    authEndpoint: authEndpoint,
    auth: {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    },
  }

  echo = new Echo(echoConfig)

  // Add critical connection error logging and connection confirmation
  const echoWithConnector = echo as any
  if (echoWithConnector.connector?.pusher) {
    const pusher = echoWithConnector.connector.pusher
    
    // If connection is already failed, try to reconnect after a short delay
    if (pusher.connection.state === 'failed') {
      setTimeout(() => {
        pusher.connect()
      }, 500)
    }

    pusher.connection.bind('connected', () => {
      console.log('[WebSocket] ✅ WebSocket connection established')
      console.log(`[WebSocket] Connection ID: ${pusher.connection.socket_id}`)
    })

    pusher.connection.bind('error', (error: any) => {
      console.error('[WebSocket] Connection error:', error?.type || error?.message || error)
    })

    pusher.connection.bind('failed', () => {
      console.error('[WebSocket] Connection failed - check WebSocket server and auth endpoint')
      console.error('[WebSocket] URL:', `${wsConfig.forceTLS ? 'wss' : 'ws'}://${wsConfig.host}:${finalPort}`)
    })
    
    // Log subscription authorization attempts and errors
    pusher.bind('pusher:subscription_error', (data: any) => {
      console.error('[WebSocket] ❌ Channel subscription authorization error:', data)
      console.error('[WebSocket] Channel:', data.channel)
      console.error('[WebSocket] Status:', data.status)
      console.error('[WebSocket] Auth endpoint:', authEndpoint)
    })
    
    pusher.bind('pusher:subscription_succeeded', (data: any) => {
      if (data.channel && data.channel.includes('App.Models.User')) {
        console.log('[WebSocket] ✅ Private user channel authorized:', data.channel)
      }
    })
  } else {
    console.error('[WebSocket] Reverb connector not available!')
  }

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


