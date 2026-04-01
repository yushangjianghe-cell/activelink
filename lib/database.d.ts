import { Context } from 'koishi';
import { ActiveLinkTask, ActiveLinkTaskType, CancelEvent, TaskCondition } from './types';
export declare function extendDatabase(ctx: Context): void;
export declare function createActiveLinkTask(ctx: Context, data: {
    userId: string;
    channelId: string;
    guildId?: string;
    triggerTime: Date | number;
    content: string;
    type?: ActiveLinkTaskType;
    tags?: string[];
    cancelOn?: CancelEvent[];
    condition?: TaskCondition;
    metadata?: Record<string, any>;
    roomId?: number;
}): Promise<ActiveLinkTask>;
//# sourceMappingURL=database.d.ts.map