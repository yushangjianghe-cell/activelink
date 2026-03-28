import { Context, Session, h } from 'koishi'
import { BaseAdapter } from './base'
import { AdapterType, AdapterInfo, MessageTarget } from '../types'

export class OneBotAdapter extends BaseAdapter {
  getAdapterType(): AdapterType {
    return 'onebot'
  }

  detectAdapter(session: Session): AdapterInfo | null {
    const platform = session.platform || ''
    if (platform.includes('onebot') || platform.includes('qq')) {
      return {
        type: 'onebot',
        platform,
        selfId: session.selfId
      }
    }
    return null
  }

  createSession(target: MessageTarget, content: string): Session | null {
    const bot = this.findBotForPlatform(target.adapter.platform) || this.findAnyBot()
    if (!bot) {
      this.logger.error('No bot available for OneBot adapter')
      return null
    }

    try {
      const isGroup = !target.isDirect
      const session = bot.session({
        type: 'message',
        timestamp: Date.now(),
        selfId: bot.selfId,
        user: { id: target.userId || 'system' },
        channel: { id: target.channelId, type: isGroup ? 0 : 1 },
        guild: target.guildId ? { id: target.guildId } : undefined,
        content: this.formatMessageForAdapter(content)
      })

      return session
    } catch (err) {
      this.logger.error('Failed to create OneBot session:', err)
      return null
    }
  }

  formatMessageForAdapter(content: string): string {
    return content
  }

  supportsFeature(feature: string): boolean {
    const supportedFeatures = [
      'at',
      'reply',
      'image',
      'voice',
      'video',
      'file',
      'poke',
      'forward'
    ]
    return supportedFeatures.includes(feature)
  }

  formatAt(userId: string): string {
    return h.at(userId).toString()
  }

  formatReply(messageId: string): string {
    return h.quote(messageId).toString()
  }

  formatImage(url: string): string {
    return h.image(url).toString()
  }
}
