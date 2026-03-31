import { Session } from 'koishi';
import { BaseAdapter } from './base';
import { AdapterType, AdapterInfo, MessageTarget } from '../types';
export declare class OpenClawWeixinAdapter extends BaseAdapter {
    getAdapterType(): AdapterType;
    detectAdapter(session: Session): AdapterInfo | null;
    createSession(target: MessageTarget, content: string): Session | null;
    sendMessage(target: MessageTarget, content: string, options?: any): Promise<string[]>;
    formatMessageForAdapter(content: string): string;
    supportsFeature(feature: string): boolean;
    formatImage(url: string): string;
}
//# sourceMappingURL=openclaw-weixin.d.ts.map