import { Context, Session, h } from 'koishi'
import { AdapterType, AdapterInfo, MessageTarget } from '../types'

export abstract class BaseAdapter {
  protected logger: ReturnType<Context['logger']>

  constructor(protected ctx: Context) {
    this.logger = ctx.logger('activelink')
  }

  abstract getAdapterType(): AdapterType

  abstract detectAdapter(session: Session): AdapterInfo | null

  abstract createSession(target: MessageTarget, content: string): Session | null

  abstract formatMessageForAdapter(content: string): string

  abstract supportsFeature(feature: string): boolean

  protected findBotForPlatform(platform: string): any {
    for (const bot of this.ctx.bots) {
      if (bot.platform === platform) {
        return bot
      }
    }
    return null
  }

  protected findAnyBot(): any {
    for (const bot of this.ctx.bots) {
      return bot
    }
    return null
  }
}

export class UniversalAdapter extends BaseAdapter {
  getAdapterType(): AdapterType {
    return 'other'
  }

  detectAdapter(session: Session): AdapterInfo | null {
    const platform = session.platform || 'unknown'
    return {
      type: 'other',
      platform,
      selfId: session.selfId
    }
  }

  createSession(target: MessageTarget, content: string): Session | null {
    const bot = this.findBotForPlatform(target.adapter.platform) || this.findAnyBot()
    if (!bot) {
      this.logger.error('No bot available for universal adapter')
      return null
    }

    try {
      const session = bot.session({
        type: 'message',
        timestamp: Date.now(),
        selfId: bot.selfId,
        user: { id: target.userId || 'system' },
        channel: { id: target.channelId, type: target.isDirect ? 1 : 0 },
        guild: target.guildId ? { id: target.guildId } : undefined,
        content: this.formatMessageForAdapter(content)
      })

      return session
    } catch (err) {
      this.logger.error('Failed to create session:', err)
      return null
    }
  }

  formatMessageForAdapter(content: string): string {
    return content
  }

  supportsFeature(feature: string): boolean {
    return false
  }
}
