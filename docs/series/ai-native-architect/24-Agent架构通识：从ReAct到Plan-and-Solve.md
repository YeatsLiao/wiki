# Agent 架构通识：从 ReAct 到 Plan-and-Solve

ChatGPT 刚出来时，它只是一个 Chatbot（聊天机器人）：你问一句，它答一句。
但我们很快发现，它有时候需要**使用工具**（比如计算器、搜索引擎）才能回答问题。
这就诞生了 **Agent (智能体)** 的概念：
**Agent = LLM + Memory + Planning + Tools**。
Agent 不仅仅是回答问题，而是**解决问题**。
它有自己的大脑（LLM），有记忆（Memory），有手脚（Tools），还有规划能力（Planning）。

## 1. ReAct (Reason + Act)

### 1.1 核心思想
ReAct 是最早也是最经典的 Agent 模式。
它的逻辑非常符合人类直觉：**思考 -> 行动 -> 观察**。
1.  **Thought**: 我应该做什么？
2.  **Action**: 调用某个工具。
3.  **Observation**: 看看工具返回了什么。
4.  **Loop**: 重复上述过程，直到得出最终答案。

### 1.2 示例
用户问：“姚明的老婆的身高是多少？”
*   **Thought 1**: 我需要先查姚明的老婆是谁。
*   **Action 1**: `Search("姚明 老婆")`
*   **Observation 1**: 返回 "叶莉"。
*   **Thought 2**: 现在我需要查叶莉的身高。
*   **Action 2**: `Search("叶莉 身高")`
*   **Observation 2**: 返回 "190cm"。
*   **Thought 3**: 我知道答案了。
*   **Final Answer**: 姚明的老婆叶莉身高是 190cm。

### 1.3 局限性
ReAct 是**单步决策**。
如果第一步走错了（比如搜成了“姚明的女儿”），后面就会一直错下去（Error Propagation）。
而且每次 Action 都要调用一次 LLM，Token 消耗大，延迟高。

## 2. Plan-and-Solve (规划与执行)

### 2.1 核心思想
与其像无头苍蝇一样一步步试，不如**先做个计划**。
Plan-and-Solve 将任务分为两个阶段：
1.  **Planner**: 生成一个完整的步骤清单（Step-by-step Plan）。
2.  **Solver**: 按照清单一步步执行。

### 2.2 示例
用户问：“比较一下 iPhone 15 和 华为 Mate 60 的价格和重量。”
*   **Planner**:
    1.  Search iPhone 15 price.
    2.  Search iPhone 15 weight.
    3.  Search Huawei Mate 60 price.
    4.  Search Huawei Mate 60 weight.
    5.  Compare and summarize.
*   **Solver**: 并行或串行执行上述 5 个步骤。

### 2.3 优势
*   **全局视野**：Planner 能看到整个任务的全貌，规划更优路径。
*   **并行执行**：步骤 1-4 可以同时执行，大幅降低延迟。

## 3. Reflexion (反思)

### 3.1 核心思想
人会犯错，Agent 也会。
Reflexion 引入了一个**自我反思**的环节。
如果 Agent 执行失败了，或者得出的答案看起来不对，它会停下来思考：“我哪里做错了？下次应该怎么改？”

### 3.2 流程
1.  **Trial**: 尝试执行任务。
2.  **Evaluation**: 评估结果（通过测试用例或自我评估）。
3.  **Reflection**: 如果失败，生成一段反思文本（"我刚才搜错了关键词..."）。
4.  **Next Trial**: 把反思文本加入 Context，重新尝试。

## 4. LATS (Language Agent Tree Search)

### 4.1 核心思想
结合了蒙特卡洛树搜索（MCTS）和 LLM。
它不像 ReAct 那样只走一条路，而是同时探索**多条路径**。
每走一步，都评估当前状态的价值。如果价值低，就回溯（Backtrack），换一条路走。
这是目前解复杂逻辑题（如 Math, Coding）的最强架构。

从 ReAct 到 Plan-and-Solve，再到 LATS，Agent 越来越像人类的思维模式：
*   **快思考 (System 1)**：ReAct（直觉反应）。
*   **慢思考 (System 2)**：Plan-and-Solve / LATS（深思熟虑）。
作为架构师，你需要根据任务的难度，选择合适的 Agent 模式。
简单的查天气，ReAct 足够了。
复杂的写代码，必须上 LATS。
