import { ConversationState } from '../types'

export interface ActivityScore {
  score: number
  recentRate: number
  instantRate: number
  burstRate: number
}

export class ActivityScorer {
  private readonly RECENT_WINDOW = 90 * 1000
  private readonly INSTANT_WINDOW = 20 * 1000
  private readonly BURST_WINDOW = 30 * 1000

  private readonly SUSTAINED_THRESHOLD = 8
  private readonly INSTANT_THRESHOLD = 4
  private readonly BURST_THRESHOLD = 5

  calculateScore(timestamps: number[], state: ConversationState): number {
    const now = Date.now()
    const recentTimestamps = timestamps.filter(t => now - t <= this.RECENT_WINDOW)
    const instantTimestamps = timestamps.filter(t => now - t <= this.INSTANT_WINDOW)
    const burstTimestamps = timestamps.filter(t => now - t <= this.BURST_WINDOW)

    const recentRate = recentTimestamps.length / (this.RECENT_WINDOW / 60000)
    const instantRate = instantTimestamps.length / (this.INSTANT_WINDOW / 60000)
    const burstRate = burstTimestamps.length

    let score = 0

    if (recentRate >= this.SUSTAINED_THRESHOLD) {
      score += 0.3
    }
    if (instantRate >= this.INSTANT_THRESHOLD) {
      score += 0.4
    }
    if (burstRate >= this.BURST_THRESHOLD) {
      score += 0.3
    }

    const timeSinceLastMessage = state.lastMessageTime ? now - state.lastMessageTime : Infinity
    if (timeSinceLastMessage < 5000) {
      score += 0.1
    }

    return Math.min(1, score)
  }

  shouldTrigger(score: number, threshold: number): boolean {
    return score >= threshold
  }

  adjustThreshold(state: ConversationState, hit: boolean): number {
    const minThreshold = 0.5
    const maxThreshold = 0.95
    const adjustment = 0.05

    if (hit) {
      state.currentThreshold = Math.min(maxThreshold, state.currentThreshold + adjustment)
    } else {
      state.currentThreshold = Math.max(minThreshold, state.currentThreshold - adjustment * 0.5)
    }

    return state.currentThreshold
  }
}
