import { Context, Session } from 'koishi'

export function extractRealUserId(userId: string, channelId: string): string {
  if (channelId?.startsWith('private:')) {
    return channelId.slice(8)
  }
  return userId
}

export function buildTriggerMessage(template: string, content: string): string {
  return template.replace(/\{content\}/g, content)
}

export function getGuildIdFromChannelId(channelId: string): string {
  if (channelId.startsWith('private:')) {
    return '0'
  } else if (channelId.includes(':')) {
    return channelId.split(':')[0]
  }
  return channelId
}

export function isGroupChannel(channelId: string): boolean {
  return !channelId.startsWith('private:')
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString('zh-CN', { hour12: false })
}

export function formatDate(date: Date): string {
  const weekdayMap = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const w = weekdayMap[date.getDay()]
  return `${y}-${m}-${d} ${w}`
}

export function formatRelativeTime(targetDate: Date): string {
  const now = new Date()
  const diff = targetDate.getTime() - now.getTime()

  if (diff < 0) return '已过期'
  if (diff < 60000) return '即将触发'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟后`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时后`

  return `${targetDate.getMonth() + 1}/${targetDate.getDate()} ${targetDate.getHours()}:${targetDate.getMinutes().toString().padStart(2, '0')}`
}

export function parseTimeString(timeStr: string): { hour: number; minute: number } | null {
  const parts = timeStr.split(':').map(s => s.trim())
  if (parts.length !== 2) return null

  const hour = parseInt(parts[0], 10)
  const minute = parseInt(parts[1], 10)

  if (isNaN(hour) || isNaN(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return null
  }

  return { hour, minute }
}

export function isInSleepTime(sleepStart: string, sleepEnd: string): boolean {
  const now = new Date()
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`

  if (sleepStart > sleepEnd) {
    return currentTime >= sleepStart || currentTime < sleepEnd
  } else {
    return currentTime >= sleepStart && currentTime < sleepEnd
  }
}

export function initUserTracking(ctx: Context) {
  ctx.on('message', (session) => {
    if (ctx.bots[session.uid]) return

    const channelId = session.channelId
    const guildId = session.guildId

    if (!channelId && !guildId) return

    // 用户活动追踪内部处理
    const activity = {
      userId: session.userId,
      channelId: channelId || guildId,
      guildId,
      timestamp: Date.now()
    }
    // 可以在这里添加更多内部处理逻辑
  })
}
