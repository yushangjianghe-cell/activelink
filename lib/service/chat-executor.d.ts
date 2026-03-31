import { Context } from 'koishi';
import { ActiveLinkTask, ConversationRoom, MessageTarget, TriggerReason } from '../types';
export declare class ChatExecutor {
    private ctx;
    private config;
    private adapterManager;
    private sessionCache;
    constructor(ctx: Context, config: any);
    executeTask(task: ActiveLinkTask): Promise<boolean>;
    executeWithRoom(userId: string, channelId: string, content: string, room: ConversationRoom): Promise<boolean>;
    executeProactive(target: MessageTarget, trigger: TriggerReason, template: string, historyText?: string): Promise<boolean>;
    private createChatEvents;
    private removeActionTags;
    private buildTemplateVars;
    private renderTemplate;
    private formatDate;
    private getCachedSession;
}
//# sourceMappingURL=chat-executor.d.ts.map