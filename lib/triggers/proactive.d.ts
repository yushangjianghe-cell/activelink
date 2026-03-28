import { Context } from 'koishi';
import { ActiveLinkService } from '../service';
import { ScopeConfig } from '../utils/scope';
export interface ProactiveConfig {
    enabled: boolean;
    checkInterval: number;
    initialDelay: number;
    initialProbability: number;
    probabilityIncrease: number;
    maxProbability: number;
    sleepStart: string;
    sleepEnd: string;
    prompts: string[];
}
export declare class ProactiveTrigger {
    private ctx;
    private config;
    private service;
    private scope;
    private timer;
    private roomStates;
    constructor(ctx: Context, config: ProactiveConfig, service: ActiveLinkService, scope: ScopeConfig);
    private listenToChatEvents;
    start(): void;
    stop(): void;
    private isInSleepTime;
    private checkAndTrigger;
    private checkChatLuna;
}
//# sourceMappingURL=proactive.d.ts.map