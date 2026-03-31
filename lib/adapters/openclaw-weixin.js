"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenClawWeixinAdapter = void 0;
const koishi_1 = require("koishi");
const base_1 = require("./base");
class OpenClawWeixinAdapter extends base_1.BaseAdapter {
    getAdapterType() {
        return 'openclaw-weixin';
    }
    detectAdapter(session) {
        const platform = session.platform || '';
        if (platform.includes('openclaw') || platform.includes('weixin')) {
            return {
                type: 'openclaw-weixin',
                platform,
                selfId: session.selfId
            };
        }
        return null;
    }
    createSession(target, content) {
        const bot = this.findBotForPlatform(target.adapter.platform) || this.findAnyBot();
        if (!bot) {
            this.logger.error('No bot available for OpenClaw Weixin adapter');
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
            this.logger.error('Failed to create OpenClaw Weixin session:', err);
            return null;
        }
    }
    async sendMessage(target, content, options) {
        const bot = this.findBotForPlatform(target.adapter.platform) || this.findAnyBot();
        if (!bot) {
            this.logger.error('No bot available for OpenClaw Weixin adapter');
            return [];
        }
        try {
            const isDirect = target.isDirect || target.channelId?.startsWith('private:');
            if (isDirect) {
                const directChannelId = target.channelId?.startsWith('private:')
                    ? target.channelId
                    : target.userId
                        ? `private:${target.userId}`
                        : target.channelId;
                if (!directChannelId) {
                    this.logger.error('Invalid target: no channelId or userId provided');
                    return [];
                }
                await bot.sendMessage(directChannelId, content);
                return [directChannelId];
            }
            if (!target.channelId) {
                this.logger.error('Invalid target: no channelId provided');
                return [];
            }
            await bot.sendMessage(target.channelId, content);
            return [target.channelId];
        }
        catch (err) {
            this.logger.error('Failed to send message via OpenClaw Weixin adapter:', err);
            return [];
        }
    }
    formatMessageForAdapter(content) {
        return content;
    }
    supportsFeature(feature) {
        const supportedFeatures = [
            'text',
            'image',
            'file'
        ];
        return supportedFeatures.includes(feature);
    }
    formatImage(url) {
        return koishi_1.h.image(url).toString();
    }
}
exports.OpenClawWeixinAdapter = OpenClawWeixinAdapter;
//# sourceMappingURL=openclaw-weixin.js.map