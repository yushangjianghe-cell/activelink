import { Context } from 'koishi';
import { ActiveLinkTask, ConversationRoom, MessageTarget, TriggerReason } from '../types';
export declare class ChatExecutor {
    private ctx;
    private config;
    private adapterManager;
    private sessionCache;
    constructor(ctx: Context, config: any);
    resolvePreferredPlatform(channelId: string, userId?: string): string | undefined;
    executeTask(task: ActiveLinkTask): Promise<boolean>;
    executeWithRoom(userId: string, channelId: string, content: string, room: ConversationRoom, preferredPlatformHint?: string): Promise<boolean>;
    executeProactive(target: MessageTarget, trigger: TriggerReason, template: string, historyText?: string): Promise<boolean>;
    private createChatEvents;
    private debug;
    private removeActionTags;
    private extractMessages;
    private sendMessages;
    private buildTemplateVars;
    private renderTemplate;
    private formatDate;
    private withPlatformKey;
    private inferPlatformFromChannel;
    private getOrderedBots;
    private getCachedSession;
}
//# sourceMappingURL=chat-executor.d.ts.map