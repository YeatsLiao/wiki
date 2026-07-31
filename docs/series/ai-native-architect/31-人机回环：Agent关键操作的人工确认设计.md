# 人机回环：Agent 关键操作的人工确认设计

Agent 再聪明，也有失控的时候。
如果一个 Agent 说：“我要删掉生产环境数据库了。”
你敢让它自动执行吗？
这就是 **Human-in-the-loop (HITL)** 的必要性。
在关键决策点，必须把控制权交还给人类。

## 1. 为什么需要 HITL？

### 1.1 安全性 (Safety)
防止 Agent 执行高危操作（rm -rf, delete database, transfer money）。
这是 Agent 落地的红线。

### 1.2 准确性 (Accuracy)
Agent 可能对需求理解有偏差。
让用户在中途确认一下理解是否正确，避免做无用功。

### 1.3 合规性 (Compliance)
有些操作必须有人类签字（如财务审批）。

## 2. 交互模式设计

### 2.1 阻塞式确认 (Blocking Confirmation)
Agent 暂停执行，等待用户输入 Yes/No。
*   **Prompt**: "I plan to delete user 'Alice'. Proceed? (y/n)"
*   **UI**: 弹出一个确认框。

### 2.2 修改式确认 (Editable Confirmation)
允许用户修改 Agent 的计划。
*   **Prompt**: "I plan to email: 'Hello Alice...'. Is this okay?"
*   **User**: "Change 'Hello' to 'Dear'."
*   **Agent**: "Updated. Sending now."

### 2.3 持续反馈 (Continuous Feedback)
Agent 每做一步，都输出 Observation。
用户随时可以插嘴：“停！别这么做。”（Interrupt）。

## 3. LangGraph 中的 HITL

LangGraph 完美支持 HITL。
你可以在图中插入一个 **Human Node**。
当流程走到这个节点时，它会暂停，并将状态（State）暴露给前端。
前端拿到状态后，展示给用户。
用户操作后，更新状态，并发送 **Resume** 信号，继续执行。

### 3.1 代码示例
```python
def human_review_node(state):
    # This node does nothing but wait for external input
    pass

workflow = StateGraph(AgentState)
workflow.add_node("agent", agent_node)
workflow.add_node("human", human_review_node)

# 定义条件边
workflow.add_conditional_edges(
    "agent",
    should_continue,
    {
        "continue": "action",
        "review": "human", # 需要审核
        "end": END
    }
)

# 编译
app = workflow.compile(interrupt_before=["human"]) # 在进入 human 节点前中断
```

## 4. 最佳实践

### 4.1 明确边界
哪些操作需要审核？哪些不需要？
*   **Read-only**: 不需要（查天气）。
*   **Write**: 需要（发邮件，改代码）。

### 4.2 提供上下文
让用户知道 Agent 为什么要这么做。
"因为上一步查询失败，所以我打算尝试这个新方法..."

### 4.3 超时处理
如果用户一直不理 Agent，怎么办？
*   **Timeout**: 自动取消任务。
*   **Retry**: 发送提醒。

HITL 不是对 Agent 的不信任，而是人机协作的最高境界。
它让 Agent 成为人类的**Copilot**，而不是 **Autopilot**。
只有当人类在环中，Agent 才能真正融入人类的工作流，成为可靠的伙伴。
