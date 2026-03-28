export interface ScopeConfig {
    mode: '全部启用' | '白名单' | '黑名单';
    list: {
        type: '私聊' | '群聊';
        id: string;
    }[];
}
export declare function isInScope(channelId: string, scope: ScopeConfig): boolean;
//# sourceMappingURL=scope.d.ts.map