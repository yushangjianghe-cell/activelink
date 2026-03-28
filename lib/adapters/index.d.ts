import { Context, Session } from 'koishi';
import { BaseAdapter } from './base';
import { AdapterType, AdapterInfo, MessageTarget } from '../types';
export declare class AdapterManager {
    private ctx;
    private adapters;
    constructor(ctx: Context);
    detectAdapter(session: Session): AdapterInfo;
    getAdapter(type: AdapterType): BaseAdapter;
    createSession(target: MessageTarget, content: string): Session | null;
}
export * from './base';
export * from './onebot';
export * from './openclaw-weixin';
//# sourceMappingURL=index.d.ts.map