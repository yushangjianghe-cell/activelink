import { Session } from 'koishi';
export declare enum ActiveLinkTaskType {
    REMINDER = "reminder",
    FOLLOW_UP = "follow-up",
    MEMO = "memo",
    SCHEDULED = "scheduled",
    FESTIVAL = "festival",
    ACTIVITY = "activity",
    IDLE = "idle"
}
export declare enum ActiveLinkTaskStatus {
    PENDING = "pending",
    EXECUTED = "executed",
    CANCELLED = "cancelled",
    FAILED = "failed"
}
export declare enum CancelEvent {
    USER_MESSAGE = "user-message",
    TASK_COMPLETED = "task-completed",
    MANUAL = "manual"
}
export declare enum TaskConditionType {
    USER_IDLE = "user-idle",
    TIME_RANGE = "time-range",
    CUSTOM = "custom"
}
export interface TaskCondition {
    type: TaskConditionType | string;
    duration?: number;
    startTime?: Date;
    endTime?: Date;
    params?: any;
    data?: any;
}
export interface ActiveLinkTask {
    id: number;
    userId: string;
    channelId: string;
    guildId?: string;
    triggerTime: Date;
    type: ActiveLinkTaskType;
    content: string;
    status: ActiveLinkTaskStatus;
    cancelOn: CancelEvent[];
    condition?: TaskCondition;
    tags?: string[];
    metadata?: Record<string, any>;
    roomId?: number;
    createdAt: Date;
}
export interface ConversationRoom {
    roomId: number;
    roomName: string;
    roomMasterId: string;
    conversationId: string;
    visibility: 'public' | 'private';
    preset: string;
    model: string;
    chatMode: string;
    autoUpdate: boolean;
    updatedTime: Date;
}
export interface ChatHubUser {
    userId: string;
    groupId: string;
    defaultRoomId: number;
}
export interface ChatHubMessage {
    id: string;
    text: string;
    role: string;
    conversation: string;
    userId: string;
    createdAt: Date;
}
export interface CachedImageRef {
    key: string;
    originalUrl: string;
    localPath?: string;
}
export interface ChatMessage {
    id: string;
    name: string;
    content: string;
    timestamp: number;
    messageId?: string;
    imgs?: CachedImageRef[];
}
export type TriggerType = 'activity' | 'idle' | 'scheduled' | 'festival' | 'proactive';
export interface TriggerReason {
    type: TriggerType;
    reason: string;
    idleMinutes?: number;
}
export interface ConversationState {
    lastMessageTime: number;
    currentThreshold: number;
    lastActivityScore: number;
    lastTriggerTime: number;
    responseLocked: boolean;
    messageCount: number;
}
export interface IdleTriggerResult {
    reason: string;
    silenceMinutes?: number;
}
export type AdapterType = 'onebot' | 'openclaw-weixin' | 'other';
export interface AdapterInfo {
    type: AdapterType;
    platform: string;
    selfId: string;
}
export interface MessageTarget {
    channelId: string;
    guildId?: string;
    userId?: string;
    isDirect: boolean;
    adapter: AdapterInfo;
}
export interface GroupTriggerConfig {
    guildId: string;
    enableActivityTrigger: boolean;
    activityLowerLimit?: number;
    activityUpperLimit?: number;
    activityMessageInterval?: number;
    activityPromptTemplate?: string;
    enableIdleTrigger: boolean;
    idleIntervalMinutes?: number;
    idleEnableJitter?: boolean;
    idlePromptTemplate?: string;
    historyMessageLimit: number;
    maxRequestImages: number;
    enableQuoteReplyByMessageId: boolean;
    cooldownSeconds: number;
}
export interface PrivateTriggerConfig {
    userId: string;
    enableIdleTrigger: boolean;
    idleIntervalMinutes?: number;
    idleEnableJitter?: boolean;
    idlePromptTemplate?: string;
    historyMessageLimit: number;
    maxRequestImages: number;
    cooldownSeconds: number;
}
export type TriggerProfileConfig = GroupTriggerConfig | PrivateTriggerConfig;
declare module 'koishi' {
    interface Tables {
        activelink_tasks: ActiveLinkTask;
        chathub_room: ConversationRoom;
        chathub_user: ChatHubUser;
        chathub_message: ChatHubMessage;
    }
    interface Context {
        chatluna: any;
        chatluna_character?: any;
    }
    interface Events {
        'activelink/task-created'(task: ActiveLinkTask): void | Promise<void>;
        'activelink/task-executed'(task: ActiveLinkTask): void | Promise<void>;
        'activelink/task-cancelled'(taskId: number): void | Promise<void>;
        'chatluna/after-chat'(conversationId: string, sourceMessage: any, responseMessage: any, promptVariables: any, chatInterface: any, session: Session): void | Promise<void>;
    }
}
//# sourceMappingURL=types.d.ts.map