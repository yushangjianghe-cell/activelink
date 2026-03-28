import { Context } from 'koishi';
import { ActiveLinkTask } from '../types';
export declare class TaskManager {
    private ctx;
    constructor(ctx: Context);
    checkTaskCondition(task: ActiveLinkTask): Promise<boolean>;
    private checkUserIdleCondition;
    private checkTimeRangeCondition;
    cancelTask(taskId: number): Promise<boolean>;
    getPendingTasks(): Promise<ActiveLinkTask[]>;
    getTasksByUser(userId: string, channelId?: string): Promise<ActiveLinkTask[]>;
}
//# sourceMappingURL=task-manager.d.ts.map