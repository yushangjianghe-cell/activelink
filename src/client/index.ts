declare module 'koishi' {
  interface Events {
    'activelink/send-message'(channelId: string, message: string): void
  }
}

export const activelink = Object.assign({}, {
  name: 'activelink',
  inherit: true,
  using: [] as const,
  apply() {},
})

export default activelink

export interface ActiveLinkConfig {
  triggerTemplate: string
  scope: {
    channels: string[]
    users: string[]
  }
  scheduled: {
    enabled: boolean
    cron: string
    message: string
  }
  festival: {
    enabled: boolean
    greetings: Record<string, string>
  }
  proactive: {
    enabled: boolean
    interval: number
    message: string
  }
  activityIdle: {
    enabled: boolean
    idleThreshold: number
    message: string
  }
}
