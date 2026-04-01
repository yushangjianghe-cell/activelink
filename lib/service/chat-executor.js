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
    sessionCache = new Map();
    constructor(ctx, config) {
        this.ctx = ctx;
        this.config = config;
        this.adapterManager = new adapters_1.AdapterManager(ctx);
        this.ctx.on('message', (session) => {
            if (this.ctx.bots[session.uid])
                return;
            const channelId = session.channelId || '';
            const guildId = session.guildId || '';
            const userId = session.userId || '';
            const platform = session.platform || 'unknown';
            if (channelId) {
                this.sessionCache.set(channelId, session);
                this.sessionCache.set(this.withPlatformKey(platform, channelId), session);
            }
            if (guildId) {
                this.sessionCache.set(guildId, session);
                this.sessionCache.set(this.withPlatformKey(platform, guildId), session);
            }
            if (session.isDirect && userId) {
                const privateChannelId = channelId?.startsWith('private:')
                    ? channelId
                    : `private:${userId}`;
                this.sessionCache.set(privateChannelId, session);
                this.sessionCache.set(userId, session);
                this.sessionCache.set(this.withPlatformKey(platform, privateChannelId), session);
                this.sessionCache.set(this.withPlatformKey(platform, userId), session);
            }
        });
    }
    resolvePreferredPlatform(channelId, userId) {
        return this.inferPlatformFromChannel(channelId, userId);
    }
    async executeTask(task) {
        const room = await (0, room_1.getUserRoom)(this.ctx, task.userId, task.channelId);
        if (!room) {
            this.ctx.logger('activelink').warn(`No room found for task [${task.id}]`);
            return false;
        }
        const preferredPlatform = typeof task.metadata?.platform === 'string'
            ? task.metadata.platform
            : undefined;
        return this.executeWithRoom(task.userId, task.channelId, task.content, room, preferredPlatform);
    }
    async executeWithRoom(userId, channelId, content, room, preferredPlatformHint) {
        const logger = this.ctx.logger('activelink');
        const maxRetries = 6;
        if (!room.model) {
            logger.error(`Room [${room.roomName}] has no model configured`);
            return false;
        }
        const triggerMessage = (0, shared_1.buildTriggerMessage)(this.config.triggerTemplate, content);
        let session = null;
        let selectedBot = null;
        const strictPreferredPlatform = Boolean(preferredPlatformHint);
        const preferredPlatform = preferredPlatformHint || this.inferPlatformFromChannel(channelId, userId);
        const cachedSession = this.getCachedSession(channelId, userId, preferredPlatform, !strictPreferredPlatform);
        if (cachedSession) {
            session = cachedSession;
            selectedBot = cachedSession.bot;
            session.timestamp = Date.now();
            session.content = triggerMessage;
            this.debug(logger, `Using cached session for channel: ${channelId} (platform=${cachedSession.platform || 'unknown'})`);
        }
        else {
            const bots = this.getOrderedBots(preferredPlatform, strictPreferredPlatform);
            for (const bot of bots) {
                try {
                    const isGroup = (0, shared_1.isGroupChannel)(channelId);
                    const guildId = (0, shared_1.getGuildIdFromChannelId)(channelId);
                    session = bot.session({
                        type: 'message',
                        timestamp: Date.now(),
                        selfId: bot.selfId,
                        user: { id: userId },
                        channel: { id: channelId, type: isGroup ? 0 : 1 },
                        guild: isGroup ? { id: guildId } : undefined,
                        content: triggerMessage
                    });
                    selectedBot = bot;
                    this.debug(logger, `Using bot: ${bot.platform}`);
                    break;
                }
                catch (err) {
                    this.debug(logger, `Bot ${bot.platform} failed to create session`);
                    continue;
                }
            }
        }
        if (!session || !selectedBot) {
            logger.error('No valid bot/session available');
            return false;
        }
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                this.debug(logger, `[Attempt ${attempt}/${maxRetries}] Executing chat for room [${room.roomName}], model: ${room.model}`);
                const events = this.createChatEvents();
                const response = await this.ctx.chatluna.chat(session, room, {
                    content: triggerMessage,
                    role: 'system'
                }, events, false, {}, undefined, (0, crypto_1.randomUUID)());
                let rawContent = response.content;
                const cleanedText = this.removeActionTags(rawContent);
                const messages = this.extractMessages(cleanedText);
                if (messages.length === 0) {
                    logger.warn(`[Attempt ${attempt}/${maxRetries}] Empty response`);
                    if (attempt < maxRetries) {
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        continue;
                    }
                    return false;
                }
                await this.sendMessages(session, messages);
                this.debug(logger, `Sent to [${room.roomName}] (${messages.length} message(s))`);
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
        const preferredPlatform = target.adapter?.platform;
        let session = this.getCachedSession(target.channelId, target.userId, preferredPlatform, !preferredPlatform);
        if (session) {
            session.timestamp = Date.now();
            session.content = prompt;
            this.debug(logger, `Using cached proactive session for channel: ${target.channelId} (platform=${session.platform || 'unknown'})`);
        }
        else {
            session = this.adapterManager.createSession(target, prompt);
        }
        if (!session) {
            logger.error('Failed to create session for proactive message');
            return false;
        }
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                this.debug(logger, `[Attempt ${attempt}/${maxRetries}] ExecuteProactive for room [${room.roomName}], model: ${room.model}`);
                const events = this.createChatEvents();
                const response = await this.ctx.chatluna.chat(session, room, {
                    content: prompt,
                    role: 'system'
                }, events, false, {}, undefined, (0, crypto_1.randomUUID)());
                let rawContent = response.content;
                const cleanedText = this.removeActionTags(rawContent);
                const messages = this.extractMessages(cleanedText);
                if (messages.length === 0) {
                    logger.warn(`[Attempt ${attempt}/${maxRetries}] Empty response for proactive message`);
                    if (attempt < maxRetries) {
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        continue;
                    }
                    return false;
                }
                await this.sendMessages(session, messages);
                this.debug(logger, `Proactive message sent (${messages.length} message(s))`);
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
                this.debug(logger, `Waiting in queue, length: ${queueLength}`);
            },
            'llm-calling-tool': async (toolName) => {
                this.debug(logger, `Calling tool: ${toolName}`);
            },
            'llm-call-tool-end': async (result) => { },
            'llm-used-token-count': async (count) => {
                this.debug(logger, `Used ${count} tokens`);
            }
        };
    }
    debug(logger, message, ...args) {
        if (this.config?.verboseLogging) {
            logger.debug(message, ...args);
        }
    }
    removeActionTags(text) {
        if (!text || typeof text !== 'string')
            return '';
        return text
            .replace(/\[action\][\s\S]*?\[\/action\]/gi, '')
            .replace(/<think>[\s\S]*?<\/think>/gi, '')
            .trim();
    }
    extractMessages(text) {
        if (!text || typeof text !== 'string')
            return [];
        const outputMatch = text.match(/<output[^>]*>([\s\S]*?)<\/output>/i);
        const body = outputMatch ? outputMatch[1] : text;
        const messages = [];
        const messageRegex = /<message[^>]*>([\s\S]*?)<\/message>/gi;
        let match;
        while ((match = messageRegex.exec(body)) !== null) {
            const content = match[1].trim();
            if (content) {
                messages.push(content);
            }
        }
        if (messages.length > 0) {
            return messages;
        }
        const fallback = (outputMatch ? body : text).trim();
        return fallback ? [fallback] : [];
    }
    async sendMessages(session, messages) {
        const total = messages.length;
        for (const message of messages) {
            const content = message.trim();
            if (!content)
                continue;
            await session.send(content);
            if (total > 1) {
                await new Promise(resolve => setTimeout(resolve, 200));
            }
        }
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
    withPlatformKey(platform, key) {
        return `platform:${platform}|target:${key}`;
    }
    inferPlatformFromChannel(channelId, userId) {
        const privateChannelId = userId
            ? (channelId?.startsWith('private:') ? channelId : `private:${userId}`)
            : undefined;
        const botPlatforms = [];
        for (const bot of this.ctx.bots) {
            if (bot?.platform) {
                botPlatforms.push(bot.platform);
            }
        }
        for (const platform of botPlatforms) {
            if (channelId && this.sessionCache.has(this.withPlatformKey(platform, channelId))) {
                return platform;
            }
            if (userId && this.sessionCache.has(this.withPlatformKey(platform, userId))) {
                return platform;
            }
            if (privateChannelId && this.sessionCache.has(this.withPlatformKey(platform, privateChannelId))) {
                return platform;
            }
        }
        const rawId = channelId?.startsWith('private:') ? channelId.slice(8) : channelId;
        const numericLike = /^\d{6,}$/.test(rawId || userId || '');
        if (numericLike) {
            const onebot = botPlatforms.find(p => p.includes('onebot') || p.includes('qq'));
            if (onebot)
                return onebot;
        }
        const text = `${channelId || ''} ${userId || ''}`.toLowerCase();
        if (text.includes('wx') || text.includes('weixin')) {
            const weixin = botPlatforms.find(p => p.includes('openclaw') || p.includes('weixin'));
            if (weixin)
                return weixin;
        }
        return undefined;
    }
    getOrderedBots(preferredPlatform, strictPreferredPlatform = false) {
        const bots = Array.from(this.ctx.bots);
        if (!preferredPlatform) {
            return bots;
        }
        const preferred = bots.filter(bot => bot.platform === preferredPlatform);
        if (strictPreferredPlatform) {
            return preferred;
        }
        const others = bots.filter(bot => bot.platform !== preferredPlatform);
        return [...preferred, ...others];
    }
    getCachedSession(channelId, userId, preferredPlatform, allowCrossPlatformFallback = true) {
        const privateChannelId = userId
            ? (channelId?.startsWith('private:') ? channelId : `private:${userId}`)
            : undefined;
        const tryKeys = (requiredPlatform) => {
            const keys = [];
            if (channelId)
                keys.push(channelId);
            if (userId)
                keys.push(userId);
            if (privateChannelId)
                keys.push(privateChannelId);
            for (const key of keys) {
                const actualKey = requiredPlatform ? this.withPlatformKey(requiredPlatform, key) : key;
                if (!this.sessionCache.has(actualKey))
                    continue;
                const found = this.sessionCache.get(actualKey) || null;
                if (!found)
                    continue;
                if (requiredPlatform && found.platform !== requiredPlatform)
                    continue;
                return found;
            }
            return null;
        };
        if (preferredPlatform) {
            const scoped = tryKeys(preferredPlatform);
            if (scoped)
                return scoped;
            if (!allowCrossPlatformFallback)
                return null;
        }
        return tryKeys(undefined);
    }
}
exports.ChatExecutor = ChatExecutor;
//# sourceMappingURL=chat-executor.js.map