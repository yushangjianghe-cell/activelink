declare module 'koishi' {
    interface Events {
        'activelink/send-message'(channelId: string, message: string): void;
    }
}
export declare const activelink: {
    name: string;
    inherit: boolean;
    using: readonly [];
    apply(): void;
};
export default activelink;
export interface ActiveLinkConfig {
    triggerTemplate: string;
    scope: {
        channels: string[];
        users: string[];
    };
    scheduled: {
        enabled: boolean;
        cron: string;
        message: string;
    };
    festival: {
        enabled: boolean;
        greetings: Record<string, string>;
    };
    proactive: {
        enabled: boolean;
        interval: number;
        message: string;
    };
    activityIdle: {
        enabled: boolean;
        idleThreshold: number;
        message: string;
    };
}
//# sourceMappingURL=index.d.ts.map