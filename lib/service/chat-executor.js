"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatExecutor = void 0;
const crypto_1 = require("crypto");
const adapters_1 = require("../adapters");
const room_1 = require("../utils/room");
const shared_1 = require("../utils/shared");
class ChatExecutor {
    ctx;
    config;
    adapterManager;
    constructor(ctx, config) {
        this.ctx = ctx;
        this.config = config;
        this.adapterManager = new adapters_1.AdapterManager(ctx);
    }
    async executeTask(task) {
        const room = await (0, room_1.getUserRoom)(this.ctx, task.userId, task.channelId);
        if (!room) {
            this.ctx.logger('activelink').warn(`No room found for task [${task.id}]`);
            return false;
        }
        return this.executeWithRoom(task.userId, task.channelId, task.content, room);
    }
    async executeWithRoom(userId, channelId, content, room) {
        const logger = this.ctx.logger('activelink');
        const maxRetries = 6;
        if (!room.model) {
            logger.error(`Room [${room.roomName}] has no model configured`);
            return false;
        }
        const triggerMessage = (0, shared_1.buildTriggerMessage)(this.config.triggerTemplate, content);
        let session = null;
        let selectedBot = null;
        for (const bot of this.ctx.bots) {
            try {
                const isGroup = channelId.includes(':') && !channelId.startsWith('private:');
                session = bot.session({
                    type: 'message',
                    timestamp: Date.now(),
                    selfId: bot.selfId,
                    user: { id: userId },
                    channel: { id: channelId, type: 0 },
                    guild: isGroup ? { id: channelId.split(':')[0] } : undefined,
                    content: triggerMessage
                });
                selectedBot = bot;
                logger.debug(`Using bot: ${bot.platform}`);
                break;
            }
            catch (err) {
                logger.debug(`Bot ${bot.platform} failed to create session`);
                continue;
            }
        }
        if (!session || !selectedBot) {
            logger.error('No valid bot/session available');
            return false;
        }
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                logger.debug(`[Attempt ${attempt}/${maxRetries}] Executing chat for room [${room.roomName}], model: ${room.model}`);
                const events = this.createChatEvents();
                const response = await this.ctx.chatluna.chat(session, room, {
                    content: triggerMessage,
                    role: 'system'
                }, events, false, {}, undefined, (0, crypto_1.randomUUID)());
                let rawContent = response.content;
                const finalText = this.removeActionTags(rawContent);
                if (!finalText || !finalText.trim()) {
                    logger.warn(`[Attempt ${attempt}/${maxRetries}] Empty response`);
                    if (attempt < maxRetries) {
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        continue;
                    }
                    return false;
                }
                await session.send(finalText);
                logger.debug(`Sent to [${room.roomName}]`);
                return true;
            }
            catch (err) {
                logger.error(`[Attempt ${attempt}/${maxRetries}] Chat execution failed:`, err instanceof Error ? err.message : String(err));
                if (attempt < maxRetries) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }
        }
        logger.error(`Chat execution failed after ${maxRetries} attempts`);
        return false;
    }
    async executeProactive(target, trigger, template, historyText) {
        const logger = this.ctx.logger('activelink');
        const maxRetries = 6;
        const room = await (0, room_1.getUserRoom)(this.ctx, target.userId || 'system', target.channelId);
        if (!room) {
            logger.warn(`No room found for proactive message`);
            return false;
        }
        if (!room.model) {
            logger.error(`Room [${room.roomName}] has no model configured`);
            return false;
        }
        const vars = await this.buildTemplateVars(target, trigger, historyText || '');
        const prompt = this.renderTemplate(template, vars);
        const session = this.adapterManager.createSession(target, prompt);
        if (!session) {
            logger.error('Failed to create session for proactive message');
            return false;
        }
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                logger.debug(`[Attempt ${attempt}/${maxRetries}] ExecuteProactive for room [${room.roomName}], model: ${room.model}`);
                const events = this.createChatEvents();
                const response = await this.ctx.chatluna.chat(session, room, {
                    content: prompt,
                    role: 'system'
                }, events, false, {}, undefined, (0, crypto_1.randomUUID)());
                let rawContent = response.content;
                const finalText = this.removeActionTags(rawContent);
                if (!finalText || !finalText.trim()) {
                    logger.warn(`[Attempt ${attempt}/${maxRetries}] Empty response for proactive message`);
                    if (attempt < maxRetries) {
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        continue;
                    }
                    return false;
                }
                await session.send(finalText);
                logger.debug(`Proactive message sent`);
                return true;
            }
            catch (err) {
                logger.error(`[Attempt ${attempt}/${maxRetries}] Proactive execution failed:`, err instanceof Error ? err.message : String(err));
                if (attempt < maxRetries) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }
        }
        logger.error(`Proactive execution failed after ${maxRetries} attempts`);
        return false;
    }
    createChatEvents() {
        const logger = this.ctx.logger('activelink');
        return {
            'llm-new-token': async (token) => { },
            'llm-queue-waiting': async (queueLength) => {
                logger.debug(`Waiting in queue, length: ${queueLength}`);
            },
            'llm-calling-tool': async (toolName) => {
                logger.debug(`Calling tool: ${toolName}`);
            },
            'llm-call-tool-end': async (result) => { },
            'llm-used-token-count': async (count) => {
                logger.debug(`Used ${count} tokens`);
            }
        };
    }
    removeActionTags(text) {
        if (!text || typeof text !== 'string')
            return '';
        return text.replace(/\[action\][\s\S]*?\[\/action\]/gi, '').trim();
    }
    async buildTemplateVars(target, trigger, history) {
        const now = new Date();
        return {
            history: history || '(无)',
            time: now.toLocaleTimeString('zh-CN', { hour12: false }),
            date: this.formatDate(now),
            group_name: target.guildId || '',
            user_name: target.userId || '',
            idle_minutes: String(trigger.idleMinutes || 0)
        };
    }
    renderTemplate(template, vars) {
        return String(template || '').replace(/\{([a-z_]+)\}/gi, (_match, key) => {
            return vars[key] || '';
        }).trim();
    }
    formatDate(date) {
        const weekdayMap = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        const w = weekdayMap[date.getDay()];
        return `${y}-${m}-${d} ${w}`;
    }
}
exports.ChatExecutor = ChatExecutor;
//# sourceMappingURL=chat-executor.js.map