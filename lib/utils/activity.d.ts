import { ConversationState } from '../types';
export interface ActivityScore {
    score: number;
    recentRate: number;
    instantRate: number;
    burstRate: number;
}
export declare class ActivityScorer {
    private readonly RECENT_WINDOW;
    private readonly INSTANT_WINDOW;
    private readonly BURST_WINDOW;
    private readonly SUSTAINED_THRESHOLD;
    private readonly INSTANT_THRESHOLD;
    private readonly BURST_THRESHOLD;
    calculateScore(timestamps: number[], state: ConversationState): number;
    shouldTrigger(score: number, threshold: number): boolean;
    adjustThreshold(state: ConversationState, hit: boolean): number;
}
//# sourceMappingURL=activity.d.ts.map