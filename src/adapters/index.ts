import { Context, Session } from 'koishi'
import { BaseAdapter, UniversalAdapter } from './base'
import { OneBotAdapter } from './onebot'
import { OpenClawWeixinAdapter } from './openclaw-weixin'
import { AdapterType, AdapterInfo, MessageTarget } from '../types'

export class AdapterManager {
  private adapters: BaseAdapter[] = []

  constructor(private ctx: Context) {
    this.adapters.push(new OneBotAdapter(ctx))
    this.adapters.push(new OpenClawWeixinAdapter(ctx))
    this.adapters.push(new UniversalAdapter(ctx))
  }

  detectAdapter(session: Session): AdapterInfo {
    for (const adapter of this.adapters) {
      const info = adapter.detectAdapter(session)
      if (info) {
        return info
      }
    }

    return {
      type: 'other',
      platform: session.platform || 'unknown',
      selfId: session.selfId
    }
  }

  getAdapter(type: AdapterType): BaseAdapter {
    for (const adapter of this.adapters) {
      if (adapter.getAdapterType() === type) {
        return adapter
      }
    }
    return this.adapters[this.adapters.length - 1]
  }

  createSession(target: MessageTarget, content: string): Session | null {
    const adapter = this.getAdapter(target.adapter.type)
    return adapter.createSession(target, content)
  }
}

export * from './base'
export * from './onebot'
export * from './openclaw-weixin'
