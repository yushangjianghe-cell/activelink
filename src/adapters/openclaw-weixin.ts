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
      const session = bot.session({
        type: 'message',
        timestamp: Date.now(),
        selfId: bot.selfId,
        user: { id: target.userId || 'system' },
        channel: { id: target.channelId, type: 1 },
        content: this.formatMessageForAdapter(content)
      })

      return session
    } catch (err) {
      this.logger.error('Failed to create OpenClaw Weixin session:', err)
      return null
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
