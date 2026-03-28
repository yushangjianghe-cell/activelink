"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActivityScorer = void 0;
class ActivityScorer {
    RECENT_WINDOW = 90 * 1000;
    INSTANT_WINDOW = 20 * 1000;
    BURST_WINDOW = 30 * 1000;
    SUSTAINED_THRESHOLD = 8;
    INSTANT_THRESHOLD = 4;
    BURST_THRESHOLD = 5;
    calculateScore(timestamps, state) {
        const now = Date.now();
        const recentTimestamps = timestamps.filter(t => now - t <= this.RECENT_WINDOW);
        const instantTimestamps = timestamps.filter(t => now - t <= this.INSTANT_WINDOW);
        const burstTimestamps = timestamps.filter(t => now - t <= this.BURST_WINDOW);
        const recentRate = recentTimestamps.length / (this.RECENT_WINDOW / 60000);
        const instantRate = instantTimestamps.length / (this.INSTANT_WINDOW / 60000);
        const burstRate = burstTimestamps.length;
        let score = 0;
        if (recentRate >= this.SUSTAINED_THRESHOLD) {
            score += 0.3;
        }
        if (instantRate >= this.INSTANT_THRESHOLD) {
            score += 0.4;
        }
        if (burstRate >= this.BURST_THRESHOLD) {
            score += 0.3;
        }
        const timeSinceLastMessage = state.lastMessageTime ? now - state.lastMessageTime : Infinity;
        if (timeSinceLastMessage < 5000) {
            score += 0.1;
        }
        return Math.min(1, score);
    }
    shouldTrigger(score, threshold) {
        return score >= threshold;
    }
    adjustThreshold(state, hit) {
        const minThreshold = 0.5;
        const maxThreshold = 0.95;
        const adjustment = 0.05;
        if (hit) {
            state.currentThreshold = Math.min(maxThreshold, state.currentThreshold + adjustment);
        }
        else {
            state.currentThreshold = Math.max(minThreshold, state.currentThreshold - adjustment * 0.5);
        }
        return state.currentThreshold;
    }
}
exports.ActivityScorer = ActivityScorer;
//# sourceMappingURL=activity.js.map