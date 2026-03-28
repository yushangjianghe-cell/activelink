"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskManager = void 0;
const types_1 = require("../types");
class TaskManager {
    ctx;
    constructor(ctx) {
        this.ctx = ctx;
    }
    async checkTaskCondition(task) {
        if (!task.condition) {
            return true;
        }
        const { condition } = task;
        switch (condition.type) {
            case 'user-idle':
                return this.checkUserIdleCondition(task, condition);
            case 'time-range':
                return this.checkTimeRangeCondition(condition);
            default:
                return true;
        }
    }
    async checkUserIdleCondition(task, condition) {
        if (!condition.duration) {
            return true;
        }
        const recentMessages = await this.ctx.database.get('chathub_message', {
            userId: task.userId,
            createdAt: { $gt: new Date(Date.now() - condition.duration * 1000) }
        });
        return recentMessages.length === 0;
    }
    checkTimeRangeCondition(condition) {
        const now = new Date();
        if (condition.startTime && now < condition.startTime) {
            return false;
        }
        if (condition.endTime && now > condition.endTime) {
            return false;
        }
        return true;
    }
    async cancelTask(taskId) {
        try {
            const tasks = await this.ctx.database.get('activelink_tasks', { id: taskId });
            if (tasks.length === 0) {
                return false;
            }
            if (tasks[0].status !== types_1.ActiveLinkTaskStatus.PENDING) {
                return false;
            }
            await this.ctx.database.set('activelink_tasks', taskId, {
                status: types_1.ActiveLinkTaskStatus.CANCELLED
            });
            this.ctx.emit('activelink/task-cancelled', taskId);
            return true;
        }
        catch (err) {
            this.ctx.logger('activelink').error('Failed to cancel task:', err);
            return false;
        }
    }
    async getPendingTasks() {
        return this.ctx.database.get('activelink_tasks', {
            status: types_1.ActiveLinkTaskStatus.PENDING
        });
    }
    async getTasksByUser(userId, channelId) {
        const query = { userId };
        if (channelId) {
            query.channelId = channelId;
        }
        return this.ctx.database.get('activelink_tasks', query);
    }
}
exports.TaskManager = TaskManager;
//# sourceMappingURL=task-manager.js.map