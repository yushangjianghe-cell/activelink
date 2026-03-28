import { Context } from 'koishi'
import { ActiveLinkTask, ActiveLinkTaskStatus } from '../types'
import { ActiveLinkService } from './index'

export class ActiveLinkScheduler {
  private tasks: Map<number, { timer: any; cancelled: boolean }> = new Map()

  constructor(
    private ctx: Context,
    private service: ActiveLinkService
  ) {
    this.listenToCancelEvents()
  }

  private listenToCancelEvents() {
    this.ctx.on('activelink/task-cancelled', (taskId: number) => {
      const taskInfo = this.tasks.get(taskId)
      if (taskInfo) {
        taskInfo.cancelled = true
        clearTimeout(taskInfo.timer)
        this.tasks.delete(taskId)
        this.ctx.logger('activelink').info(`Task [${taskId}] cancelled and timer cleared`)
      }
    })
  }

  async start() {
    await this.loadPendingTasks()

    this.ctx.on('activelink/task-created', (task: ActiveLinkTask) => {
      this.scheduleTask(task)
    })
  }

  stop() {
    for (const taskInfo of this.tasks.values()) {
      clearTimeout(taskInfo.timer)
    }
    this.tasks.clear()
  }

  private async loadPendingTasks() {
    const logger = this.ctx.logger('activelink')

    try {
      const tasks = await this.ctx.database.get('activelink_tasks', {
        status: ActiveLinkTaskStatus.PENDING
      })

      if (tasks.length === 0) {
        return
      }

      const now = new Date()
      let scheduledCount = 0
      let executedCount = 0

      for (const task of tasks) {
        const triggerTime = new Date(task.triggerTime)
        if (triggerTime <= now) {
          await this.executeTask({ ...task, triggerTime })
          executedCount++
        } else {
          this.scheduleTask({ ...task, triggerTime })
          scheduledCount++
        }
      }

      if (scheduledCount > 0 || executedCount > 0) {
        logger.info(`Loaded ${tasks.length} pending tasks (${scheduledCount} scheduled, ${executedCount} executed immediately)`)
      }
    } catch (err) {
      logger.error('Failed to load tasks:', err)
    }
  }

  scheduleTask(task: ActiveLinkTask) {
    const logger = this.ctx.logger('activelink')
    const triggerTime = task.triggerTime instanceof Date ? task.triggerTime : new Date(task.triggerTime)
    let delay = triggerTime.getTime() - Date.now()

    if (delay < 0) {
      this.executeTask(task)
      return
    }

    const MAX_TIMEOUT = 2147483647
    if (delay > MAX_TIMEOUT) {
      logger.warn(`Task [${task.id}] delay exceeds max timeout, capping to ~24.8 days`)
      delay = MAX_TIMEOUT
    }

    const taskInfo = { timer: null as any, cancelled: false }

    const timer = setTimeout(async () => {
      if (taskInfo.cancelled) {
        return
      }

      await this.executeTask(task)
      this.tasks.delete(task.id)
    }, delay)

    taskInfo.timer = timer
    this.tasks.set(task.id, taskInfo)

    logger.info(`Scheduled [${task.id}]: "${task.content.slice(0, 30)}..." in ${Math.floor(delay / 1000)}s`)
  }

  private async executeTask(task: ActiveLinkTask) {
    const logger = this.ctx.logger('activelink')

    try {
      const taskInfo = this.tasks.get(task.id)
      if (taskInfo?.cancelled) {
        return
      }

      logger.info(`Executing [${task.id}]: ${task.content.slice(0, 50)}`)

      const canExecute = await this.service.taskManager.checkTaskCondition(task)
      if (!canExecute) {
        logger.debug(`Task [${task.id}] skipped: condition not met`)
        await this.ctx.database.set('activelink_tasks', task.id, {
          status: ActiveLinkTaskStatus.CANCELLED,
          metadata: { reason: 'Condition not met' }
        })
        return
      }

      const success = await this.service.executeTask(task)

      if (success) {
        await this.ctx.database.set('activelink_tasks', task.id, {
          status: ActiveLinkTaskStatus.EXECUTED
        })
        this.ctx.emit('activelink/task-executed', task)
        logger.success(`Task [${task.id}] completed`)
      } else {
        await this.ctx.database.set('activelink_tasks', task.id, {
          status: ActiveLinkTaskStatus.FAILED,
          metadata: { reason: 'Execution failed' }
        })
        logger.error(`Task [${task.id}] failed`)
      }
    } catch (err) {
      logger.error(`Task [${task.id}] failed:`, err)

      await this.ctx.database.set('activelink_tasks', task.id, {
        status: ActiveLinkTaskStatus.FAILED,
        metadata: { error: err instanceof Error ? err.message : String(err) }
      })
    }
  }
}
