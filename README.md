# koishi-plugin-activelink

为 ChatLuna 添加主动对话能力的 Koishi 插件，支持 OneBot 11 和 OpenClaw Weixin 适配器。参考了chatluna-spark和chatluna-proactive-trigger的功能以及代码！感谢！

## 功能特性

- **定时任务**: 在指定时间自动触发消息
- **节日问候**: 内置24节气、传统节日、现代节日、西方节日，支持自定义节日
- **主动聊天**: 长时间无对话时，AI 主动发起聊天
- **活跃度触发**: 根据群聊活跃度自动参与讨论
- **空闲触发**: 群聊或私聊空闲一段时间后自动发言
- **多适配器支持**: 支持 OneBot 11 和 OpenClaw Weixin

## 安装

```bash
npm install koishi-plugin-activelink
```

## 配置

### 基础配置

- `triggerTemplate`: 触发消息模板，`{content}` 会被替换为任务内容

### 作用域配置

- `mode`: 作用域模式（全部启用/白名单/黑名单）
- `list`: 频道列表，控制插件在哪些地方生效

### 定时任务

- `enabled`: 启用定时任务
- `tasks`: 定时任务列表
  - `name`: 任务名称
  - `time`: 触发时间（格式：HH:mm）
  - `prompt`: 提示词

### 节日问候

- `enabled`: 启用节日问候
- `promptTemplate`: 节日提示词模板，可用变量：`{festivalName}`、`{festivalDesc}`
- `defaultTime`: 默认触发时间
- `custom`: 自定义节日列表

### 主动聊天

- `enabled`: 启用主动聊天
- `checkInterval`: 检查间隔（分钟）
- `initialDelay`: 初始延迟（小时）
- `initialProbability`: 初始概率
- `probabilityIncrease`: 每次检查增加的概率
- `maxProbability`: 最大概率
- `sleepStart`: 休息开始时间
- `sleepEnd`: 休息结束时间
- `prompts`: 主动聊天提示词列表

### 活跃度/空闲触发

- `enabled`: 启用活跃度/空闲触发
- `applyDefaultGroupConfigs`: 应用默认配置的群号列表
- `applyDefaultPrivateConfigs`: 应用默认配置的私聊用户列表
- `groupConfigs`: 群聊配置
- `privateConfigs`: 私聊配置

## 命令

- `activelink.my` - 查看我的待执行任务
- `activelink.cancel <id>` - 取消指定任务
- `activelink.admin.tasks` - 查看所有任务（管理员）
- `activelink.admin.stats` - 查看统计信息（管理员）
- `activelink.admin.clean` - 清理已完成的任务（管理员）

## 依赖

- `koishi`: ^4.17.0
- `koishi-plugin-chatluna`: ^1.3.9
- `cron`: ^3.1.7

## 许可证

MIT
