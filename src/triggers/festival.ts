import { Context } from 'koishi'
import { CronJob } from 'cron'
import { ActiveLinkService } from '../service'
import { isInScope, ScopeConfig } from '../utils/scope'
import { getAllRooms } from '../utils/room'

export interface FestivalConfig {
  enabled: boolean
  promptTemplate: string
  defaultTime: string
  custom: CustomFestival[]
}

export interface CustomFestival {
  name: string
  date: string
  time: string
  description: string
}

interface Festival {
  name: string
  date: string
  description: string
}

const BUILTIN_FESTIVALS: Festival[] = [
  { name: '元旦', date: '01-01', description: '新年的第一天' },
  { name: '春节', date: '01-29', description: '农历新年' },
  { name: '元宵节', date: '02-12', description: '农历正月十五' },
  { name: '情人节', date: '02-14', description: '西方情人节' },
  { name: '妇女节', date: '03-08', description: '国际妇女节' },
  { name: '植树节', date: '03-12', description: '中国植树节' },
  { name: '愚人节', date: '04-01', description: '西方愚人节' },
  { name: '清明节', date: '04-04', description: '中国传统节日' },
  { name: '劳动节', date: '05-01', description: '国际劳动节' },
  { name: '青年节', date: '05-04', description: '中国青年节' },
  { name: '母亲节', date: '05-11', description: '母亲节' },
  { name: '儿童节', date: '06-01', description: '国际儿童节' },
  { name: '父亲节', date: '06-15', description: '父亲节' },
  { name: '端午节', date: '05-31', description: '农历五月初五' },
  { name: '建党节', date: '07-01', description: '中国共产党成立纪念日' },
  { name: '七夕节', date: '08-29', description: '中国传统情人节' },
  { name: '中元节', date: '08-15', description: '农历七月十五' },
  { name: '教师节', date: '09-10', description: '中国教师节' },
  { name: '中秋节', date: '10-06', description: '农历八月十五' },
  { name: '国庆节', date: '10-01', description: '中华人民共和国国庆节' },
  { name: '重阳节', date: '10-29', description: '农历九月初九' },
  { name: '万圣节', date: '10-31', description: '西方万圣节' },
  { name: '感恩节', date: '11-27', description: '美国感恩节' },
  { name: '圣诞节', date: '12-25', description: '西方圣诞节' },
  { name: '冬至', date: '12-21', description: '二十四节气之一' },
  { name: '腊八节', date: '01-07', description: '农历腊月初八' },
  { name: '小年', date: '01-22', description: '农历腊月二十三或二十四' },
  { name: '除夕', date: '01-28', description: '农历腊月三十' }
]

export class FestivalTrigger {
  private jobs: CronJob[] = []

  constructor(
    private ctx: Context,
    private config: FestivalConfig,
    private service: ActiveLinkService,
    private scope: ScopeConfig
  ) {}

  start() {
    if (!this.config.enabled) {
      return
    }

    this.scheduleBuiltinFestivals()
    this.scheduleCustomFestivals()

    this.ctx.logger('activelink').info('Festival trigger started')
  }

  stop() {
    for (const job of this.jobs) {
      job.stop()
    }
    this.jobs = []
  }

  private scheduleBuiltinFestivals() {
    const now = new Date()
    const currentYear = now.getFullYear()

    for (const festival of BUILTIN_FESTIVALS) {
      const [month, day] = festival.date.split('-').map(Number)
      const festivalDate = new Date(currentYear, month - 1, day)

      if (festivalDate < now) {
        festivalDate.setFullYear(currentYear + 1)
      }

      this.scheduleFestival(festival, this.config.defaultTime)
    }
  }

  private scheduleCustomFestivals() {
    if (!this.config.custom || this.config.custom.length === 0) {
      return
    }

    for (const festival of this.config.custom) {
      const customFestival: Festival = {
        name: festival.name,
        date: festival.date,
        description: festival.description
      }
      this.scheduleFestival(customFestival, festival.time)
    }
  }

  private scheduleFestival(festival: Festival, time: string) {
    try {
      const [month, day] = festival.date.split('-').map(Number)
      const [hour, minute] = time.split(':').map(s => s.trim())

      const cronExp = `${minute} ${hour} ${day} ${month} *`

      const job = new CronJob(
        cronExp,
        async () => {
          await this.triggerFestival(festival)
        },
        null,
        false,
        'Asia/Shanghai'
      )

      job.start()
      this.jobs.push(job)
    } catch (err) {
      this.ctx.logger('activelink').error(`Failed to schedule festival ${festival.name}:`, err)
    }
  }

  private async triggerFestival(festival: Festival) {
    this.ctx.logger('activelink').info(`Triggering festival: ${festival.name}`)

    const prompt = this.config.promptTemplate
      .replace(/\{festivalName\}/g, festival.name)
      .replace(/\{festivalDesc\}/g, festival.description)

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
          prompt,
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

    this.ctx.logger('activelink').info(`Festival "${festival.name}" completed: ${successCount}/${rooms.length} rooms`)
  }
}
