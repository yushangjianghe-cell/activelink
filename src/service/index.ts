import { Context, Service } from 'koishi'
import { ActiveLinkScheduler } from './scheduler'
import { TaskManager } from './task-manager'
import { ChatExecutor } from './chat-executor'
import { createActiveLinkTask } from '../database'
import { ActiveLinkTaskType, CancelEvent, TaskCondition, ActiveLinkTask } from '../types'

declare module 'koishi' {
  interface Context {
    activelink?: ActiveLinkService
  }
}

export class ActiveLinkService extends Service {
  public scheduler: ActiveLinkScheduler
  public taskManager: TaskManager
  public chatExecutor: ChatExecutor

  constructor(ctx: Context, public config: any) {
    super(ctx, 'activelink', true)

    this.scheduler = new ActiveLinkScheduler(ctx, this)
    this.taskManager = new TaskManager(ctx)
    this.chatExecutor = new ChatExecutor(ctx, config)
  }

  async start() {
    await this.scheduler.start()
    this.ctx.logger('activelink').info('ActiveLink service started')
  }

  async stop() {
    this.scheduler.stop()
    this.ctx.logger('activelink').info('ActiveLink service stopped')
  }

  async addTask(
    userId: string,
    channelId: string,
    content: string,
    triggerTime: Date | number,
    options?: {
      type?: ActiveLinkTaskType
      tags?: string[]
      cancelOn?: CancelEvent[]
      condition?: TaskCondition
      guildId?: string
    }
  ) {
    const task = await createActiveLinkTask(this.ctx, {
      userId,
      channelId,
      guildId: options?.guildId,
      triggerTime,
      content,
      type: options?.type || ActiveLinkTaskType.REMINDER,
      tags: options?.tags || [],
      cancelOn: options?.cancelOn || [],
      condition: options?.condition
    })

    this.ctx.emit('activelink/task-created', task)
    return task
  }

  async cancelTask(taskId: number): Promise<boolean> {
    return this.taskManager.cancelTask(taskId)
  }

  async executeTask(task: ActiveLinkTask): Promise<boolean> {
    return this.chatExecutor.executeTask(task)
  }

  async sendProactiveMessage(
    userId: string,
    channelId: string,
    content: string,
    options?: {
      guildId?: string
      isDirect?: boolean
    }
  ): Promise<boolean> {
    const target = {
      userId,
      channelId,
      guildId: options?.guildId,
      isDirect: options?.isDirect || false,
      adapter: {
        type: 'other' as const,
        platform: 'unknown',
        selfId: ''
      }
    }

    const trigger = {
      type: 'proactive' as const,
      reason: '主动消息'
    }

    return this.chatExecutor.executeProactive(
      target,
      trigger,
      this.config.triggerTemplate,
      content
    )
  }
}

export * from './scheduler'
export * from './task-manager'
export * from './chat-executor'
