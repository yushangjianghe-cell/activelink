"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskConditionType = exports.CancelEvent = exports.ActiveLinkTaskStatus = exports.ActiveLinkTaskType = void 0;
// ==================== 任务相关类型 ====================
var ActiveLinkTaskType;
(function (ActiveLinkTaskType) {
    ActiveLinkTaskType["REMINDER"] = "reminder";
    ActiveLinkTaskType["FOLLOW_UP"] = "follow-up";
    ActiveLinkTaskType["MEMO"] = "memo";
    ActiveLinkTaskType["SCHEDULED"] = "scheduled";
    ActiveLinkTaskType["FESTIVAL"] = "festival";
    ActiveLinkTaskType["ACTIVITY"] = "activity";
    ActiveLinkTaskType["IDLE"] = "idle";
})(ActiveLinkTaskType || (exports.ActiveLinkTaskType = ActiveLinkTaskType = {}));
var ActiveLinkTaskStatus;
(function (ActiveLinkTaskStatus) {
    ActiveLinkTaskStatus["PENDING"] = "pending";
    ActiveLinkTaskStatus["EXECUTED"] = "executed";
    ActiveLinkTaskStatus["CANCELLED"] = "cancelled";
    ActiveLinkTaskStatus["FAILED"] = "failed";
})(ActiveLinkTaskStatus || (exports.ActiveLinkTaskStatus = ActiveLinkTaskStatus = {}));
var CancelEvent;
(function (CancelEvent) {
    CancelEvent["USER_MESSAGE"] = "user-message";
    CancelEvent["TASK_COMPLETED"] = "task-completed";
    CancelEvent["MANUAL"] = "manual";
})(CancelEvent || (exports.CancelEvent = CancelEvent = {}));
var TaskConditionType;
(function (TaskConditionType) {
    TaskConditionType["USER_IDLE"] = "user-idle";
    TaskConditionType["TIME_RANGE"] = "time-range";
    TaskConditionType["CUSTOM"] = "custom";
})(TaskConditionType || (exports.TaskConditionType = TaskConditionType = {}));
//# sourceMappingURL=types.js.map