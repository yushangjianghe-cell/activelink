"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OneBotAdapter = void 0;
const koishi_1 = require("koishi");
const base_1 = require("./base");
class OneBotAdapter extends base_1.BaseAdapter {
    getAdapterType() {
        return 'onebot';
    }
    detectAdapter(session) {
        const platform = session.platform || '';
        if (platform.includes('onebot') || platform.includes('qq')) {
            return {
                type: 'onebot',
                platform,
                selfId: session.selfId
            };
        }
        return null;
    }
    createSession(target, content) {
        const bot = this.findBotForPlatform(target.adapter.platform) || this.findAnyBot();
        if (!bot) {
            this.logger.error('No bot available for OneBot adapter');
            return null;
        }
        try {
            const isGroup = !target.isDirect;
            const session = bot.session({
                type: 'message',
                timestamp: Date.now(),
                selfId: bot.selfId,
                user: { id: target.userId || 'system' },
                channel: { id: target.channelId, type: isGroup ? 0 : 1 },
                guild: target.guildId ? { id: target.guildId } : undefined,
                content: this.formatMessageForAdapter(content)
            });
            return session;
        }
        catch (err) {
            this.logger.error('Failed to create OneBot session:', err);
            return null;
        }
    }
    formatMessageForAdapter(content) {
        return content;
    }
    supportsFeature(feature) {
        const supportedFeatures = [
            'at',
            'reply',
            'image',
            'voice',
            'video',
            'file',
            'poke',
            'forward'
        ];
        return supportedFeatures.includes(feature);
    }
    formatAt(userId) {
        return koishi_1.h.at(userId).toString();
    }
    formatReply(messageId) {
        return koishi_1.h.quote(messageId).toString();
    }
    formatImage(url) {
        return koishi_1.h.image(url).toString();
    }
}
exports.OneBotAdapter = OneBotAdapter;
//# sourceMappingURL=onebot.js.map