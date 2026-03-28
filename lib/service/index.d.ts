import { Context, Service } from 'koishi';
import { ActiveLinkScheduler } from './scheduler';
import { TaskManager } from './task-manager';
import { ChatExecutor } from './chat-executor';
import { ActiveLinkTaskType, CancelEvent, TaskCondition, ActiveLinkTask } from '../types';
declare module 'koishi' {
    interface Context {
        activelink?: ActiveLinkService;
    }
}
export declare class ActiveLinkService extends Service {
    config: any;
    scheduler: ActiveLinkScheduler;
    taskManager: TaskManager;
    chatExecutor: ChatExecutor;
    constructor(ctx: Context, config: any);
    start(): Promise<void>;
    stop(): Promise<void>;
    addTask(userId: string, channelId: string, content: string, triggerTime: Date | number, options?: {
        type?: ActiveLinkTaskType;
        tags?: string[];
        cancelOn?: CancelEvent[];
        condition?: TaskCondition;
        guildId?: string;
    }): Promise<ActiveLinkTask>;
    cancelTask(taskId: number): Promise<boolean>;
    executeTask(task: ActiveLinkTask): Promise<boolean>;
    sendProactiveMessage(userId: string, channelId: string, content: string, options?: {
        guildId?: string;
        isDirect?: boolean;
    }): Promise<boolean>;
}
export * from './scheduler';
export * from './task-manager';
export * from './chat-executor';
//# sourceMappingURL=index.d.ts.map