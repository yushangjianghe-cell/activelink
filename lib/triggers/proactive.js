"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProactiveTrigger = void 0;
const scope_1 = require("../utils/scope");
const room_1 = require("../utils/room");
const shared_1 = require("../utils/shared");
class ProactiveTrigger {
    ctx;
    config;
    service;
    scope;
    timer;
    roomStates = new Map();
    constructor(ctx, config, service, scope) {
        this.ctx = ctx;
        this.config = config;
        this.service = service;
        this.scope = scope;
        this.listenToChatEvents();
    }
    listenToChatEvents() {
        this.ctx.on('message', (session) => {
            const channelId = session.channelId || '';
            const guildId = session.guildId || '';
            if (!channelId && !guildId)
                return;
            const key = guildId || channelId;
            this.roomStates.set(key, {
                lastChatTime: Date.now(),
                currentProbability: 0
            });
        });
    }
    start() {
        if (!this.config.enabled) {
            return;
        }
        const intervalMs = this.config.checkInterval * 60 * 1000;
        this.timer = this.ctx.setInterval(() => {
            this.checkAndTrigger();
        }, intervalMs);
        this.ctx.logger('activelink').info(`Proactive chat enabled (check every ${this.config.checkInterval}min, delay ${this.config.initialDelay}h)`);
    }
    stop() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }
    isInSleepTime() {
        return (0, shared_1.isInSleepTime)(this.config.sleepStart, this.config.sleepEnd);
    }
    async checkAndTrigger() {
        if (this.isInSleepTime()) {
            return;
        }
        await this.checkChatLuna();
    }
    async checkChatLuna() {
        try {
            const rooms = await (0, room_1.getAllRooms)(this.ctx);
            const now = Date.now();
            const initialDelayMs = this.config.initialDelay * 60 * 60 * 1000;
            for (const roomInfo of rooms) {
                try {
                    const channelId = roomInfo.channelId;
                    if (!(0, scope_1.isInScope)(channelId, this.scope)) {
                        continue;
                    }
                    let state = this.roomStates.get(channelId);
                    if (!state) {
                        state = { lastChatTime: now, currentProbability: 0 };
                        this.roomStates.set(channelId, state);
                        continue;
                    }
                    const timeSinceLastChat = now - state.lastChatTime;
                    if (timeSinceLastChat < initialDelayMs) {
                        continue;
                    }
                    if (state.currentProbability === 0) {
                        state.currentProbability = this.config.initialProbability;
                    }
                    else {
                        state.currentProbability = Math.min(state.currentProbability + this.config.probabilityIncrease, this.config.maxProbability);
                    }
                    const random = Math.random();
                    if (random > state.currentProbability) {
                        continue;
                    }
                    const prompts = this.config.prompts?.length ? this.config.prompts : ['主动来找用户聊天'];
                    const prompt = prompts[Math.floor(Math.random() * prompts.length)];
                    const success = await this.service.chatExecutor.executeWithRoom(roomInfo.userId, roomInfo.channelId, prompt, roomInfo.room);
                    if (success) {
                        state.lastChatTime = now;
                        state.currentProbability = 0;
                    }
                }
                catch (err) {
                    // 静默处理单个房间的错误
                }
                await new Promise(resolve => setTimeout(resolve, 200));
            }
        }
        catch (err) {
            this.ctx.logger('activelink').error('Proactive check failed:', err);
        }
    }
}
exports.ProactiveTrigger = ProactiveTrigger;
//# sourceMappingURL=proactive.js.map