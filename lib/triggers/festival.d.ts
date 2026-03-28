import { Context } from 'koishi';
import { ActiveLinkService } from '../service';
import { ScopeConfig } from '../utils/scope';
export interface FestivalConfig {
    enabled: boolean;
    promptTemplate: string;
    defaultTime: string;
    custom: CustomFestival[];
}
export interface CustomFestival {
    name: string;
    date: string;
    time: string;
    description: string;
}
export declare class FestivalTrigger {
    private ctx;
    private config;
    private service;
    private scope;
    private jobs;
    constructor(ctx: Context, config: FestivalConfig, service: ActiveLinkService, scope: ScopeConfig);
    start(): void;
    stop(): void;
    private scheduleBuiltinFestivals;
    private scheduleCustomFestivals;
    private scheduleFestival;
    private triggerFestival;
}
//# sourceMappingURL=festival.d.ts.map