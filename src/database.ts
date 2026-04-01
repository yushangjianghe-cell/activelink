import { Context } from 'koishi'
import { ActiveLinkTask, ActiveLinkTaskType, ActiveLinkTaskStatus, CancelEvent, TaskCondition } from './types'

export function extendDatabase(ctx: Context) {
  ctx.database.extend('activelink_tasks', {
    id: 'unsigned',
    userId: 'string',
    channelId: 'string',
    guildId: 'string',
    triggerTime: 'timestamp',
    type: 'string',
    content: 'text',
    status: 'string',
    cancelOn: 'list',
    condition: 'json',
    tags: 'list',
    metadata: 'json',
    roomId: 'unsigned',
    createdAt: 'timestamp'
  }, {
    autoInc: true
  })
}

export async function createActiveLinkTask(
  ctx: Context,
  data: {
    userId: string
    channelId: string
    guildId?: string
    triggerTime: Date | number
    content: string
    type?: ActiveLinkTaskType
    tags?: string[]
    cancelOn?: CancelEvent[]
    condition?: TaskCondition
    metadata?: Record<string, any>
    roomId?: number
  }
): Promise<ActiveLinkTask> {
  const now = new Date()
  const triggerTime = data.triggerTime instanceof Date ? data.triggerTime : new Date(data.triggerTime)

  const task = await ctx.database.create('activelink_tasks', {
    userId: data.userId,
    channelId: data.channelId,
    guildId: data.guildId,
    triggerTime,
    type: data.type || ActiveLinkTaskType.REMINDER,
    content: data.content,
    status: ActiveLinkTaskStatus.PENDING,
    cancelOn: data.cancelOn || [],
    condition: data.condition,
    tags: data.tags || [],
    metadata: data.metadata || {},
    roomId: data.roomId,
    createdAt: now
  })

  return task as ActiveLinkTask
}
