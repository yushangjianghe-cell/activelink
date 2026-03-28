import { Context } from 'koishi';
import { ActiveLinkService } from '../service';
import { ScopeConfig } from '../utils/scope';
export interface ScheduledTaskConfig {
    name: string;
    time: string;
    prompt: string;
}
export interface ScheduledConfig {
    enabled: boolean;
    tasks: ScheduledTaskConfig[];
}
export declare class ScheduledTrigger {
    private ctx;
    private config;
    private service;
    private scope;
    private jobs;
    constructor(ctx: Context, config: ScheduledConfig, service: ActiveLinkService, scope: ScopeConfig);
    start(): void;
    stop(): void;
    private scheduleTask;
    private triggerTask;
}
//# sourceMappingURL=scheduled.d.ts.map