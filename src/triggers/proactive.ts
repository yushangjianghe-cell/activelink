import { Context } from 'koishi'
import { ActiveLinkService } from '../service'
import { isInScope, ScopeConfig } from '../utils/scope'
import { getAllRooms } from '../utils/room'
import { isInSleepTime } from '../utils/shared'

export interface ProactiveConfig {
  enabled: boolean
  checkInterval: number
  initialDelay: number
  initialProbability: number
  probabilityIncrease: number
  maxProbability: number
  sleepStart: string
  sleepEnd: string
  prompts: string[]
}

interface RoomState {
  lastChatTime: number
  currentProbability: number
}

export class ProactiveTrigger {
  private timer: any
  private roomStates: Map<string, RoomState> = new Map()

  constructor(
    private ctx: Context,
    private config: ProactiveConfig,
    private service: ActiveLinkService,
    private scope: ScopeConfig
  ) {
    this.listenToChatEvents()
  }

  private listenToChatEvents() {
    this.ctx.on('message', (session) => {
      const channelId = session.channelId || ''
      const guildId = session.guildId || ''
      if (!channelId && !guildId) return

      const key = guildId || channelId
      this.roomStates.set(key, {
        lastChatTime: Date.now(),
        currentProbability: 0
      })
    })
  }

  start() {
    if (!this.config.enabled) {
      return
    }

    const intervalMs = this.config.checkInterval * 60 * 1000

    this.timer = this.ctx.setInterval(() => {
      this.checkAndTrigger()
    }, intervalMs)

    this.ctx.logger('activelink').info(
      `Proactive chat enabled (check every ${this.config.checkInterval}min, delay ${this.config.initialDelay}h)`
    )
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
  }

  private isInSleepTime(): boolean {
    return isInSleepTime(this.config.sleepStart, this.config.sleepEnd)
  }

  private async checkAndTrigger() {
    if (this.isInSleepTime()) {
      return
    }

    await this.checkChatLuna()
  }

  private async checkChatLuna() {
    try {
      const rooms = await getAllRooms(this.ctx)
      const now = Date.now()
      const initialDelayMs = this.config.initialDelay * 60 * 60 * 1000

      for (const roomInfo of rooms) {
        try {
          const channelId = roomInfo.channelId

          if (!isInScope(channelId, this.scope)) {
            continue
          }

          let state = this.roomStates.get(channelId)
          if (!state) {
            state = { lastChatTime: now, currentProbability: 0 }
            this.roomStates.set(channelId, state)
            continue
          }

          const timeSinceLastChat = now - state.lastChatTime

          if (timeSinceLastChat < initialDelayMs) {
            continue
          }

          if (state.currentProbability === 0) {
            state.currentProbability = this.config.initialProbability
          } else {
            state.currentProbability = Math.min(
              state.currentProbability + this.config.probabilityIncrease,
              this.config.maxProbability
            )
          }

          const random = Math.random()

          if (random > state.currentProbability) {
            continue
          }

          const prompts = this.config.prompts?.length ? this.config.prompts : ['主动来找用户聊天']
          const prompt = prompts[Math.floor(Math.random() * prompts.length)]

          const success = await this.service.chatExecutor.executeWithRoom(
            roomInfo.userId,
            roomInfo.channelId,
            prompt,
            roomInfo.room
          )

          if (success) {
            state.lastChatTime = now
            state.currentProbability = 0
          }
        } catch (err) {
          // 静默处理单个房间的错误
        }

        await new Promise(resolve => setTimeout(resolve, 200))
      }
    } catch (err) {
      this.ctx.logger('activelink').error('Proactive check failed:', err)
    }
  }
}
