import { Context } from 'koishi'
import { ActiveLinkTask, ActiveLinkTaskStatus, TaskCondition } from '../types'

export class TaskManager {
  constructor(private ctx: Context) {}

  async checkTaskCondition(task: ActiveLinkTask): Promise<boolean> {
    if (!task.condition) {
      return true
    }

    const { condition } = task

    switch (condition.type) {
      case 'user-idle':
        return this.checkUserIdleCondition(task, condition)
      case 'time-range':
        return this.checkTimeRangeCondition(condition)
      default:
        return true
    }
  }

  private async checkUserIdleCondition(
    task: ActiveLinkTask,
    condition: TaskCondition
  ): Promise<boolean> {
    if (!condition.duration) {
      return true
    }

    const recentMessages = await this.ctx.database.get('chathub_message', {
      userId: task.userId,
      createdAt: { $gt: new Date(Date.now() - condition.duration * 1000) }
    })

    return recentMessages.length === 0
  }

  private checkTimeRangeCondition(condition: TaskCondition): boolean {
    const now = new Date()

    if (condition.startTime && now < condition.startTime) {
      return false
    }

    if (condition.endTime && now > condition.endTime) {
      return false
    }

    return true
  }

  async cancelTask(taskId: number): Promise<boolean> {
    try {
      const tasks = await this.ctx.database.get('activelink_tasks', { id: taskId })

      if (tasks.length === 0) {
        return false
      }

      if (tasks[0].status !== ActiveLinkTaskStatus.PENDING) {
        return false
      }

      await this.ctx.database.set('activelink_tasks', taskId, {
        status: ActiveLinkTaskStatus.CANCELLED
      })

      this.ctx.emit('activelink/task-cancelled', taskId)
      return true
    } catch (err) {
      this.ctx.logger('activelink').error('Failed to cancel task:', err)
      return false
    }
  }

  async getPendingTasks(): Promise<ActiveLinkTask[]> {
    return this.ctx.database.get('activelink_tasks', {
      status: ActiveLinkTaskStatus.PENDING
    })
  }

  async getTasksByUser(userId: string, channelId?: string): Promise<ActiveLinkTask[]> {
    const query: any = { userId }
    if (channelId) {
      query.channelId = channelId
    }
    return this.ctx.database.get('activelink_tasks', query)
  }
}
