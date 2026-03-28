"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScheduledTrigger = void 0;
const cron_1 = require("cron");
const scope_1 = require("../utils/scope");
const room_1 = require("../utils/room");
class ScheduledTrigger {
    ctx;
    config;
    service;
    scope;
    jobs = [];
    constructor(ctx, config, service, scope) {
        this.ctx = ctx;
        this.config = config;
        this.service = service;
        this.scope = scope;
    }
    start() {
        if (!this.config.enabled || !this.config.tasks || this.config.tasks.length === 0) {
            return;
        }
        for (const task of this.config.tasks) {
            this.scheduleTask(task);
        }
        this.ctx.logger('activelink').info(`Scheduled ${this.config.tasks.length} daily task(s)`);
    }
    stop() {
        for (const job of this.jobs) {
            job.stop();
        }
        this.jobs = [];
    }
    scheduleTask(task) {
        try {
            const [hour, minute] = task.time.split(':').map(s => s.trim());
            const cronExp = `${minute} ${hour} * * *`;
            const job = new cron_1.CronJob(cronExp, async () => {
                await this.triggerTask(task);
            }, null, false, 'Asia/Shanghai');
            job.start();
            this.jobs.push(job);
        }
        catch (err) {
            this.ctx.logger('activelink').error(`Failed to schedule ${task.name}:`, err);
        }
    }
    async triggerTask(task) {
        this.ctx.logger('activelink').info(`Running scheduled task: ${task.name}`);
        const rooms = await (0, room_1.getAllRooms)(this.ctx);
        if (rooms.length === 0) {
            return;
        }
        let successCount = 0;
        for (const roomInfo of rooms) {
            try {
                if (!(0, scope_1.isInScope)(roomInfo.channelId, this.scope)) {
                    continue;
                }
                const success = await this.service.chatExecutor.executeWithRoom(roomInfo.userId, roomInfo.channelId, task.prompt, roomInfo.room);
                if (success) {
                    successCount++;
                }
            }
            catch (err) {
                // 静默处理单个房间的错误
            }
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        this.ctx.logger('activelink').info(`Scheduled task "${task.name}" completed: ${successCount}/${rooms.length} rooms`);
    }
}
exports.ScheduledTrigger = ScheduledTrigger;
//# sourceMappingURL=scheduled.js.map