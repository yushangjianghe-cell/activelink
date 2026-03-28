import { Session } from 'koishi';
import { BaseAdapter } from './base';
import { AdapterType, AdapterInfo, MessageTarget } from '../types';
export declare class OneBotAdapter extends BaseAdapter {
    getAdapterType(): AdapterType;
    detectAdapter(session: Session): AdapterInfo | null;
    createSession(target: MessageTarget, content: string): Session | null;
    formatMessageForAdapter(content: string): string;
    supportsFeature(feature: string): boolean;
    formatAt(userId: string): string;
    formatReply(messageId: string): string;
    formatImage(url: string): string;
}
//# sourceMappingURL=onebot.d.ts.map