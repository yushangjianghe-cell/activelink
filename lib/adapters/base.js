"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UniversalAdapter = exports.BaseAdapter = void 0;
class BaseAdapter {
    ctx;
    logger;
    constructor(ctx) {
        this.ctx = ctx;
        this.logger = ctx.logger('activelink');
    }
    findBotForPlatform(platform) {
        for (const bot of this.ctx.bots) {
            if (bot.platform === platform) {
                return bot;
            }
        }
        return null;
    }
    findAnyBot() {
        for (const bot of this.ctx.bots) {
            return bot;
        }
        return null;
    }
}
exports.BaseAdapter = BaseAdapter;
class UniversalAdapter extends BaseAdapter {
    getAdapterType() {
        return 'other';
    }
    detectAdapter(session) {
        const platform = session.platform || 'unknown';
        return {
            type: 'other',
            platform,
            selfId: session.selfId
        };
    }
    createSession(target, content) {
        const bot = this.findBotForPlatform(target.adapter.platform) || this.findAnyBot();
        if (!bot) {
            this.logger.error('No bot available for universal adapter');
            return null;
        }
        try {
            const session = bot.session({
                type: 'message',
                timestamp: Date.now(),
                selfId: bot.selfId,
                user: { id: target.userId || 'system' },
                channel: { id: target.channelId, type: target.isDirect ? 1 : 0 },
                guild: target.guildId ? { id: target.guildId } : undefined,
                content: this.formatMessageForAdapter(content)
            });
            return session;
        }
        catch (err) {
            this.logger.error('Failed to create session:', err);
            return null;
        }
    }
    formatMessageForAdapter(content) {
        return content;
    }
    supportsFeature(feature) {
        return false;
    }
}
exports.UniversalAdapter = UniversalAdapter;
//# sourceMappingURL=base.js.map