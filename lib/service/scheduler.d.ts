import { Context } from 'koishi';
import { ActiveLinkTask } from '../types';
import { ActiveLinkService } from './index';
export declare class ActiveLinkScheduler {
    private ctx;
    private service;
    private tasks;
    constructor(ctx: Context, service: ActiveLinkService);
    private listenToCancelEvents;
    start(): Promise<void>;
    stop(): void;
    private loadPendingTasks;
    scheduleTask(task: ActiveLinkTask): void;
    private executeTask;
}
//# sourceMappingURL=scheduler.d.ts.map