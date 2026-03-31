import { Context, Session, h } from 'koishi'
import { randomUUID } from 'crypto'
import { ActiveLinkTask, ConversationRoom, MessageTarget, TriggerReason } from '../types'
import { AdapterManager } from '../adapters'
import { getUserRoom } from '../utils/room'
import { buildTriggerMessage, getGuildIdFromChannelId, isGroupChannel } from '../utils/shared'

export class ChatExecutor {
  private adapterManager: AdapterManager
  private sessionCache: Map<string, Session> = new Map()

  constructor(private ctx: Context, private config: any) {
    this.adapterManager = new AdapterManager(ctx)

    this.ctx.on('message', (session) => {
      if (this.ctx.bots[session.uid]) return

      const channelId = session.channelId || ''
      const guildId = session.guildId || ''
      const userId = session.userId || ''

      if (channelId) {
        this.sessionCache.set(channelId, session)
      }

      if (guildId) {
        this.sessionCache.set(guildId, session)
      }

      if (session.isDirect && userId) {
        const privateChannelId = channelId?.startsWith('private:')
          ? channelId
          : `private:${userId}`
        this.sessionCache.set(privateChannelId, session)
        this.sessionCache.set(userId, session)
      }
    })
  }

  async executeTask(task: ActiveLinkTask): Promise<boolean> {
    const room = await getUserRoom(this.ctx, task.userId, task.channelId)
    if (!room) {
      this.ctx.logger('activelink').warn(`No room found for task [${task.id}]`)
      return false
    }

    return this.executeWithRoom(task.userId, task.channelId, task.content, room)
  }

  async executeWithRoom(
    userId: string,
    channelId: string,
    content: string,
    room: ConversationRoom
  ): Promise<boolean> {
    const logger = this.ctx.logger('activelink')
    const maxRetries = 6

    if (!room.model) {
      logger.error(`Room [${room.roomName}] has no model configured`)
      return false
    }

    const triggerMessage = buildTriggerMessage(this.config.triggerTemplate, content)

    let session: Session | null = null
    let selectedBot: any = null

    const cachedSession = this.getCachedSession(channelId, userId)
    if (cachedSession) {
      session = cachedSession
      selectedBot = cachedSession.bot
      session.timestamp = Date.now()
      session.content = triggerMessage
      this.debug(logger, `Using cached session for channel: ${channelId}`)
    } else {
      for (const bot of this.ctx.bots) {
        try {
          const isGroup = isGroupChannel(channelId)
          const guildId = getGuildIdFromChannelId(channelId)

          session = bot.session({
            type: 'message',
            timestamp: Date.now(),
            selfId: bot.selfId,
            user: { id: userId },
            channel: { id: channelId, type: isGroup ? 0 : 1 },
            guild: isGroup ? { id: guildId } : undefined,
            content: triggerMessage
          } as any)

          selectedBot = bot
          this.debug(logger, `Using bot: ${bot.platform}`)
          break
        } catch (err) {
          this.debug(logger, `Bot ${bot.platform} failed to create session`)
          continue
        }
      }
    }

    if (!session || !selectedBot) {
      logger.error('No valid bot/session available')
      return false
    }

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        this.debug(logger, `[Attempt ${attempt}/${maxRetries}] Executing chat for room [${room.roomName}], model: ${room.model}`)

        const events = this.createChatEvents()

        const response = await this.ctx.chatluna.chat(
          session,
          room,
          {
            content: triggerMessage,
            role: 'system'
          },
          events,
          false,
          {},
          undefined,
          randomUUID()
        )

        let rawContent = response.content as string
        const cleanedText = this.removeActionTags(rawContent)
        const messages = this.extractMessages(cleanedText)

        if (messages.length === 0) {
          logger.warn(`[Attempt ${attempt}/${maxRetries}] Empty response`)
          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 1000))
            continue
          }
          return false
        }

        await this.sendMessages(session, messages)
        this.debug(logger, `Sent to [${room.roomName}] (${messages.length} message(s))`)

        return true
      } catch (err) {
        logger.error(`[Attempt ${attempt}/${maxRetries}] Chat execution failed:`, err instanceof Error ? err.message : String(err))
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      }
    }

    logger.error(`Chat execution failed after ${maxRetries} attempts`)
    return false
  }

  async executeProactive(
    target: MessageTarget,
    trigger: TriggerReason,
    template: string,
    historyText?: string
  ): Promise<boolean> {
    const logger = this.ctx.logger('activelink')
    const maxRetries = 6

    const room = await getUserRoom(this.ctx, target.userId || 'system', target.channelId)
    if (!room) {
      logger.warn(`No room found for proactive message`)
      return false
    }

    if (!room.model) {
      logger.error(`Room [${room.roomName}] has no model configured`)
      return false
    }

    const vars = await this.buildTemplateVars(target, trigger, historyText || '')
    const prompt = this.renderTemplate(template, vars)

    let session = this.getCachedSession(target.channelId, target.userId)
    if (session) {
      session.timestamp = Date.now()
      session.content = prompt
    } else {
      session = this.adapterManager.createSession(target, prompt)
    }

    if (!session) {
      logger.error('Failed to create session for proactive message')
      return false
    }

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        this.debug(logger, `[Attempt ${attempt}/${maxRetries}] ExecuteProactive for room [${room.roomName}], model: ${room.model}`)

        const events = this.createChatEvents()

        const response = await this.ctx.chatluna.chat(
          session,
          room,
          {
            content: prompt,
            role: 'system'
          },
          events,
          false,
          {},
          undefined,
          randomUUID()
        )

        let rawContent = response.content as string
        const cleanedText = this.removeActionTags(rawContent)
        const messages = this.extractMessages(cleanedText)

        if (messages.length === 0) {
          logger.warn(`[Attempt ${attempt}/${maxRetries}] Empty response for proactive message`)
          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 1000))
            continue
          }
          return false
        }

        await this.sendMessages(session, messages)
        this.debug(logger, `Proactive message sent (${messages.length} message(s))`)

        return true
      } catch (err) {
        logger.error(`[Attempt ${attempt}/${maxRetries}] Proactive execution failed:`, err instanceof Error ? err.message : String(err))
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      }
    }

    logger.error(`Proactive execution failed after ${maxRetries} attempts`)
    return false
  }

  private createChatEvents() {
    const logger = this.ctx.logger('activelink')

    return {
      'llm-new-token': async (token: string) => {},
      'llm-queue-waiting': async (queueLength: number) => {
        this.debug(logger, `Waiting in queue, length: ${queueLength}`)
      },
      'llm-calling-tool': async (toolName: string) => {
        this.debug(logger, `Calling tool: ${toolName}`)
      },
      'llm-call-tool-end': async (result: any) => {},
      'llm-used-token-count': async (count: number) => {
        this.debug(logger, `Used ${count} tokens`)
      }
    }
  }

  private debug(logger: any, message: string, ...args: any[]): void {
    if (this.config?.verboseLogging) {
      logger.debug(message, ...args)
    }
  }

  private removeActionTags(text: string): string {
    if (!text || typeof text !== 'string') return ''
    return text
      .replace(/\[action\][\s\S]*?\[\/action\]/gi, '')
      .replace(/<think>[\s\S]*?<\/think>/gi, '')
      .trim()
  }

  private extractMessages(text: string): string[] {
    if (!text || typeof text !== 'string') return []

    const outputMatch = text.match(/<output[^>]*>([\s\S]*?)<\/output>/i)
    const body = outputMatch ? outputMatch[1] : text

    const messages: string[] = []
    const messageRegex = /<message[^>]*>([\s\S]*?)<\/message>/gi
    let match: RegExpExecArray | null

    while ((match = messageRegex.exec(body)) !== null) {
      const content = match[1].trim()
      if (content) {
        messages.push(content)
      }
    }

    if (messages.length > 0) {
      return messages
    }

    const fallback = (outputMatch ? body : text).trim()
    return fallback ? [fallback] : []
  }

  private async sendMessages(session: Session, messages: string[]): Promise<void> {
    const total = messages.length
    for (const message of messages) {
      const content = message.trim()
      if (!content) continue
      await session.send(content)
      if (total > 1) {
        await new Promise(resolve => setTimeout(resolve, 200))
      }
    }
  }

  private async buildTemplateVars(
    target: MessageTarget,
    trigger: TriggerReason,
    history: string
  ): Promise<Record<string, string>> {
    const now = new Date()

    return {
      history: history || '(无)',
      time: now.toLocaleTimeString('zh-CN', { hour12: false }),
      date: this.formatDate(now),
      group_name: target.guildId || '',
      user_name: target.userId || '',
      idle_minutes: String(trigger.idleMinutes || 0)
    }
  }

  private renderTemplate(template: string, vars: Record<string, string>): string {
    return String(template || '').replace(/\{([a-z_]+)\}/gi, (_match, key: string) => {
      return vars[key] || ''
    }).trim()
  }

  private formatDate(date: Date): string {
    const weekdayMap = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    const w = weekdayMap[date.getDay()]
    return `${y}-${m}-${d} ${w}`
  }

  private getCachedSession(channelId: string, userId?: string): Session | null {
    if (channelId && this.sessionCache.has(channelId)) {
      return this.sessionCache.get(channelId) || null
    }

    if (userId && this.sessionCache.has(userId)) {
      return this.sessionCache.get(userId) || null
    }

    if (userId) {
      const privateChannelId = channelId?.startsWith('private:')
        ? channelId
        : `private:${userId}`
      if (this.sessionCache.has(privateChannelId)) {
        return this.sessionCache.get(privateChannelId) || null
      }
    }

    return null
  }
}
