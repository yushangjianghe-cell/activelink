import { Context } from 'koishi';
export declare function extractRealUserId(userId: string, channelId: string): string;
export declare function buildTriggerMessage(template: string, content: string): string;
export declare function getGuildIdFromChannelId(channelId: string): string;
export declare function isGroupChannel(channelId: string): boolean;
export declare function formatTime(date: Date): string;
export declare function formatDate(date: Date): string;
export declare function formatRelativeTime(targetDate: Date): string;
export declare function parseTimeString(timeStr: string): {
    hour: number;
    minute: number;
} | null;
export declare function isInSleepTime(sleepStart: string, sleepEnd: string): boolean;
export declare function initUserTracking(ctx: Context): void;
//# sourceMappingURL=shared.d.ts.map