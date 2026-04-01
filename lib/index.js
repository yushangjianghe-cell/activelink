"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Config = exports.usage = exports.inject = exports.name = void 0;
exports.apply = apply;
const koishi_1 = require("koishi");
const service_1 = require("./service");
const database_1 = require("./database");
const scheduled_1 = require("./triggers/scheduled");
const festival_1 = require("./triggers/festival");
const proactive_1 = require("./triggers/proactive");
const activity_idle_1 = require("./triggers/activity-idle");
const shared_1 = require("./utils/shared");
const types_1 = require("./types");
exports.name = 'activelink';
exports.inject = {
    required: ['database', 'chatluna'],
    optional: ['chatluna_character']
};
exports.usage = `
## ActiveLink

为 ChatLuna 添加主动对话能力，支持 OneBot 11 和 OpenClaw Weixin 适配器。

### 功能特性

- **定时任务**: 在指定时间自动触发消息
- **节日问候**: 内置24节气、传统节日、现代节日、西方节日，支持自定义节日
- **主动聊天**: 长时间无对话时，AI 主动发起聊天
- **活跃度触发**: 根据群聊活跃度自动参与讨论
- **空闲触发**: 群聊或私聊空闲一段时间后自动发言
- **多适配器支持**: 支持 OneBot 11 和 OpenClaw Weixin

### 快速开始

1. 配置作用域（白名单/黑名单）控制插件在哪些地方生效
2. 启用需要的触发器类型
3. 配置触发器参数

### 命令

- activelink.my - 查看我的待执行任务
- activelink.cancel <id> - 取消指定任务
- activelink.admin.tasks - 查看所有任务（管理员）
- activelink.admin.stats - 查看统计信息（管理员）
- activelink.admin.clean - 清理已完成的任务（管理员）
`;
// 配置 Schema
exports.Config = koishi_1.Schema.object({
    triggerTemplate: koishi_1.Schema.string()
        .role('textarea')
        .default('[系统提示：现在是提醒时间，请根据以下内容主动向用户发起对话] {content}')
        .description('触发消息模板。{content} 会被替换为任务内容'),
    verboseLogging: koishi_1.Schema.boolean()
        .default(false)
        .description('启用详细调试日志输出'),
    scope: koishi_1.Schema.object({
        mode: koishi_1.Schema.union(['全部启用', '白名单', '黑名单'])
            .default('全部启用')
            .description('作用域模式'),
        list: koishi_1.Schema.array(koishi_1.Schema.object({
            type: koishi_1.Schema.union(['私聊', '群聊'])
                .required()
                .description('类型'),
            id: koishi_1.Schema.string()
                .description('ID（留空表示该类型的所有频道）')
        }))
            .role('table')
            .default([])
            .description('频道列表')
    }).description('控制插件在哪些地方生效'),
    scheduled: koishi_1.Schema.object({
        enabled: koishi_1.Schema.boolean()
            .default(false)
            .description('启用定时任务'),
        tasks: koishi_1.Schema.array(koishi_1.Schema.object({
            name: koishi_1.Schema.string()
                .required()
                .description('任务名称'),
            time: koishi_1.Schema.string()
                .required()
                .description('触发时间（格式：HH:mm）'),
            prompt: koishi_1.Schema.string()
                .role('textarea')
                .required()
                .description('提示词')
        }))
            .role('table')
            .default([])
            .description('定时任务列表')
    }).description('定时任务配置'),
    festival: koishi_1.Schema.object({
        enabled: koishi_1.Schema.boolean()
            .default(true)
            .description('启用节日问候'),
        promptTemplate: koishi_1.Schema.string()
            .role('textarea')
            .default('今天是{festivalName}（{festivalDesc}），请向用户送上节日祝福。要符合你的人设，自然地表达。')
            .description('节日提示词模板'),
        defaultTime: koishi_1.Schema.string()
            .default('09:00')
            .description('默认触发时间'),
        custom: koishi_1.Schema.array(koishi_1.Schema.object({
            name: koishi_1.Schema.string()
                .required()
                .description('节日名称'),
            date: koishi_1.Schema.string()
                .required()
                .description('日期（格式：MM-DD）'),
            time: koishi_1.Schema.string()
                .default('09:00')
                .description('触发时间'),
            description: koishi_1.Schema.string()
                .required()
                .description('节日描述')
        }))
            .role('table')
            .default([])
            .description('自定义节日')
    }).description('节日问候配置'),
    proactive: koishi_1.Schema.object({
        enabled: koishi_1.Schema.boolean()
            .default(false)
            .description('启用主动聊天'),
        checkInterval: koishi_1.Schema.number()
            .default(15)
            .min(5)
            .max(60)
            .description('检查间隔（分钟）'),
        initialDelay: koishi_1.Schema.number()
            .default(2)
            .min(0.5)
            .max(24)
            .description('初始延迟（小时）'),
        initialProbability: koishi_1.Schema.number()
            .default(0.1)
            .min(0)
            .max(1)
            .step(0.05)
            .description('初始概率'),
        probabilityIncrease: koishi_1.Schema.number()
            .default(0.05)
            .min(0)
            .max(0.5)
            .step(0.01)
            .description('每次检查增加的概率'),
        maxProbability: koishi_1.Schema.number()
            .default(0.8)
            .min(0)
            .max(1)
            .step(0.05)
            .description('最大概率'),
        sleepStart: koishi_1.Schema.string()
            .default('23:00')
            .description('休息开始时间'),
        sleepEnd: koishi_1.Schema.string()
            .default('07:00')
            .description('休息结束时间'),
        prompts: koishi_1.Schema.array(koishi_1.Schema.string())
            .default(['主动来找用户聊天，可以分享一些有趣的事情或者关心一下用户'])
            .description('主动聊天提示词')
    }).description('主动聊天配置'),
    activityIdle: koishi_1.Schema.object({
        enabled: koishi_1.Schema.boolean()
            .default(false)
            .description('启用活跃度/空闲触发'),
        applyDefaultGroupConfigs: koishi_1.Schema.array(koishi_1.Schema.string())
            .default([])
            .description('应用默认配置的群号列表'),
        applyDefaultPrivateConfigs: koishi_1.Schema.array(koishi_1.Schema.string())
            .default([])
            .description('应用默认配置的私聊用户列表'),
        groupConfigs: koishi_1.Schema.array(koishi_1.Schema.object({
            guildId: koishi_1.Schema.string()
                .required()
                .description('群号（填写 "default" 作为默认配置模板）'),
            enableActivityTrigger: koishi_1.Schema.boolean()
                .default(false)
                .description('启用活跃度触发'),
            activityLowerLimit: koishi_1.Schema.number()
                .min(0).max(1).step(0.05)
                .default(0.85)
                .description('初始触发灵敏度'),
            activityUpperLimit: koishi_1.Schema.number()
                .min(0).max(1).step(0.05)
                .default(0.85)
                .description('灵敏度趋向值'),
            activityMessageInterval: koishi_1.Schema.number()
                .min(0).max(100)
                .default(20)
                .description('消息计数触发间隔'),
            enableQuoteReplyByMessageId: koishi_1.Schema.boolean()
                .default(false)
                .description('是否向历史消息中注入 message_id'),
            activityPromptTemplate: koishi_1.Schema.string()
                .role('textarea', { rows: [8, 20] })
                .description('活跃触发提示词模板')
                .default('你现在需要参与到活跃的群聊讨论中。\n当前时间：{date} {time}\n群聊名称：{group_name}\n\n以下是自上次你发言以来的群内消息：\n{history}\n\n十分重要！请注意：这些消息并非都在对你说话；优先回应明确提及或者讨论你的内容，否则以自然、简短、不突兀的方式选择一个你感兴趣的角度切入话题或适度评论。\n\n输出严格遵循以下规则:\n你将生成一个 \'<output>\' 标签包裹的回复.\'<output>\' 标签内必须包含一个或多个 \'<message>\' 标签,每个 \'<message>\' 代表一条独立发送的消息.\n严格遵循**以下定义的格式,所有回复内容都必须放入对应的标签内.**禁止**输出不存在的嵌套.\n\nSend nothing: <message></message>\nText with At function: <message><at id="user_id"> msg</message>\nText with Quote function: <message><quote id="message_id"/> msg</message>\nText message: <message>msg</message>\n\n注意事项: @和 msg 之间要用空格隔开.\n \'<output>\' 标签格式示例:\n\n<output>\n<message>嗯？</message>\n<message>怎么了</message>\n</output>\n\n你的最终输出**必须严格**遵循一个固定的标签序列.输出内容**必须**包含 \'<think>\' 和 \'<output>\' 并以 \'<think>\' 标签开始,到 \'<output>\' 标签结束.'),
            enableIdleTrigger: koishi_1.Schema.boolean()
                .default(false)
                .description('启用空闲触发'),
            idleIntervalMinutes: koishi_1.Schema.number()
                .min(1).max(60 * 24 * 7)
                .default(180)
                .description('空闲触发间隔（分钟）'),
            idleEnableJitter: koishi_1.Schema.boolean()
                .default(true)
                .description('启用随机抖动'),
            idlePromptTemplate: koishi_1.Schema.string()
                .role('textarea', { rows: [8, 20] })
                .description('空闲触发提示词模板')
                .default('你现在需要进行一次"空闲触发"的主动发言。\n当前时间：{date} {time}\n群聊名称：{group_name}\n已空闲分钟数：{idle_minutes}\n\n以下是自上次你发言以来的群内消息（可能包含图片）：\n{history}\n\n请你主动发起一个自然的话题，语气友好、简洁，不要显得机械。'),
            historyMessageLimit: koishi_1.Schema.number()
                .min(5).max(1000).default(20)
                .description('历史消息条数上限'),
            maxRequestImages: koishi_1.Schema.number()
                .min(0).max(20).default(3)
                .description('请求中的最大图片数量'),
            cooldownSeconds: koishi_1.Schema.number()
                .min(0).max(3600)
                .default(30)
                .description('触发后冷却时间（秒）'),
        }))
            .role('list')
            .default([])
            .description('群聊配置'),
        privateConfigs: koishi_1.Schema.array(koishi_1.Schema.object({
            userId: koishi_1.Schema.string()
                .required()
                .description('私聊用户 ID（填写 "default" 作为默认配置模板）'),
            enableIdleTrigger: koishi_1.Schema.boolean()
                .default(false)
                .description('启用空闲触发'),
            idleIntervalMinutes: koishi_1.Schema.number()
                .min(1).max(60 * 24 * 7)
                .default(180)
                .description('空闲触发间隔（分钟）'),
            idleEnableJitter: koishi_1.Schema.boolean()
                .default(true)
                .description('启用随机抖动'),
            idlePromptTemplate: koishi_1.Schema.string()
                .role('textarea', { rows: [8, 20] })
                .description('空闲触发提示词模板')
                .default('你现在需要进行一次"空闲触发"的主动发言。\n当前时间：{date} {time}\n已空闲分钟数：{idle_minutes}\n\n请你主动发起一个自然的话题，语气友好、简洁，不要显得机械。'),
            historyMessageLimit: koishi_1.Schema.number()
                .min(5).max(1000).default(20)
                .description('历史消息条数上限'),
            maxRequestImages: koishi_1.Schema.number()
                .min(0).max(20).default(3)
                .description('请求中的最大图片数量'),
            cooldownSeconds: koishi_1.Schema.number()
                .min(0).max(3600)
                .default(30)
                .description('触发后冷却时间（秒）'),
        }))
            .role('list')
            .default([])
            .description('私聊配置'),
    }).description('活跃度/空闲触发配置'),
});
// ==================== 插件主函数 ====================
function apply(ctx, config) {
    const logger = ctx.logger('activelink');
    // 1. 扩展数据库
    (0, database_1.extendDatabase)(ctx);
    // 2. 初始化用户追踪
    (0, shared_1.initUserTracking)(ctx);
    // 3. 创建 ActiveLink 服务
    const activeLinkService = new service_1.ActiveLinkService(ctx, config);
    ctx.plugin(() => activeLinkService);
    // 4. 启动定时任务
    let scheduledTrigger = null;
    if (config.scheduled?.enabled) {
        scheduledTrigger = new scheduled_1.ScheduledTrigger(ctx, config.scheduled, activeLinkService, config.scope);
        scheduledTrigger.start();
        ctx.on('dispose', () => {
            scheduledTrigger?.stop();
        });
    }
    // 5. 启动节日问候
    let festivalTrigger = null;
    if (config.festival?.enabled) {
        festivalTrigger = new festival_1.FestivalTrigger(ctx, config.festival, activeLinkService, config.scope);
        festivalTrigger.start();
        ctx.on('dispose', () => {
            festivalTrigger?.stop();
        });
    }
    // 6. 启动主动聊天
    let proactiveTrigger = null;
    if (config.proactive?.enabled) {
        proactiveTrigger = new proactive_1.ProactiveTrigger(ctx, config.proactive, activeLinkService, config.scope);
        proactiveTrigger.start();
        ctx.on('dispose', () => {
            proactiveTrigger?.stop();
        });
    }
    // 7. 启动活跃度/空闲触发
    let activityIdleTrigger = null;
    if (config.activityIdle?.enabled) {
        activityIdleTrigger = new activity_idle_1.ActivityIdleTrigger(ctx, config, activeLinkService);
        activityIdleTrigger.start();
        ctx.on('dispose', () => {
            activityIdleTrigger?.stop();
        });
    }
    logger.info('ActiveLink plugin loaded');
    // ==================== 用户命令 ====================
    ctx.command('activelink.my', '查看我的待执行任务')
        .userFields(['authority'])
        .action(async ({ session }) => {
        if (!session)
            return '会话不存在';
        const channelId = session.channelId || '';
        const userId = (0, shared_1.extractRealUserId)(session.userId || '', channelId);
        const tasks = await ctx.database.get('activelink_tasks', {
            userId,
            $or: [
                { channelId },
                { channelId: session.guildId || '' }
            ],
            status: types_1.ActiveLinkTaskStatus.PENDING
        });
        if (tasks.length === 0) {
            return '你暂无待执行任务';
        }
        let message = `你的待执行任务 (${tasks.length})\n\n`;
        tasks.forEach((task, i) => {
            const tags = task.tags?.length ? ` [${task.tags.join(', ')}]` : '';
            message += `${i + 1}. [ID:${task.id}]${tags} ${(0, shared_1.formatRelativeTime)(new Date(task.triggerTime))}\n   ${task.content}\n\n`;
        });
        return message.trim();
    });
    ctx.command('activelink.cancel <id:number>', '取消指定任务')
        .userFields(['authority'])
        .usage('取消指定 ID 的任务\n示例：activelink.cancel 42')
        .action(async ({ session }, id) => {
        if (!session)
            return '会话不存在';
        if (!id) {
            return '请指定任务 ID\n使用 activelink.my 查看任务列表';
        }
        const tasks = await ctx.database.get('activelink_tasks', { id });
        if (tasks.length === 0) {
            return `任务 [${id}] 不存在`;
        }
        if (tasks[0].status !== types_1.ActiveLinkTaskStatus.PENDING) {
            return `任务 [${id}] 已经${tasks[0].status === types_1.ActiveLinkTaskStatus.EXECUTED ? '执行' : tasks[0].status === types_1.ActiveLinkTaskStatus.CANCELLED ? '取消' : '失败'}，无法取消`;
        }
        const userId = (0, shared_1.extractRealUserId)(session.userId || '', session.channelId || '');
        const isAdmin = session.user && session.user.authority >= 4;
        if (tasks[0].userId !== userId && !isAdmin) {
            return '无法取消其他用户的任务';
        }
        const success = await activeLinkService.cancelTask(id);
        if (success) {
            return `任务 [${id}] 已取消`;
        }
        else {
            return `任务 [${id}] 取消失败`;
        }
    });
    // ==================== 管理员命令 ====================
    ctx.command('activelink.admin.tasks', '查看所有任务（管理员）')
        .userFields(['authority'])
        .action(async ({ session }) => {
        if (!session || !session.user || session.user.authority < 4) {
            return '权限不足';
        }
        const tasks = await ctx.database.get('activelink_tasks', {
            status: types_1.ActiveLinkTaskStatus.PENDING
        });
        if (tasks.length === 0) {
            return '暂无待执行任务';
        }
        let message = `所有待执行任务 (${tasks.length})\n\n`;
        tasks.slice(0, 20).forEach((task, i) => {
            const time = new Date(task.triggerTime);
            const timeStr = `${time.getMonth() + 1}/${time.getDate()} ${time.getHours()}:${time.getMinutes().toString().padStart(2, '0')}`;
            message += `${i + 1}. [ID:${task.id}] ${timeStr}\n   用户: ${task.userId}\n   ${task.content.slice(0, 30)}...\n\n`;
        });
        if (tasks.length > 20) {
            message += `... 还有 ${tasks.length - 20} 条任务`;
        }
        return message.trim();
    });
    ctx.command('activelink.admin.stats', '查看统计信息（管理员）')
        .userFields(['authority'])
        .action(async ({ session }) => {
        if (!session || !session.user || session.user.authority < 4) {
            return '权限不足';
        }
        const allTasks = await ctx.database.get('activelink_tasks', {});
        const stats = {
            pending: 0,
            executed: 0,
            cancelled: 0,
            failed: 0,
            byType: {}
        };
        for (const task of allTasks) {
            switch (task.status) {
                case types_1.ActiveLinkTaskStatus.PENDING:
                    stats.pending++;
                    break;
                case types_1.ActiveLinkTaskStatus.EXECUTED:
                    stats.executed++;
                    break;
                case types_1.ActiveLinkTaskStatus.CANCELLED:
                    stats.cancelled++;
                    break;
                case types_1.ActiveLinkTaskStatus.FAILED:
                    stats.failed++;
                    break;
            }
            stats.byType[task.type] = (stats.byType[task.type] || 0) + 1;
        }
        let message = `任务统计\n\n`;
        message += `待执行: ${stats.pending}\n`;
        message += `已执行: ${stats.executed}\n`;
        message += `已取消: ${stats.cancelled}\n`;
        message += `失败: ${stats.failed}\n\n`;
        message += `按类型:\n`;
        for (const [type, count] of Object.entries(stats.byType)) {
            message += `- ${type}: ${count}\n`;
        }
        return message.trim();
    });
    ctx.command('activelink.admin.clean', '清理已完成的任务（管理员）')
        .userFields(['authority'])
        .action(async ({ session }) => {
        if (!session || !session.user || session.user.authority < 4) {
            return '权限不足';
        }
        const result = await ctx.database.remove('activelink_tasks', {
            $or: [
                { status: types_1.ActiveLinkTaskStatus.EXECUTED },
                { status: types_1.ActiveLinkTaskStatus.CANCELLED },
                { status: types_1.ActiveLinkTaskStatus.FAILED }
            ]
        });
        return `已清理 ${result.matched} 条任务记录`;
    });
    ctx.command('activelink.admin.proactive [channelId:string]', '强制触发一次主动消息（管理员）')
        .userFields(['authority'])
        .usage('可选指定频道 ID，仅触发该频道\n示例：activelink.admin.proactive private:123456')
        .action(async ({ session }, channelId) => {
        if (!session || !session.user || session.user.authority < 4) {
            return '权限不足';
        }
        if (!proactiveTrigger) {
            return '主动消息功能未启用';
        }
        const targetChannelId = channelId?.trim() || undefined;
        const result = await proactiveTrigger.forceTriggerOnce(targetChannelId);
        if (targetChannelId && result.success === 0 && result.failed >= 1) {
            return `主动消息强制触发完成：频道 [${targetChannelId}] 未找到或不在作用域`;
        }
        const label = targetChannelId ? `频道 [${targetChannelId}]` : '全部频道';
        return `主动消息强制触发完成：${label} 成功 ${result.success} 个，失败 ${result.failed} 个`;
    });
}
//# sourceMappingURL=index.js.map