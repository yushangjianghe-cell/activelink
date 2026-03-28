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
            const session = bot.session({
                type: 'message',
                timestamp: Date.now(),
                selfId: bot.selfId,
                user: { id: target.userId || 'system' },
                channel: { id: target.channelId, type: 1 },
                content: this.formatMessageForAdapter(content)
            });
            return session;
        }
        catch (err) {
            this.logger.error('Failed to create OpenClaw Weixin session:', err);
            return null;
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