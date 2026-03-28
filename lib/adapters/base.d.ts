import { Context, Session } from 'koishi';
import { AdapterType, AdapterInfo, MessageTarget } from '../types';
export declare abstract class BaseAdapter {
    protected ctx: Context;
    protected logger: ReturnType<Context['logger']>;
    constructor(ctx: Context);
    abstract getAdapterType(): AdapterType;
    abstract detectAdapter(session: Session): AdapterInfo | null;
    abstract createSession(target: MessageTarget, content: string): Session | null;
    abstract formatMessageForAdapter(content: string): string;
    abstract supportsFeature(feature: string): boolean;
    protected findBotForPlatform(platform: string): any;
    protected findAnyBot(): any;
}
export declare class UniversalAdapter extends BaseAdapter {
    getAdapterType(): AdapterType;
    detectAdapter(session: Session): AdapterInfo | null;
    createSession(target: MessageTarget, content: string): Session | null;
    formatMessageForAdapter(content: string): string;
    supportsFeature(feature: string): boolean;
}
//# sourceMappingURL=base.d.ts.map