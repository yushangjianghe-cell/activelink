"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extendDatabase = extendDatabase;
exports.createActiveLinkTask = createActiveLinkTask;
const types_1 = require("./types");
function extendDatabase(ctx) {
    ctx.database.extend('activelink_tasks', {
        id: 'unsigned',
        userId: 'string',
        channelId: 'string',
        guildId: 'string',
        triggerTime: 'timestamp',
        type: 'string',
        content: 'text',
        status: 'string',
        cancelOn: 'list',
        condition: 'json',
        tags: 'list',
        metadata: 'json',
        roomId: 'unsigned',
        createdAt: 'timestamp'
    }, {
        autoInc: true
    });
}
async function createActiveLinkTask(ctx, data) {
    const now = new Date();
    const triggerTime = data.triggerTime instanceof Date ? data.triggerTime : new Date(data.triggerTime);
    const task = await ctx.database.create('activelink_tasks', {
        userId: data.userId,
        channelId: data.channelId,
        guildId: data.guildId,
        triggerTime,
        type: data.type || types_1.ActiveLinkTaskType.REMINDER,
        content: data.content,
        status: types_1.ActiveLinkTaskStatus.PENDING,
        cancelOn: data.cancelOn || [],
        condition: data.condition,
        tags: data.tags || [],
        metadata: {},
        roomId: data.roomId,
        createdAt: now
    });
    return task;
}
//# sourceMappingURL=database.js.map