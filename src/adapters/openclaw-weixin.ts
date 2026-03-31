import { Context, Session, h } from 'koishi'
import { BaseAdapter } from './base'
import { AdapterType, AdapterInfo, MessageTarget } from '../types'

export class OpenClawWeixinAdapter extends BaseAdapter {
  getAdapterType(): AdapterType {
    return 'openclaw-weixin'
  }

  detectAdapter(session: Session): AdapterInfo | null {
    const platform = session.platform || ''
    if (platform.includes('openclaw') || platform.includes('weixin')) {
      return {
        type: 'openclaw-weixin',
        platform,
        selfId: session.selfId
      }
    }
    return null
  }

  createSession(target: MessageTarget, content: string): Session | null {
    const bot = this.findBotForPlatform(target.adapter.platform) || this.findAnyBot()
    if (!bot) {
      this.logger.error('No bot available for OpenClaw Weixin adapter')
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
      this.logger.error('Failed to create OpenClaw Weixin session:', err)
      return null
    }
  }

  async sendMessage(target: MessageTarget, content: string, options?: any): Promise<string[]> {
    const bot = this.findBotForPlatform(target.adapter.platform) || this.findAnyBot()
    if (!bot) {
      this.logger.error('No bot available for OpenClaw Weixin adapter')
      return []
    }

    try {
      const isDirect = target.isDirect || target.channelId?.startsWith('private:')

      if (isDirect) {
        const directChannelId = target.channelId?.startsWith('private:')
          ? target.channelId
          : target.userId
            ? `private:${target.userId}`
            : target.channelId

        if (!directChannelId) {
          this.logger.error('Invalid target: no channelId or userId provided')
          return []
        }

        await bot.sendMessage(directChannelId, content)
        return [directChannelId]
      }

      if (!target.channelId) {
        this.logger.error('Invalid target: no channelId provided')
        return []
      }

      await bot.sendMessage(target.channelId, content)
      return [target.channelId]
    } catch (err) {
      this.logger.error('Failed to send message via OpenClaw Weixin adapter:', err)
      return []
    }
  }

  formatMessageForAdapter(content: string): string {
    return content
  }

  supportsFeature(feature: string): boolean {
    const supportedFeatures = [
      'text',
      'image',
      'file'
    ]
    return supportedFeatures.includes(feature)
  }

  formatImage(url: string): string {
    return h.image(url).toString()
  }
}
