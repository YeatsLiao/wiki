# Agent 调试与监控：LangSmith 追踪思考过程与调用链

当 Agent 开始自主规划、调用工具、自我反思时，它内部发生的一切对我们来说就像个黑盒。
如果它卡住了，或者得出了错误结论，我们怎么知道问题出在哪里？
是 Prompt 写得不好？是工具报错了？还是 LLM 幻觉了？
这就需要一套强大的 **Tracing & Observability (追踪与可观测性)** 系统。
LangSmith 是目前最好的 Agent 调试平台。

## 1. 为什么 Agent 难调试？

### 1.1 非确定性
每次运行结果都不一样。
这就意味着传统的 Log 很难复现问题。

### 1.2 多步骤链式反应
一个简单的任务可能触发几十次 LLM 调用。
中间任何一步错了，都会导致最终结果错。

### 1.3 隐式状态
Agent 的 Memory 和 Scratchpad 是隐式的。
如果 Memory 撑爆了，或者 Scratchpad 里有脏数据，Agent 就会表现异常。

## 2. LangSmith 实战

### 2.1 Tracing (全链路追踪)
只要加一行代码 `os.environ["LANGCHAIN_TRACING_V2"] = "true"`。
LangSmith 就会自动记录每一次 LLM 调用、每一次 Tool 调用、每一次 Chain 执行。
你会看到一个清晰的**树状图**：
*   **Root Run**: 用户提问。
    *   **Child Run 1 (Planner)**: 生成计划。
    *   **Child Run 2 (Executor)**:
        *   **LLM Call**: 决定调用 Search。
        *   **Tool Call (Search)**: 返回结果。
        *   **LLM Call**: 总结结果。

### 2.2 Playground (在线调试)
当你发现某个 Prompt 效果不好时，直接点击 "Open in Playground"。
LangSmith 会把当时的 Input, System Prompt, History 全部加载进来。
你可以直接修改 Prompt，重新运行，看看效果是否改善。
改好了，再同步回代码库。

### 2.3 Dataset & Testing
当你修复了一个 Bug（比如 Prompt 没处理好空列表），你可以把这个 Case 加入 Dataset。
下次跑 CI/CD 时，自动验证这个 Case 是否通过。

## 3. 自定义 Callback (Custom Callbacks)

如果你不用 LangChain，也可以自己实现 Callback。
记录以下关键信息：
1.  **Input / Output**: 每次调用的输入输出。
2.  **Latency**: 耗时。
3.  **Token Usage**: 消耗多少 Token（算钱）。
4.  **Error**: 报错堆栈。

## 4. 最佳实践

### 4.1 给 Run 起个好名字
不要叫 "Chain"，叫 "SQLGeneratorChain"。
不要叫 "Tool"，叫 "GoogleSearchTool"。
在 LangSmith 列表里一眼就能看出来。

### 4.2 记录 Metadata
记录 `user_id`, `session_id`, `environment` (dev/prod)。
方便排查特定用户的问题。

### 4.3 告警 (Alerting)
如果错误率飙升，或者延迟超过阈值，发送 Slack 告警。

没有 Tracing 的 Agent 就是盲人骑瞎马。
LangSmith 让我们有了**上帝视角**。
不仅能看到 Agent 做了什么，还能看到它**想了什么**。
这就是 Debugging Agent 的正确姿势。
