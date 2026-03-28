import { Context } from 'koishi'
import { CronJob } from 'cron'
import { ActiveLinkService } from '../service'
import { isInScope, ScopeConfig } from '../utils/scope'
import { getAllRooms } from '../utils/room'

export interface ScheduledTaskConfig {
  name: string
  time: string
  prompt: string
}

export interface ScheduledConfig {
  enabled: boolean
  tasks: ScheduledTaskConfig[]
}

export class ScheduledTrigger {
  private jobs: CronJob[] = []

  constructor(
    private ctx: Context,
    private config: ScheduledConfig,
    private service: ActiveLinkService,
    private scope: ScopeConfig
  ) {}

  start() {
    if (!this.config.enabled || !this.config.tasks || this.config.tasks.length === 0) {
      return
    }

    for (const task of this.config.tasks) {
      this.scheduleTask(task)
    }

    this.ctx.logger('activelink').info(`Scheduled ${this.config.tasks.length} daily task(s)`)
  }

  stop() {
    for (const job of this.jobs) {
      job.stop()
    }
    this.jobs = []
  }

  private scheduleTask(task: ScheduledTaskConfig) {
    try {
      const [hour, minute] = task.time.split(':').map(s => s.trim())
      const cronExp = `${minute} ${hour} * * *`

      const job = new CronJob(
        cronExp,
        async () => {
          await this.triggerTask(task)
        },
        null,
        false,
        'Asia/Shanghai'
      )

      job.start()
      this.jobs.push(job)
    } catch (err) {
      this.ctx.logger('activelink').error(`Failed to schedule ${task.name}:`, err)
    }
  }

  private async triggerTask(task: ScheduledTaskConfig) {
    this.ctx.logger('activelink').info(`Running scheduled task: ${task.name}`)

    const rooms = await getAllRooms(this.ctx)

    if (rooms.length === 0) {
      return
    }

    let successCount = 0

    for (const roomInfo of rooms) {
      try {
        if (!isInScope(roomInfo.channelId, this.scope)) {
          continue
        }

        const success = await this.service.chatExecutor.executeWithRoom(
          roomInfo.userId,
          roomInfo.channelId,
          task.prompt,
          roomInfo.room
        )

        if (success) {
          successCount++
        }
      } catch (err) {
        // 静默处理单个房间的错误
      }

      await new Promise(resolve => setTimeout(resolve, 100))
    }

    this.ctx.logger('activelink').info(`Scheduled task "${task.name}" completed: ${successCount}/${rooms.length} rooms`)
  }
}
