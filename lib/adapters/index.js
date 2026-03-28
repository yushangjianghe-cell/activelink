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
exports.AdapterManager = void 0;
const base_1 = require("./base");
const onebot_1 = require("./onebot");
const openclaw_weixin_1 = require("./openclaw-weixin");
class AdapterManager {
    ctx;
    adapters = [];
    constructor(ctx) {
        this.ctx = ctx;
        this.adapters.push(new onebot_1.OneBotAdapter(ctx));
        this.adapters.push(new openclaw_weixin_1.OpenClawWeixinAdapter(ctx));
        this.adapters.push(new base_1.UniversalAdapter(ctx));
    }
    detectAdapter(session) {
        for (const adapter of this.adapters) {
            const info = adapter.detectAdapter(session);
            if (info) {
                return info;
            }
        }
        return {
            type: 'other',
            platform: session.platform || 'unknown',
            selfId: session.selfId
        };
    }
    getAdapter(type) {
        for (const adapter of this.adapters) {
            if (adapter.getAdapterType() === type) {
                return adapter;
            }
        }
        return this.adapters[this.adapters.length - 1];
    }
    createSession(target, content) {
        const adapter = this.getAdapter(target.adapter.type);
        return adapter.createSession(target, content);
    }
}
exports.AdapterManager = AdapterManager;
__exportStar(require("./base"), exports);
__exportStar(require("./onebot"), exports);
__exportStar(require("./openclaw-weixin"), exports);
//# sourceMappingURL=index.js.map