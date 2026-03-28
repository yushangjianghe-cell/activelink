"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActivityIdleTrigger = void 0;
const adapters_1 = require("../adapters");
const activity_1 = require("../utils/activity");
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
class ActivityIdleTrigger {
    ctx;
    config;
    service;
    sessions = {};
    conversationStates = {};
    messageTimestamps = {};
    chatMessages = {};
    activityScorer;
    adapterManager;
    stateFilePath;
    imageCacheDir;
    dirty = false;
    isSaving = false;
    pendingSave = false;
    MAX_MESSAGES = 100;
    MAX_TIMESTAMPS = 200;
    constructor(ctx, config, service) {
        this.ctx = ctx;
        this.config = config;
        this.service = service;
        this.activityScorer = new activity_1.ActivityScorer();
        this.adapterManager = new adapters_1.AdapterManager(ctx);
        this.stateFilePath = path_1.default.resolve(ctx.baseDir || process.cwd(), 'data', 'activelink-state.json');
        this.imageCacheDir = path_1.default.resolve(ctx.baseDir || process.cwd(), 'data', 'activelink-images');
    }
    async start() {
        await this.loadState();
        this.ctx.middleware((session, next) => this.handleMessage(session, next));
        this.ctx.setInterval(() => {
            this.saveState();
        }, 10000);
        this.ctx.logger('activelink').info('Activity/Idle trigger started');
    }
    async stop() {
        await this.saveState(true);
    }
    async handleMessage(session, next) {
        if (this.ctx.bots[session.uid]) {
            await next();
            return;
        }
        const profile = this.getProfileBySession(session);
        const conversationId = this.getConversationId(session);
        const now = session.timestamp || Date.now();
        if (!profile) {
            await next();
            return;
        }
        this.sessions[conversationId] = session;
        this.recordTimestamp(conversationId, now);
        if (!session.isDirect) {
            await this.addChatMessage(conversationId, session);
        }
        const state = this.getOrCreateState(conversationId, profile);
        state.lastMessageTime = now;
        state.messageCount = (state.messageCount ?? 0) + 1;
        this.markDirty();
        const triggerReason = this.evaluateTriggers(conversationId, state, now, profile);
        if (triggerReason) {
            await this.triggerResponse(session, triggerReason, profile);
            return;
        }
        await next();
    }
    evaluateTriggers(conversationId, state, now, profile) {
        if (state.lastTriggerTime && now - state.lastTriggerTime < profile.cooldownSeconds * 1000) {
            return null;
        }
        if (state.responseLocked) {
            return null;
        }
        const isGroupProfile = this.isGroupProfile(profile);
        if (isGroupProfile && profile.enableActivityTrigger) {
            const timestamps = this.messageTimestamps[conversationId] || [];
            const score = this.activityScorer.calculateScore(timestamps, state);
            state.lastActivityScore = score;
            if (this.activityScorer.shouldTrigger(score, state.currentThreshold)) {
                return {
                    type: 'activity',
                    reason: '活跃度触发'
                };
            }
            const messageInterval = profile.activityMessageInterval ?? 20;
            if (messageInterval > 0 && state.messageCount >= messageInterval) {
                return {
                    type: 'activity',
                    reason: '消息计数触发'
                };
            }
        }
        return null;
    }
    async triggerResponse(session, trigger, profile) {
        const conversationId = this.getConversationId(session);
        const state = this.getOrCreateState(conversationId, profile);
        if (state.responseLocked)
            return;
        state.responseLocked = true;
        try {
            const template = this.getPromptTemplate(trigger, profile);
            const useHist = this.shouldUseHistory(template);
            const msgs = useHist ? this.getRecentHistoryMessages(conversationId, profile) : [];
            const { txt: histTxt } = await this.formatHistory(msgs, profile);
            const bodyTxt = await this.buildRequestText(session, trigger, histTxt, template);
            const target = {
                userId: session.userId || '',
                channelId: session.channelId || '',
                guildId: session.guildId || '',
                isDirect: session.isDirect || false,
                adapter: this.adapterManager.detectAdapter(session)
            };
            const success = await this.service.chatExecutor.executeProactive(target, trigger, bodyTxt);
            if (success) {
                this.chatMessages[conversationId] = [];
                this.markDirty();
                this.updateStateAfterResponse(state, profile);
            }
        }
        catch (error) {
            this.ctx.logger('activelink').error(`Trigger response failed: ${error}`);
        }
        finally {
            state.responseLocked = false;
        }
    }
    getProfileBySession(session) {
        const groupConfigs = this.config.groupConfigs || [];
        const privateConfigs = this.config.privateConfigs || [];
        if (session.isDirect) {
            const exactConfig = privateConfigs.find(item => item.userId === session.userId && item.userId !== 'default');
            if (exactConfig)
                return exactConfig;
            if (this.config.applyDefaultPrivateConfigs?.includes(session.userId)) {
                const defaultConfig = privateConfigs.find(item => item.userId === 'default');
                if (defaultConfig)
                    return defaultConfig;
            }
            return null;
        }
        const exactConfig = groupConfigs.find(item => item.guildId === session.guildId && item.guildId !== 'default');
        if (exactConfig)
            return exactConfig;
        if (this.config.applyDefaultGroupConfigs?.includes(session.guildId)) {
            const defaultConfig = groupConfigs.find(item => item.guildId === 'default');
            if (defaultConfig)
                return defaultConfig;
        }
        return null;
    }
    getConversationId(session) {
        return session.isDirect
            ? `private:${session.userId}`
            : `group:${session.guildId}`;
    }
    getOrCreateState(conversationId, profile) {
        if (!this.conversationStates[conversationId]) {
            const isGroupProfile = this.isGroupProfile(profile);
            this.conversationStates[conversationId] = {
                lastMessageTime: 0,
                currentThreshold: isGroupProfile && profile.enableActivityTrigger
                    ? (profile.activityLowerLimit ?? 0.85)
                    : 1,
                lastActivityScore: 0,
                lastTriggerTime: 0,
                responseLocked: false,
                messageCount: 0
            };
            this.markDirty();
        }
        return this.conversationStates[conversationId];
    }
    recordTimestamp(conversationId, timestamp) {
        if (!this.messageTimestamps[conversationId]) {
            this.messageTimestamps[conversationId] = [];
        }
        this.messageTimestamps[conversationId].push(timestamp);
        if (this.messageTimestamps[conversationId].length > this.MAX_TIMESTAMPS) {
            this.messageTimestamps[conversationId] = this.messageTimestamps[conversationId].slice(-this.MAX_TIMESTAMPS);
        }
        this.markDirty();
    }
    async addChatMessage(conversationId, session) {
        this.ensureMessageBucket(conversationId);
        const msg = {
            id: session.author?.id || session.userId || '',
            name: session.author?.name || session.author?.nick || session.username || 'Unknown',
            content: this.normalizeMessageContent(session.content || ''),
            timestamp: session.timestamp || Date.now(),
            messageId: session.messageId
        };
        const profile = this.getProfileBySession(session);
        const cap = Math.max(1, profile?.historyMessageLimit || this.MAX_MESSAGES);
        this.appendChatMessage(conversationId, msg, cap);
    }
    ensureMessageBucket(conversationId) {
        if (!this.chatMessages[conversationId]) {
            this.chatMessages[conversationId] = [];
        }
    }
    appendChatMessage(conversationId, message, limit) {
        this.chatMessages[conversationId].push(message);
        if (this.chatMessages[conversationId].length > limit) {
            this.chatMessages[conversationId] = this.chatMessages[conversationId].slice(-limit);
        }
        this.markDirty();
    }
    normalizeMessageContent(raw) {
        return String(raw || '')
            .replace(/\[CQ:image,[^\]]*]/gi, '')
            .replace(/<img\b[^>]*\/?>/gi, '')
            .replace(/!\[[^\]]*]\((https?:\/\/[^)\s]+)\)/gi, '')
            .replace(/https?:\/\/\S+\.(?:png|jpe?g|gif|webp|bmp|svg)(?:\?\S*)?/gi, '')
            .replace(/\s+/g, ' ')
            .trim();
    }
    getRecentHistoryMessages(conversationId, profile) {
        const messages = this.chatMessages[conversationId];
        if (!messages || messages.length === 0)
            return [];
        return messages.slice(-profile.historyMessageLimit);
    }
    async formatHistory(msgs, profile) {
        if (!msgs.length)
            return { txt: '', imgs: [] };
        const lines = msgs.map((m) => {
            return `[${this.formatTimestamp(m.timestamp)}] ${m.name}(${m.id}): ${(m.content || '').trim()}`;
        });
        return { txt: lines.join('\n'), imgs: [] };
    }
    formatTimestamp(timestamp) {
        return new Date(timestamp).toLocaleString('zh-CN', {
            month: 'numeric',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    async buildRequestText(session, trigger, history, template) {
        const finalTemplate = template || '{history}';
        const vars = await this.buildTemplateVars(session, trigger, history);
        return this.renderTemplate(finalTemplate, vars);
    }
    shouldUseHistory(template) {
        return String(template || '').includes('{history}');
    }
    getPromptTemplate(trigger, profile) {
        if (trigger.type === 'activity' && this.isGroupProfile(profile) && profile.enableActivityTrigger) {
            return profile.activityPromptTemplate || '{history}';
        }
        if (trigger.type === 'idle' && profile.enableIdleTrigger) {
            return profile.idlePromptTemplate || '{history}';
        }
        return '{history}';
    }
    async buildTemplateVars(session, trigger, history) {
        const now = new Date();
        return {
            history: history || '(无)',
            time: now.toLocaleTimeString('zh-CN', { hour12: false }),
            date: this.formatDate(now),
            group_name: session.guildId || '',
            user_name: session.author?.name || session.username || '',
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
    updateStateAfterResponse(state, profile) {
        const now = Date.now();
        state.lastTriggerTime = now;
        state.messageCount = 0;
        if (this.isGroupProfile(profile) && profile.enableActivityTrigger) {
            this.activityScorer.adjustThreshold(state, true);
        }
        this.markDirty();
    }
    isGroupProfile(profile) {
        return !!profile && 'enableActivityTrigger' in profile;
    }
    markDirty() {
        this.dirty = true;
        if (this.isSaving) {
            this.pendingSave = true;
        }
    }
    async loadState() {
        try {
            const raw = await fs_1.promises.readFile(this.stateFilePath, 'utf8');
            const parsed = JSON.parse(raw);
            this.conversationStates = parsed?.conversationStates || {};
            this.messageTimestamps = parsed?.messageTimestamps || {};
            this.chatMessages = parsed?.chatMessages || {};
            this.ctx.logger('activelink').info(`State loaded from ${this.stateFilePath}`);
        }
        catch (error) {
            this.ctx.logger('activelink').debug(`No persisted state found: ${error}`);
        }
    }
    async saveState(force = false) {
        if (!force && !this.dirty)
            return;
        if (this.isSaving) {
            this.pendingSave = true;
            return;
        }
        this.isSaving = true;
        try {
            do {
                this.pendingSave = false;
                this.dirty = false;
                const payload = {
                    conversationStates: this.conversationStates,
                    messageTimestamps: this.messageTimestamps,
                    chatMessages: this.chatMessages
                };
                await fs_1.promises.mkdir(path_1.default.dirname(this.stateFilePath), { recursive: true });
                await fs_1.promises.writeFile(this.stateFilePath, JSON.stringify(payload), 'utf8');
            } while (this.pendingSave || this.dirty);
        }
        catch (error) {
            this.ctx.logger('activelink').error(`Failed to save state: ${error}`);
            this.dirty = true;
        }
        finally {
            this.isSaving = false;
        }
    }
}
exports.ActivityIdleTrigger = ActivityIdleTrigger;
//# sourceMappingURL=activity-idle.js.map