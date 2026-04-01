"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActiveLinkService = void 0;
const koishi_1 = require("koishi");
const scheduler_1 = require("./scheduler");
const task_manager_1 = require("./task-manager");
const chat_executor_1 = require("./chat-executor");
const database_1 = require("../database");
const types_1 = require("../types");
class ActiveLinkService extends koishi_1.Service {
    config;
    scheduler;
    taskManager;
    chatExecutor;
    constructor(ctx, config) {
        super(ctx, 'activelink', true);
        this.config = config;
        this.scheduler = new scheduler_1.ActiveLinkScheduler(ctx, this);
        this.taskManager = new task_manager_1.TaskManager(ctx);
        this.chatExecutor = new chat_executor_1.ChatExecutor(ctx, config);
    }
    async start() {
        await this.scheduler.start();
        this.ctx.logger('activelink').info('ActiveLink service started');
    }
    async stop() {
        this.scheduler.stop();
        this.ctx.logger('activelink').info('ActiveLink service stopped');
    }
    async addTask(userId, channelId, content, triggerTime, options) {
        const inferredPlatform = options?.platform
            || options?.metadata?.platform
            || this.chatExecutor.resolvePreferredPlatform(channelId, userId);
        const metadata = {
            ...(options?.metadata || {}),
            ...(inferredPlatform ? { platform: inferredPlatform } : {})
        };
        const task = await (0, database_1.createActiveLinkTask)(this.ctx, {
            userId,
            channelId,
            guildId: options?.guildId,
            triggerTime,
            content,
            type: options?.type || types_1.ActiveLinkTaskType.REMINDER,
            tags: options?.tags || [],
            cancelOn: options?.cancelOn || [],
            condition: options?.condition,
            metadata
        });
        this.ctx.emit('activelink/task-created', task);
        return task;
    }
    async cancelTask(taskId) {
        return this.taskManager.cancelTask(taskId);
    }
    async executeTask(task) {
        return this.chatExecutor.executeTask(task);
    }
    async sendProactiveMessage(userId, channelId, content, options) {
        const target = {
            userId,
            channelId,
            guildId: options?.guildId,
            isDirect: options?.isDirect || false,
            adapter: {
                type: 'other',
                platform: 'unknown',
                selfId: ''
            }
        };
        const trigger = {
            type: 'proactive',
            reason: '主动消息'
        };
        return this.chatExecutor.executeProactive(target, trigger, this.config.triggerTemplate, content);
    }
}
exports.ActiveLinkService = ActiveLinkService;
__exportStar(require("./scheduler"), exports);
__exportStar(require("./task-manager"), exports);
__exportStar(require("./chat-executor"), exports);
//# sourceMappingURL=index.js.map