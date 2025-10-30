declare module 'laravel-echo' {
  interface Echo {
    private(channel: string): any
    channel(channel: string): any
    listen(event: string, callback: (data: any) => void): any
    disconnect(): void
  }

  interface EchoOptions {
    broadcaster: string
    key: string
    wsHost: string
    wsPort: number
    forceTLS: boolean
    encrypted: boolean
    disableStats: boolean
    enabledTransports: string[]
    auth: {
      headers: Record<string, string>
    }
  }

  class Echo {
    constructor(options: EchoOptions)
    private(channel: string): any
    channel(channel: string): any
    listen(event: string, callback: (data: any) => void): any
    disconnect(): void
  }

  export = Echo
}

