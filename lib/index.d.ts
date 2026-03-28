import { Context, Schema } from 'koishi';
export declare const name = "activelink";
export declare const inject: {
    required: string[];
    optional: string[];
};
export declare const usage = "\n## ActiveLink\n\n\u4E3A ChatLuna \u6DFB\u52A0\u4E3B\u52A8\u5BF9\u8BDD\u80FD\u529B\uFF0C\u652F\u6301 OneBot 11 \u548C OpenClaw Weixin \u9002\u914D\u5668\u3002\n\n### \u529F\u80FD\u7279\u6027\n\n- **\u5B9A\u65F6\u4EFB\u52A1**: \u5728\u6307\u5B9A\u65F6\u95F4\u81EA\u52A8\u89E6\u53D1\u6D88\u606F\n- **\u8282\u65E5\u95EE\u5019**: \u5185\u7F6E24\u8282\u6C14\u3001\u4F20\u7EDF\u8282\u65E5\u3001\u73B0\u4EE3\u8282\u65E5\u3001\u897F\u65B9\u8282\u65E5\uFF0C\u652F\u6301\u81EA\u5B9A\u4E49\u8282\u65E5\n- **\u4E3B\u52A8\u804A\u5929**: \u957F\u65F6\u95F4\u65E0\u5BF9\u8BDD\u65F6\uFF0CAI \u4E3B\u52A8\u53D1\u8D77\u804A\u5929\n- **\u6D3B\u8DC3\u5EA6\u89E6\u53D1**: \u6839\u636E\u7FA4\u804A\u6D3B\u8DC3\u5EA6\u81EA\u52A8\u53C2\u4E0E\u8BA8\u8BBA\n- **\u7A7A\u95F2\u89E6\u53D1**: \u7FA4\u804A\u6216\u79C1\u804A\u7A7A\u95F2\u4E00\u6BB5\u65F6\u95F4\u540E\u81EA\u52A8\u53D1\u8A00\n- **\u591A\u9002\u914D\u5668\u652F\u6301**: \u652F\u6301 OneBot 11 \u548C OpenClaw Weixin\n\n### \u5FEB\u901F\u5F00\u59CB\n\n1. \u914D\u7F6E\u4F5C\u7528\u57DF\uFF08\u767D\u540D\u5355/\u9ED1\u540D\u5355\uFF09\u63A7\u5236\u63D2\u4EF6\u5728\u54EA\u4E9B\u5730\u65B9\u751F\u6548\n2. \u542F\u7528\u9700\u8981\u7684\u89E6\u53D1\u5668\u7C7B\u578B\n3. \u914D\u7F6E\u89E6\u53D1\u5668\u53C2\u6570\n\n### \u547D\u4EE4\n\n- activelink.my - \u67E5\u770B\u6211\u7684\u5F85\u6267\u884C\u4EFB\u52A1\n- activelink.cancel <id> - \u53D6\u6D88\u6307\u5B9A\u4EFB\u52A1\n- activelink.admin.tasks - \u67E5\u770B\u6240\u6709\u4EFB\u52A1\uFF08\u7BA1\u7406\u5458\uFF09\n- activelink.admin.stats - \u67E5\u770B\u7EDF\u8BA1\u4FE1\u606F\uFF08\u7BA1\u7406\u5458\uFF09\n- activelink.admin.clean - \u6E05\u7406\u5DF2\u5B8C\u6210\u7684\u4EFB\u52A1\uFF08\u7BA1\u7406\u5458\uFF09\n";
export declare const Config: Schema<Schemastery.ObjectS<{
    triggerTemplate: Schema<string, string>;
    scope: Schema<Schemastery.ObjectS<{
        mode: Schema<"全部启用" | "白名单" | "黑名单", "全部启用" | "白名单" | "黑名单">;
        list: Schema<({
            type?: "私聊" | "群聊" | null | undefined;
            id?: string | null | undefined;
        } & import("cosmokit").Dict)[], Schemastery.ObjectT<{
            type: Schema<"私聊" | "群聊", "私聊" | "群聊">;
            id: Schema<string, string>;
        }>[]>;
    }>, Schemastery.ObjectT<{
        mode: Schema<"全部启用" | "白名单" | "黑名单", "全部启用" | "白名单" | "黑名单">;
        list: Schema<({
            type?: "私聊" | "群聊" | null | undefined;
            id?: string | null | undefined;
        } & import("cosmokit").Dict)[], Schemastery.ObjectT<{
            type: Schema<"私聊" | "群聊", "私聊" | "群聊">;
            id: Schema<string, string>;
        }>[]>;
    }>>;
    scheduled: Schema<Schemastery.ObjectS<{
        enabled: Schema<boolean, boolean>;
        tasks: Schema<({
            name?: string | null | undefined;
            time?: string | null | undefined;
            prompt?: string | null | undefined;
        } & import("cosmokit").Dict)[], Schemastery.ObjectT<{
            name: Schema<string, string>;
            time: Schema<string, string>;
            prompt: Schema<string, string>;
        }>[]>;
    }>, Schemastery.ObjectT<{
        enabled: Schema<boolean, boolean>;
        tasks: Schema<({
            name?: string | null | undefined;
            time?: string | null | undefined;
            prompt?: string | null | undefined;
        } & import("cosmokit").Dict)[], Schemastery.ObjectT<{
            name: Schema<string, string>;
            time: Schema<string, string>;
            prompt: Schema<string, string>;
        }>[]>;
    }>>;
    festival: Schema<Schemastery.ObjectS<{
        enabled: Schema<boolean, boolean>;
        promptTemplate: Schema<string, string>;
        defaultTime: Schema<string, string>;
        custom: Schema<({
            name?: string | null | undefined;
            date?: string | null | undefined;
            time?: string | null | undefined;
            description?: string | null | undefined;
        } & import("cosmokit").Dict)[], Schemastery.ObjectT<{
            name: Schema<string, string>;
            date: Schema<string, string>;
            time: Schema<string, string>;
            description: Schema<string, string>;
        }>[]>;
    }>, Schemastery.ObjectT<{
        enabled: Schema<boolean, boolean>;
        promptTemplate: Schema<string, string>;
        defaultTime: Schema<string, string>;
        custom: Schema<({
            name?: string | null | undefined;
            date?: string | null | undefined;
            time?: string | null | undefined;
            description?: string | null | undefined;
        } & import("cosmokit").Dict)[], Schemastery.ObjectT<{
            name: Schema<string, string>;
            date: Schema<string, string>;
            time: Schema<string, string>;
            description: Schema<string, string>;
        }>[]>;
    }>>;
    proactive: Schema<Schemastery.ObjectS<{
        enabled: Schema<boolean, boolean>;
        checkInterval: Schema<number, number>;
        initialDelay: Schema<number, number>;
        initialProbability: Schema<number, number>;
        probabilityIncrease: Schema<number, number>;
        maxProbability: Schema<number, number>;
        sleepStart: Schema<string, string>;
        sleepEnd: Schema<string, string>;
        prompts: Schema<string[], string[]>;
    }>, Schemastery.ObjectT<{
        enabled: Schema<boolean, boolean>;
        checkInterval: Schema<number, number>;
        initialDelay: Schema<number, number>;
        initialProbability: Schema<number, number>;
        probabilityIncrease: Schema<number, number>;
        maxProbability: Schema<number, number>;
        sleepStart: Schema<string, string>;
        sleepEnd: Schema<string, string>;
        prompts: Schema<string[], string[]>;
    }>>;
    activityIdle: Schema<Schemastery.ObjectS<{
        enabled: Schema<boolean, boolean>;
        applyDefaultGroupConfigs: Schema<string[], string[]>;
        applyDefaultPrivateConfigs: Schema<string[], string[]>;
        groupConfigs: Schema<({
            guildId?: string | null | undefined;
            enableActivityTrigger?: boolean | null | undefined;
            activityLowerLimit?: number | null | undefined;
            activityUpperLimit?: number | null | undefined;
            activityMessageInterval?: number | null | undefined;
            enableQuoteReplyByMessageId?: boolean | null | undefined;
            activityPromptTemplate?: string | null | undefined;
            enableIdleTrigger?: boolean | null | undefined;
            idleIntervalMinutes?: number | null | undefined;
            idleEnableJitter?: boolean | null | undefined;
            idlePromptTemplate?: string | null | undefined;
            historyMessageLimit?: number | null | undefined;
            maxRequestImages?: number | null | undefined;
            cooldownSeconds?: number | null | undefined;
        } & import("cosmokit").Dict)[], Schemastery.ObjectT<{
            guildId: Schema<string, string>;
            enableActivityTrigger: Schema<boolean, boolean>;
            activityLowerLimit: Schema<number, number>;
            activityUpperLimit: Schema<number, number>;
            activityMessageInterval: Schema<number, number>;
            enableQuoteReplyByMessageId: Schema<boolean, boolean>;
            activityPromptTemplate: Schema<string, string>;
            enableIdleTrigger: Schema<boolean, boolean>;
            idleIntervalMinutes: Schema<number, number>;
            idleEnableJitter: Schema<boolean, boolean>;
            idlePromptTemplate: Schema<string, string>;
            historyMessageLimit: Schema<number, number>;
            maxRequestImages: Schema<number, number>;
            cooldownSeconds: Schema<number, number>;
        }>[]>;
        privateConfigs: Schema<({
            userId?: string | null | undefined;
            enableIdleTrigger?: boolean | null | undefined;
            idleIntervalMinutes?: number | null | undefined;
            idleEnableJitter?: boolean | null | undefined;
            idlePromptTemplate?: string | null | undefined;
            historyMessageLimit?: number | null | undefined;
            maxRequestImages?: number | null | undefined;
            cooldownSeconds?: number | null | undefined;
        } & import("cosmokit").Dict)[], Schemastery.ObjectT<{
            userId: Schema<string, string>;
            enableIdleTrigger: Schema<boolean, boolean>;
            idleIntervalMinutes: Schema<number, number>;
            idleEnableJitter: Schema<boolean, boolean>;
            idlePromptTemplate: Schema<string, string>;
            historyMessageLimit: Schema<number, number>;
            maxRequestImages: Schema<number, number>;
            cooldownSeconds: Schema<number, number>;
        }>[]>;
    }>, Schemastery.ObjectT<{
        enabled: Schema<boolean, boolean>;
        applyDefaultGroupConfigs: Schema<string[], string[]>;
        applyDefaultPrivateConfigs: Schema<string[], string[]>;
        groupConfigs: Schema<({
            guildId?: string | null | undefined;
            enableActivityTrigger?: boolean | null | undefined;
            activityLowerLimit?: number | null | undefined;
            activityUpperLimit?: number | null | undefined;
            activityMessageInterval?: number | null | undefined;
            enableQuoteReplyByMessageId?: boolean | null | undefined;
            activityPromptTemplate?: string | null | undefined;
            enableIdleTrigger?: boolean | null | undefined;
            idleIntervalMinutes?: number | null | undefined;
            idleEnableJitter?: boolean | null | undefined;
            idlePromptTemplate?: string | null | undefined;
            historyMessageLimit?: number | null | undefined;
            maxRequestImages?: number | null | undefined;
            cooldownSeconds?: number | null | undefined;
        } & import("cosmokit").Dict)[], Schemastery.ObjectT<{
            guildId: Schema<string, string>;
            enableActivityTrigger: Schema<boolean, boolean>;
            activityLowerLimit: Schema<number, number>;
            activityUpperLimit: Schema<number, number>;
            activityMessageInterval: Schema<number, number>;
            enableQuoteReplyByMessageId: Schema<boolean, boolean>;
            activityPromptTemplate: Schema<string, string>;
            enableIdleTrigger: Schema<boolean, boolean>;
            idleIntervalMinutes: Schema<number, number>;
            idleEnableJitter: Schema<boolean, boolean>;
            idlePromptTemplate: Schema<string, string>;
            historyMessageLimit: Schema<number, number>;
            maxRequestImages: Schema<number, number>;
            cooldownSeconds: Schema<number, number>;
        }>[]>;
        privateConfigs: Schema<({
            userId?: string | null | undefined;
            enableIdleTrigger?: boolean | null | undefined;
            idleIntervalMinutes?: number | null | undefined;
            idleEnableJitter?: boolean | null | undefined;
            idlePromptTemplate?: string | null | undefined;
            historyMessageLimit?: number | null | undefined;
            maxRequestImages?: number | null | undefined;
            cooldownSeconds?: number | null | undefined;
        } & import("cosmokit").Dict)[], Schemastery.ObjectT<{
            userId: Schema<string, string>;
            enableIdleTrigger: Schema<boolean, boolean>;
            idleIntervalMinutes: Schema<number, number>;
            idleEnableJitter: Schema<boolean, boolean>;
            idlePromptTemplate: Schema<string, string>;
            historyMessageLimit: Schema<number, number>;
            maxRequestImages: Schema<number, number>;
            cooldownSeconds: Schema<number, number>;
        }>[]>;
    }>>;
}>, Schemastery.ObjectT<{
    triggerTemplate: Schema<string, string>;
    scope: Schema<Schemastery.ObjectS<{
        mode: Schema<"全部启用" | "白名单" | "黑名单", "全部启用" | "白名单" | "黑名单">;
        list: Schema<({
            type?: "私聊" | "群聊" | null | undefined;
            id?: string | null | undefined;
        } & import("cosmokit").Dict)[], Schemastery.ObjectT<{
            type: Schema<"私聊" | "群聊", "私聊" | "群聊">;
            id: Schema<string, string>;
        }>[]>;
    }>, Schemastery.ObjectT<{
        mode: Schema<"全部启用" | "白名单" | "黑名单", "全部启用" | "白名单" | "黑名单">;
        list: Schema<({
            type?: "私聊" | "群聊" | null | undefined;
            id?: string | null | undefined;
        } & import("cosmokit").Dict)[], Schemastery.ObjectT<{
            type: Schema<"私聊" | "群聊", "私聊" | "群聊">;
            id: Schema<string, string>;
        }>[]>;
    }>>;
    scheduled: Schema<Schemastery.ObjectS<{
        enabled: Schema<boolean, boolean>;
        tasks: Schema<({
            name?: string | null | undefined;
            time?: string | null | undefined;
            prompt?: string | null | undefined;
        } & import("cosmokit").Dict)[], Schemastery.ObjectT<{
            name: Schema<string, string>;
            time: Schema<string, string>;
            prompt: Schema<string, string>;
        }>[]>;
    }>, Schemastery.ObjectT<{
        enabled: Schema<boolean, boolean>;
        tasks: Schema<({
            name?: string | null | undefined;
            time?: string | null | undefined;
            prompt?: string | null | undefined;
        } & import("cosmokit").Dict)[], Schemastery.ObjectT<{
            name: Schema<string, string>;
            time: Schema<string, string>;
            prompt: Schema<string, string>;
        }>[]>;
    }>>;
    festival: Schema<Schemastery.ObjectS<{
        enabled: Schema<boolean, boolean>;
        promptTemplate: Schema<string, string>;
        defaultTime: Schema<string, string>;
        custom: Schema<({
            name?: string | null | undefined;
            date?: string | null | undefined;
            time?: string | null | undefined;
            description?: string | null | undefined;
        } & import("cosmokit").Dict)[], Schemastery.ObjectT<{
            name: Schema<string, string>;
            date: Schema<string, string>;
            time: Schema<string, string>;
            description: Schema<string, string>;
        }>[]>;
    }>, Schemastery.ObjectT<{
        enabled: Schema<boolean, boolean>;
        promptTemplate: Schema<string, string>;
        defaultTime: Schema<string, string>;
        custom: Schema<({
            name?: string | null | undefined;
            date?: string | null | undefined;
            time?: string | null | undefined;
            description?: string | null | undefined;
        } & import("cosmokit").Dict)[], Schemastery.ObjectT<{
            name: Schema<string, string>;
            date: Schema<string, string>;
            time: Schema<string, string>;
            description: Schema<string, string>;
        }>[]>;
    }>>;
    proactive: Schema<Schemastery.ObjectS<{
        enabled: Schema<boolean, boolean>;
        checkInterval: Schema<number, number>;
        initialDelay: Schema<number, number>;
        initialProbability: Schema<number, number>;
        probabilityIncrease: Schema<number, number>;
        maxProbability: Schema<number, number>;
        sleepStart: Schema<string, string>;
        sleepEnd: Schema<string, string>;
        prompts: Schema<string[], string[]>;
    }>, Schemastery.ObjectT<{
        enabled: Schema<boolean, boolean>;
        checkInterval: Schema<number, number>;
        initialDelay: Schema<number, number>;
        initialProbability: Schema<number, number>;
        probabilityIncrease: Schema<number, number>;
        maxProbability: Schema<number, number>;
        sleepStart: Schema<string, string>;
        sleepEnd: Schema<string, string>;
        prompts: Schema<string[], string[]>;
    }>>;
    activityIdle: Schema<Schemastery.ObjectS<{
        enabled: Schema<boolean, boolean>;
        applyDefaultGroupConfigs: Schema<string[], string[]>;
        applyDefaultPrivateConfigs: Schema<string[], string[]>;
        groupConfigs: Schema<({
            guildId?: string | null | undefined;
            enableActivityTrigger?: boolean | null | undefined;
            activityLowerLimit?: number | null | undefined;
            activityUpperLimit?: number | null | undefined;
            activityMessageInterval?: number | null | undefined;
            enableQuoteReplyByMessageId?: boolean | null | undefined;
            activityPromptTemplate?: string | null | undefined;
            enableIdleTrigger?: boolean | null | undefined;
            idleIntervalMinutes?: number | null | undefined;
            idleEnableJitter?: boolean | null | undefined;
            idlePromptTemplate?: string | null | undefined;
            historyMessageLimit?: number | null | undefined;
            maxRequestImages?: number | null | undefined;
            cooldownSeconds?: number | null | undefined;
        } & import("cosmokit").Dict)[], Schemastery.ObjectT<{
            guildId: Schema<string, string>;
            enableActivityTrigger: Schema<boolean, boolean>;
            activityLowerLimit: Schema<number, number>;
            activityUpperLimit: Schema<number, number>;
            activityMessageInterval: Schema<number, number>;
            enableQuoteReplyByMessageId: Schema<boolean, boolean>;
            activityPromptTemplate: Schema<string, string>;
            enableIdleTrigger: Schema<boolean, boolean>;
            idleIntervalMinutes: Schema<number, number>;
            idleEnableJitter: Schema<boolean, boolean>;
            idlePromptTemplate: Schema<string, string>;
            historyMessageLimit: Schema<number, number>;
            maxRequestImages: Schema<number, number>;
            cooldownSeconds: Schema<number, number>;
        }>[]>;
        privateConfigs: Schema<({
            userId?: string | null | undefined;
            enableIdleTrigger?: boolean | null | undefined;
            idleIntervalMinutes?: number | null | undefined;
            idleEnableJitter?: boolean | null | undefined;
            idlePromptTemplate?: string | null | undefined;
            historyMessageLimit?: number | null | undefined;
            maxRequestImages?: number | null | undefined;
            cooldownSeconds?: number | null | undefined;
        } & import("cosmokit").Dict)[], Schemastery.ObjectT<{
            userId: Schema<string, string>;
            enableIdleTrigger: Schema<boolean, boolean>;
            idleIntervalMinutes: Schema<number, number>;
            idleEnableJitter: Schema<boolean, boolean>;
            idlePromptTemplate: Schema<string, string>;
            historyMessageLimit: Schema<number, number>;
            maxRequestImages: Schema<number, number>;
            cooldownSeconds: Schema<number, number>;
        }>[]>;
    }>, Schemastery.ObjectT<{
        enabled: Schema<boolean, boolean>;
        applyDefaultGroupConfigs: Schema<string[], string[]>;
        applyDefaultPrivateConfigs: Schema<string[], string[]>;
        groupConfigs: Schema<({
            guildId?: string | null | undefined;
            enableActivityTrigger?: boolean | null | undefined;
            activityLowerLimit?: number | null | undefined;
            activityUpperLimit?: number | null | undefined;
            activityMessageInterval?: number | null | undefined;
            enableQuoteReplyByMessageId?: boolean | null | undefined;
            activityPromptTemplate?: string | null | undefined;
            enableIdleTrigger?: boolean | null | undefined;
            idleIntervalMinutes?: number | null | undefined;
            idleEnableJitter?: boolean | null | undefined;
            idlePromptTemplate?: string | null | undefined;
            historyMessageLimit?: number | null | undefined;
            maxRequestImages?: number | null | undefined;
            cooldownSeconds?: number | null | undefined;
        } & import("cosmokit").Dict)[], Schemastery.ObjectT<{
            guildId: Schema<string, string>;
            enableActivityTrigger: Schema<boolean, boolean>;
            activityLowerLimit: Schema<number, number>;
            activityUpperLimit: Schema<number, number>;
            activityMessageInterval: Schema<number, number>;
            enableQuoteReplyByMessageId: Schema<boolean, boolean>;
            activityPromptTemplate: Schema<string, string>;
            enableIdleTrigger: Schema<boolean, boolean>;
            idleIntervalMinutes: Schema<number, number>;
            idleEnableJitter: Schema<boolean, boolean>;
            idlePromptTemplate: Schema<string, string>;
            historyMessageLimit: Schema<number, number>;
            maxRequestImages: Schema<number, number>;
            cooldownSeconds: Schema<number, number>;
        }>[]>;
        privateConfigs: Schema<({
            userId?: string | null | undefined;
            enableIdleTrigger?: boolean | null | undefined;
            idleIntervalMinutes?: number | null | undefined;
            idleEnableJitter?: boolean | null | undefined;
            idlePromptTemplate?: string | null | undefined;
            historyMessageLimit?: number | null | undefined;
            maxRequestImages?: number | null | undefined;
            cooldownSeconds?: number | null | undefined;
        } & import("cosmokit").Dict)[], Schemastery.ObjectT<{
            userId: Schema<string, string>;
            enableIdleTrigger: Schema<boolean, boolean>;
            idleIntervalMinutes: Schema<number, number>;
            idleEnableJitter: Schema<boolean, boolean>;
            idlePromptTemplate: Schema<string, string>;
            historyMessageLimit: Schema<number, number>;
            maxRequestImages: Schema<number, number>;
            cooldownSeconds: Schema<number, number>;
        }>[]>;
    }>>;
}>>;
export interface Config {
    triggerTemplate: string;
    scope: {
        mode: '全部启用' | '白名单' | '黑名单';
        list: {
            type: '私聊' | '群聊';
            id: string;
        }[];
    };
    scheduled: {
        enabled: boolean;
        tasks: {
            name: string;
            time: string;
            prompt: string;
        }[];
    };
    festival: {
        enabled: boolean;
        promptTemplate: string;
        defaultTime: string;
        custom: {
            name: string;
            date: string;
            time: string;
            description: string;
        }[];
    };
    proactive: {
        enabled: boolean;
        checkInterval: number;
        initialDelay: number;
        initialProbability: number;
        probabilityIncrease: number;
        maxProbability: number;
        sleepStart: string;
        sleepEnd: string;
        prompts: string[];
    };
    activityIdle: {
        enabled: boolean;
        applyDefaultGroupConfigs: string[];
        applyDefaultPrivateConfigs: string[];
        groupConfigs: {
            guildId: string;
            enableActivityTrigger: boolean;
            activityLowerLimit?: number;
            activityUpperLimit?: number;
            activityMessageInterval?: number;
            activityPromptTemplate?: string;
            enableIdleTrigger: boolean;
            idleIntervalMinutes?: number;
            idleEnableJitter?: boolean;
            idlePromptTemplate?: string;
            historyMessageLimit: number;
            maxRequestImages: number;
            enableQuoteReplyByMessageId: boolean;
            cooldownSeconds: number;
        }[];
        privateConfigs: {
            userId: string;
            enableIdleTrigger: boolean;
            idleIntervalMinutes?: number;
            idleEnableJitter?: boolean;
            idlePromptTemplate?: string;
            historyMessageLimit: number;
            maxRequestImages: number;
            cooldownSeconds: number;
        }[];
    };
}
export declare function apply(ctx: Context, config: Config): void;
//# sourceMappingURL=index.d.ts.map