import { Context, Session, Next } from 'koishi'
import { ActiveLinkService } from '../service'
import { AdapterManager } from '../adapters'
import { ActivityScorer } from '../utils/activity'
import { GroupTriggerConfig, PrivateTriggerConfig, TriggerProfileConfig, ConversationState, TriggerReason, ChatMessage, CachedImageRef } from '../types'
import { createHash } from 'crypto'
import { promises as fs } from 'fs'
import path from 'path'

export class ActivityIdleTrigger {
  private sessions: Record<string, Session> = {}
  private conversationStates: Record<string, ConversationState> = {}
  private messageTimestamps: Record<string, number[]> = {}
  private chatMessages: Record<string, ChatMessage[]> = {}
  private activityScorer: ActivityScorer
  private adapterManager: AdapterManager
  private stateFilePath: string
  private imageCacheDir: string
  private dirty = false
  private isSaving = false
  private pendingSave = false

  private readonly MAX_MESSAGES = 100
  private readonly MAX_TIMESTAMPS = 200

  constructor(
    private ctx: Context,
    private config: any,
    private service: ActiveLinkService
  ) {
    this.activityScorer = new ActivityScorer()
    this.adapterManager = new AdapterManager(ctx)
    this.stateFilePath = path.resolve(ctx.baseDir || process.cwd(), 'data', 'activelink-state.json')
    this.imageCacheDir = path.resolve(ctx.baseDir || process.cwd(), 'data', 'activelink-images')
  }

  async start() {
    await this.loadState()
    this.ctx.middleware((session, next) => this.handleMessage(session, next))

    this.ctx.setInterval(() => {
      this.saveState()
    }, 10000)

    this.ctx.logger('activelink').info('Activity/Idle trigger started')
  }

  async stop() {
    await this.saveState(true)
  }

  private async handleMessage(session: Session, next: Next): Promise<void> {
    if (this.ctx.bots[session.uid]) { await next(); return }

    const profile = this.getProfileBySession(session)
    const conversationId = this.getConversationId(session)
    const now = session.timestamp || Date.now()

    if (!profile) {
      await next(); return
    }

    this.sessions[conversationId] = session
    this.recordTimestamp(conversationId, now)

    if (!session.isDirect) {
      await this.addChatMessage(conversationId, session)
    }

    const state = this.getOrCreateState(conversationId, profile)
    state.lastMessageTime = now
    state.messageCount = (state.messageCount ?? 0) + 1
    this.markDirty()

    const triggerReason = this.evaluateTriggers(conversationId, state, now, profile)

    if (triggerReason) {
      await this.triggerResponse(session, triggerReason, profile)
      return
    }

    await next()
  }

  private evaluateTriggers(
    conversationId: string,
    state: ConversationState,
    now: number,
    profile: TriggerProfileConfig
  ): TriggerReason | null {
    if (state.lastTriggerTime && now - state.lastTriggerTime < profile.cooldownSeconds * 1000) {
      return null
    }
    if (state.responseLocked) {
      return null
    }

    const isGroupProfile = this.isGroupProfile(profile)

    if (isGroupProfile && profile.enableActivityTrigger) {
      const timestamps = this.messageTimestamps[conversationId] || []
      const score = this.activityScorer.calculateScore(timestamps, state)
      state.lastActivityScore = score

      if (this.activityScorer.shouldTrigger(score, state.currentThreshold)) {
        return {
          type: 'activity',
          reason: '活跃度触发'
        }
      }

      const messageInterval = profile.activityMessageInterval ?? 20
      if (messageInterval > 0 && state.messageCount >= messageInterval) {
        return {
          type: 'activity',
          reason: '消息计数触发'
        }
      }
    }

    return null
  }

  private async triggerResponse(
    session: Session,
    trigger: TriggerReason,
    profile: TriggerProfileConfig
  ): Promise<void> {
    const conversationId = this.getConversationId(session)
    const state = this.getOrCreateState(conversationId, profile)

    if (state.responseLocked) return
    state.responseLocked = true

    try {
      const template = this.getPromptTemplate(trigger, profile)
      const useHist = this.shouldUseHistory(template)
      const msgs = useHist ? this.getRecentHistoryMessages(conversationId, profile) : []

      const { txt: histTxt } = await this.formatHistory(msgs, profile)
      const bodyTxt = await this.buildRequestText(session, trigger, histTxt, template)

      const target = {
        userId: session.userId || '',
        channelId: session.channelId || '',
        guildId: session.guildId || '',
        isDirect: session.isDirect || false,
        adapter: this.adapterManager.detectAdapter(session)
      }

      const success = await this.service.chatExecutor.executeProactive(
        target,
        trigger,
        bodyTxt
      )

      if (success) {
        this.chatMessages[conversationId] = []
        this.markDirty()
        this.updateStateAfterResponse(state, profile)
      }
    } catch (error) {
      this.ctx.logger('activelink').error(`Trigger response failed: ${error}`)
    } finally {
      state.responseLocked = false
    }
  }

  private getProfileBySession(session: Session): TriggerProfileConfig | null {
    const groupConfigs: GroupTriggerConfig[] = this.config.groupConfigs || []
    const privateConfigs: PrivateTriggerConfig[] = this.config.privateConfigs || []

    if (session.isDirect) {
      const exactConfig = privateConfigs.find(
        item => item.userId === session.userId && item.userId !== 'default'
      )
      if (exactConfig) return exactConfig

      if (this.config.applyDefaultPrivateConfigs?.includes(session.userId)) {
        const defaultConfig = privateConfigs.find(item => item.userId === 'default')
        if (defaultConfig) return defaultConfig
      }
      return null
    }

    const exactConfig = groupConfigs.find(
      item => item.guildId === session.guildId && item.guildId !== 'default'
    )
    if (exactConfig) return exactConfig

    if (this.config.applyDefaultGroupConfigs?.includes(session.guildId)) {
      const defaultConfig = groupConfigs.find(item => item.guildId === 'default')
      if (defaultConfig) return defaultConfig
    }

    return null
  }

  private getConversationId(session: Session): string {
    return session.isDirect
      ? `private:${session.userId}`
      : `group:${session.guildId}`
  }

  private getOrCreateState(conversationId: string, profile: TriggerProfileConfig): ConversationState {
    if (!this.conversationStates[conversationId]) {
      const isGroupProfile = this.isGroupProfile(profile)
      this.conversationStates[conversationId] = {
        lastMessageTime: 0,
        currentThreshold: isGroupProfile && profile.enableActivityTrigger
          ? (profile.activityLowerLimit ?? 0.85)
          : 1,
        lastActivityScore: 0,
        lastTriggerTime: 0,
        responseLocked: false,
        messageCount: 0
      }
      this.markDirty()
    }
    return this.conversationStates[conversationId]
  }

  private recordTimestamp(conversationId: string, timestamp: number): void {
    if (!this.messageTimestamps[conversationId]) {
      this.messageTimestamps[conversationId] = []
    }
    this.messageTimestamps[conversationId].push(timestamp)
    if (this.messageTimestamps[conversationId].length > this.MAX_TIMESTAMPS) {
      this.messageTimestamps[conversationId] = this.messageTimestamps[conversationId].slice(-this.MAX_TIMESTAMPS)
    }
    this.markDirty()
  }

  private async addChatMessage(conversationId: string, session: Session): Promise<void> {
    this.ensureMessageBucket(conversationId)

    const msg: ChatMessage = {
      id: session.author?.id || session.userId || '',
      name: session.author?.name || session.author?.nick || session.username || 'Unknown',
      content: this.normalizeMessageContent(session.content || ''),
      timestamp: session.timestamp || Date.now(),
      messageId: session.messageId
    }

    const profile = this.getProfileBySession(session)
    const cap = Math.max(1, profile?.historyMessageLimit || this.MAX_MESSAGES)
    this.appendChatMessage(conversationId, msg, cap)
  }

  private ensureMessageBucket(conversationId: string): void {
    if (!this.chatMessages[conversationId]) {
      this.chatMessages[conversationId] = []
    }
  }

  private appendChatMessage(conversationId: string, message: ChatMessage, limit: number): void {
    this.chatMessages[conversationId].push(message)
    if (this.chatMessages[conversationId].length > limit) {
      this.chatMessages[conversationId] = this.chatMessages[conversationId].slice(-limit)
    }
    this.markDirty()
  }

  private normalizeMessageContent(raw: string): string {
    return String(raw || '')
      .replace(/\[CQ:image,[^\]]*]/gi, '')
      .replace(/<img\b[^>]*\/?>/gi, '')
      .replace(/!\[[^\]]*]\((https?:\/\/[^)\s]+)\)/gi, '')
      .replace(/https?:\/\/\S+\.(?:png|jpe?g|gif|webp|bmp|svg)(?:\?\S*)?/gi, '')
      .replace(/\s+/g, ' ')
      .trim()
  }

  private getRecentHistoryMessages(conversationId: string, profile: TriggerProfileConfig): ChatMessage[] {
    const messages = this.chatMessages[conversationId]
    if (!messages || messages.length === 0) return []
    return messages.slice(-profile.historyMessageLimit)
  }

  private async formatHistory(msgs: ChatMessage[], profile?: TriggerProfileConfig): Promise<{ txt: string; imgs: string[] }> {
    if (!msgs.length) return { txt: '', imgs: [] }

    const lines = msgs.map((m) => {
      return `[${this.formatTimestamp(m.timestamp)}] ${m.name}(${m.id}): ${(m.content || '').trim()}`
    })

    return { txt: lines.join('\n'), imgs: [] }
  }

  private formatTimestamp(timestamp: number): string {
    return new Date(timestamp).toLocaleString('zh-CN', {
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  private async buildRequestText(
    session: Session,
    trigger: TriggerReason,
    history: string,
    template?: string
  ): Promise<string> {
    const finalTemplate = template || '{history}'
    const vars = await this.buildTemplateVars(session, trigger, history)
    return this.renderTemplate(finalTemplate, vars)
  }

  private shouldUseHistory(template: string): boolean {
    return String(template || '').includes('{history}')
  }

  private getPromptTemplate(trigger: TriggerReason, profile: TriggerProfileConfig): string {
    if (trigger.type === 'activity' && this.isGroupProfile(profile) && profile.enableActivityTrigger) {
      return profile.activityPromptTemplate || '{history}'
    }
    if (trigger.type === 'idle' && profile.enableIdleTrigger) {
      return profile.idlePromptTemplate || '{history}'
    }
    return '{history}'
  }

  private async buildTemplateVars(
    session: Session,
    trigger: TriggerReason,
    history: string
  ): Promise<Record<string, string>> {
    const now = new Date()

    return {
      history: history || '(无)',
      time: now.toLocaleTimeString('zh-CN', { hour12: false }),
      date: this.formatDate(now),
      group_name: session.guildId || '',
      user_name: session.author?.name || session.username || '',
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

  private updateStateAfterResponse(state: ConversationState, profile: TriggerProfileConfig): void {
    const now = Date.now()
    state.lastTriggerTime = now
    state.messageCount = 0
    if (this.isGroupProfile(profile) && profile.enableActivityTrigger) {
      this.activityScorer.adjustThreshold(state, true)
    }
    this.markDirty()
  }

  private isGroupProfile(profile: TriggerProfileConfig | null): profile is GroupTriggerConfig {
    return !!profile && 'enableActivityTrigger' in profile
  }

  private markDirty(): void {
    this.dirty = true
    if (this.isSaving) {
      this.pendingSave = true
    }
  }

  private async loadState(): Promise<void> {
    try {
      const raw = await fs.readFile(this.stateFilePath, 'utf8')
      const parsed = JSON.parse(raw)
      this.conversationStates = parsed?.conversationStates || {}
      this.messageTimestamps = parsed?.messageTimestamps || {}
      this.chatMessages = parsed?.chatMessages || {}
      this.ctx.logger('activelink').info(`State loaded from ${this.stateFilePath}`)
    } catch (error) {
      this.ctx.logger('activelink').debug(`No persisted state found: ${error}`)
    }
  }

  private async saveState(force = false): Promise<void> {
    if (!force && !this.dirty) return
    if (this.isSaving) {
      this.pendingSave = true
      return
    }

    this.isSaving = true
    try {
      do {
        this.pendingSave = false
        this.dirty = false
        const payload = {
          conversationStates: this.conversationStates,
          messageTimestamps: this.messageTimestamps,
          chatMessages: this.chatMessages
        }
        await fs.mkdir(path.dirname(this.stateFilePath), { recursive: true })
        await fs.writeFile(this.stateFilePath, JSON.stringify(payload), 'utf8')
      } while (this.pendingSave || this.dirty)
    } catch (error) {
      this.ctx.logger('activelink').error(`Failed to save state: ${error}`)
      this.dirty = true
    } finally {
      this.isSaving = false
    }
  }
}
