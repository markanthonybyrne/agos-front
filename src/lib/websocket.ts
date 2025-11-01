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
  if (echo) {
    return echo
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
  
  console.log('[WebSocket] Using Reverb exclusively')
  console.log('[WebSocket] Configuration:', wsConfig)
  console.log('[WebSocket] Auth endpoint:', authEndpoint)
  
  const wsKey = import.meta.env.VITE_WS_KEY || import.meta.env.REVERB_APP_KEY || 'o714i1l2lrdflpgv7mwg'
  const finalPort = wsConfig.port
  
  console.log('[WebSocket] Reverb Configuration:')
  console.log('  Host:', wsConfig.host)
  console.log('  Port:', wsConfig.forceTLS && finalPort === 443 ? '443 (default, not specified)' : finalPort)
  console.log('  Key:', wsKey, '(from env:', import.meta.env.VITE_WS_KEY || import.meta.env.REVERB_APP_KEY || 'not set', ')')
  console.log('  Protocol:', wsConfig.forceTLS ? 'WSS' : 'WS')
  console.log('  Full URL:', `${wsConfig.forceTLS ? 'wss' : 'ws'}://${wsConfig.host}${wsConfig.forceTLS && finalPort === 443 ? '' : `:${finalPort}`}/app/${wsKey}`)
  console.log('  Auth endpoint:', authEndpoint)
  
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

  console.log('[WebSocket] Echo configuration:', echoConfig)

  echo = new Echo(echoConfig)

  // Add connection logging
  // Type assertion needed because Laravel Echo types don't expose connector
  const echoWithConnector = echo as any
  // Reverb uses pusher-js library under the hood but connects to our Reverb server (not Pusher service)
  // The variable name 'pusher' refers to the internal connector object, not the Pusher service
  if (echoWithConnector.connector?.pusher) {
    const pusher = echoWithConnector.connector.pusher
    
    // Log initial connection state
    console.log('[WebSocket] Initial connection state:', pusher.connection.state)
    
    // Log any existing errors
    if (pusher.connection.error) {
      console.error('[WebSocket] Existing connection error:', pusher.connection.error)
    }
    
    // If connection is already failed, try to reconnect after a short delay
    if (pusher.connection.state === 'failed') {
      console.warn('[WebSocket] ⚠️ Connection started in failed state - will attempt to reconnect')
      setTimeout(() => {
        console.log('[WebSocket] Attempting to reconnect...')
        pusher.connect()
      }, 500)
    }
    
    pusher.connection.bind('connected', () => {
      console.log('[WebSocket] ✅ Connected to WebSocket server')
      console.log('[WebSocket] Connection ID:', pusher.connection.socket_id)
    })

    pusher.connection.bind('disconnected', () => {
      console.log('[WebSocket] ❌ Disconnected from WebSocket server')
    })

    pusher.connection.bind('error', (error: any) => {
      console.error('[WebSocket] ❌ Connection error:', error)
      console.error('[WebSocket] Error type:', error?.type)
      console.error('[WebSocket] Error message:', error?.message || error)
      console.error('[WebSocket] Error details:', JSON.stringify(error, null, 2))
      
      // Check for specific error types
      if (error?.type === 'TransportError') {
        console.error('[WebSocket] ⚠️ Transport error - WebSocket server may not be accessible')
        console.error('[WebSocket] Check if wss://api.agameof.space is accessible')
      }
      if (error?.type === 'RefusedError') {
        console.error('[WebSocket] ⚠️ Connection refused - server may be down or rejecting connections')
      }
    })

    pusher.connection.bind('failed', () => {
      console.error('[WebSocket] ❌ Connection failed - check WebSocket server and auth endpoint')
      console.error('[WebSocket] Attempted URL:', `${wsConfig.forceTLS ? 'wss' : 'ws'}://${wsConfig.host}:${finalPort}`)
    })

    pusher.connection.bind('state_change', (states: any) => {
      console.log('[WebSocket] Connection state changed:', states.previous, '->', states.current)
      console.log('[WebSocket] Current connection state:', pusher.connection.state)
      
      if (states.current === 'failed') {
        console.error('[WebSocket] ❌ Connection failed! Possible issues:')
        console.error('1. WebSocket server not running on port', finalPort)
        console.error('2. Auth endpoint not accessible:', authEndpoint)
        console.error('3. Invalid WebSocket key or configuration')
        console.error('4. CORS issues - check browser Network tab')
        console.error('5. Nginx proxy not configured for WebSocket')
        console.error('6. SSL/TLS certificate issues (for WSS)')
        
        // Try to get more details about the failure
        setTimeout(() => {
          if (pusher.connection.state === 'failed') {
            console.error('[WebSocket] Connection is still failed after 1 second')
            console.error('[WebSocket] Last error:', pusher.connection.error)
            
            // Check if we can manually test the connection
            console.log('[WebSocket] Debug info:')
            console.log('  - wsHost:', wsConfig.host)
            console.log('  - wsPort:', finalPort)
            console.log('  - forceTLS:', wsConfig.forceTLS)
            console.log('  - enabledTransports:', echoConfig.enabledTransports)
            console.log('  - authEndpoint:', authEndpoint)
          }
        }, 1000)
      }
      
      if (states.current === 'connected') {
        console.log('[WebSocket] ✅ Connection established successfully')
      }
      
      if (states.current === 'connecting') {
        console.log('[WebSocket] 🔄 Attempting to connect...')
      }
    })
    
    // Also log connection events (via pusher-js connector, but connecting to Reverb)
    pusher.connection.bind('connecting', () => {
      console.log('[WebSocket] 🔄 Connecting...')
    })
    
    pusher.connection.bind('unavailable', () => {
      console.warn('[WebSocket] ⚠️ Connection unavailable')
      console.warn('[WebSocket] This usually means the WebSocket server is not accessible')
    })
    
    pusher.connection.bind('ineligible', () => {
      console.warn('[WebSocket] ⚠️ Connection ineligible')
      console.warn('[WebSocket] Browser may not support WebSocket or connection is blocked')
    })
    
    // Force connection attempt logging
    setTimeout(() => {
      console.log('[WebSocket] Connection state after 100ms:', pusher.connection.state)
      if (pusher.connection.state === 'failed') {
        console.error('[WebSocket] Connection failed immediately - check Network tab for WebSocket connection attempts')
      }
    }, 100)
  } else {
    console.error('[WebSocket] ❌ Reverb connector not available!')
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


