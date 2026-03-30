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
        const logger = this.ctx.logger('activelink');
        try {
            const rooms = await (0, room_1.getAllRooms)(this.ctx);
            logger.debug(`[Proactive] Checking ${rooms.length} rooms for proactive trigger`);
            if (rooms.length === 0) {
                logger.debug('[Proactive] No rooms found');
                return;
            }
            const now = Date.now();
            const initialDelayMs = this.config.initialDelay * 60 * 60 * 1000;
            for (const roomInfo of rooms) {
                try {
                    const channelId = roomInfo.channelId;
                    logger.debug(`[Proactive] Checking room [${channelId}], state exists: ${this.roomStates.has(channelId)}`);
                    if (!(0, scope_1.isInScope)(channelId, this.scope)) {
                        logger.debug(`[Proactive] Room [${channelId}] not in scope, skipping`);
                        continue;
                    }
                    let state = this.roomStates.get(channelId);
                    if (!state) {
                        state = { lastChatTime: now, currentProbability: 0 };
                        this.roomStates.set(channelId, state);
                    }
                    const timeSinceLastChat = now - state.lastChatTime;
                    logger.debug(`[Proactive] Room [${channelId}], time since last chat: ${Math.floor(timeSinceLastChat / 1000 / 60)}min, current probability: ${state.currentProbability}`);
                    if (timeSinceLastChat < initialDelayMs) {
                        logger.debug(`[Proactive] Room [${channelId}] still in initial delay period, skipping`);
                        continue;
                    }
                    if (state.currentProbability === 0) {
                        state.currentProbability = this.config.initialProbability;
                    }
                    else {
                        state.currentProbability = Math.min(state.currentProbability + this.config.probabilityIncrease, this.config.maxProbability);
                    }
                    const random = Math.random();
                    logger.debug(`[Proactive] Room [${channelId}], random: ${random.toFixed(4)}, probability: ${state.currentProbability.toFixed(4)}, trigger: ${random <= state.currentProbability}`);
                    if (random > state.currentProbability) {
                        continue;
                    }
                    const prompts = this.config.prompts?.length ? this.config.prompts : ['主动来找用户聊天'];
                    const prompt = prompts[Math.floor(Math.random() * prompts.length)];
                    logger.info(`[Proactive] Triggering proactive message for room [${channelId}]`);
                    const success = await this.service.chatExecutor.executeWithRoom(roomInfo.userId, roomInfo.channelId, prompt, roomInfo.room);
                    if (success) {
                        state.lastChatTime = now;
                        state.currentProbability = 0;
                        logger.info(`[Proactive] Proactive message sent successfully to room [${channelId}]`);
                    }
                }
                catch (err) {
                    logger.error(`[Proactive] Error processing room [${roomInfo.channelId}]:`, err);
                }
                await new Promise(resolve => setTimeout(resolve, 200));
            }
        }
        catch (err) {
            logger.error('[Proactive] Proactive check failed:', err);
        }
    }
    async forceTriggerOnce(targetChannelId) {
        const logger = this.ctx.logger('activelink');
        let success = 0;
        let failed = 0;
        const isTargeted = !!targetChannelId;
        try {
            const rooms = await (0, room_1.getAllRooms)(this.ctx);
            const targetRooms = targetChannelId
                ? rooms.filter(room => room.channelId === targetChannelId)
                : rooms;
            if (isTargeted) {
                logger.info(`[Proactive] Force trigger: processing ${targetRooms.length} room(s) for [${targetChannelId}]`);
            }
            else {
                logger.info(`[Proactive] Force trigger: processing ${targetRooms.length} rooms`);
            }
            if (isTargeted && targetRooms.length === 0) {
                logger.warn(`[Proactive] Force trigger: room [${targetChannelId}] not found`);
                return { success: 0, failed: 1 };
            }
            for (const roomInfo of targetRooms) {
                try {
                    const channelId = roomInfo.channelId;
                    if (!(0, scope_1.isInScope)(channelId, this.scope)) {
                        logger.debug(`[Proactive] Force trigger: room [${channelId}] not in scope, skipping`);
                        if (isTargeted) {
                            failed++;
                        }
                        continue;
                    }
                    const prompts = this.config.prompts?.length ? this.config.prompts : ['主动来找用户聊天'];
                    const prompt = prompts[Math.floor(Math.random() * prompts.length)];
                    logger.info(`[Proactive] Force triggering proactive message for room [${channelId}]`);
                    const result = await this.service.chatExecutor.executeWithRoom(roomInfo.userId, roomInfo.channelId, prompt, roomInfo.room);
                    if (result) {
                        success++;
                        const state = this.roomStates.get(channelId);
                        if (state) {
                            state.lastChatTime = Date.now();
                            state.currentProbability = 0;
                        }
                    }
                    else {
                        failed++;
                    }
                }
                catch (err) {
                    logger.error(`[Proactive] Force trigger error for room [${roomInfo.channelId}]:`, err);
                    failed++;
                }
                await new Promise(resolve => setTimeout(resolve, 200));
            }
        }
        catch (err) {
            logger.error('[Proactive] Force trigger failed:', err);
        }
        logger.info(`[Proactive] Force trigger completed: ${success} success, ${failed} failed`);
        return { success, failed };
    }
}
exports.ProactiveTrigger = ProactiveTrigger;
//# sourceMappingURL=proactive.js.map