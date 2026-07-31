# 思维链变体：ToT 与 GoT 的工程实现

思维链（Chain of Thought, CoT）通过让模型逐步思考，显著提升了复杂推理能力。
但如果任务极其复杂（如写长篇小说、解数学难题、规划多步骤旅行），单线性的 CoT 往往会陷入局部最优解，或者走入死胡同。
我们需要更高级的推理结构：**树 (Tree)** 和 **图 (Graph)**。

## 1. CoT 的局限性

### 1.1 线性思维
CoT 只能从前向后生成（Autoregressive），无法回溯。
如果第一步错了，后面全错（Error Propagation）。

### 1.2 缺乏探索
对于有多种可能性的问题（如头脑风暴、路径规划），CoT 只给出一个解。
这就像下棋只看一步，而不考虑多种分支。

## 2. ToT (Tree of Thoughts)：思维之树

### 2.1 核心思想
ToT 将推理过程建模为一棵树：
*   **节点 (Thought)**：当前的中间状态（如小说的一个段落，数独的一行填法）。
*   **边 (Action)**：下一步可能的动作。
*   **评估 (Evaluation)**：给每个节点打分（Value Function），决定是否继续探索或剪枝。

### 2.2 搜索算法
有了树，就可以用经典的搜索算法：
*   **BFS (广度优先)**：每一步生成 K 个候选想法，保留分数最高的 M 个，进入下一步。
*   **DFS (深度优先)**：一直走到终点，如果不行就回溯。

### 2.3 工程实现：LangChain 示例
```python
# Thought Generator
prompt = "Generate 3 possible next steps for solving this equation..."
thoughts = llm.generate(prompt, n=3)

# Thought Evaluator (Self-Reflection)
scores = []
for thought in thoughts:
    score_prompt = f"Rate the feasibility of this step: {thought}. Output 0-10."
    score = float(llm.generate(score_prompt))
    scores.append(score)

# Selection (Pruning)
best_thoughts = [t for t, s in zip(thoughts, scores) if s > 7.0]

# Next Step
if best_thoughts:
    current_state = best_thoughts[0] # Greedy
else:
    current_state = backtrack() # Backtrack
```
ToT 让 LLM 学会了“三思而后行”。

## 3. GoT (Graph of Thoughts)：思维之图

### 3.1 核心思想
有些问题的解决过程不是树状的，而是网状的。
*   **聚合 (Aggregation)**：将多个想法合并为一个更好的想法。
*   **循环 (Loop)**：不断改进同一个想法。
*   **分支 (Branch)**：并行探索。

### 3.2 典型操作
1.  **Generate**: 生成多个初始想法。
2.  **Score**: 评估质量。
3.  **Aggregate**: 把 Top-3 的想法融合（比如写摘要，把三篇草稿合并）。
4.  **Refine**: 对融合后的结果进行润色。

### 3.3 架构优势
GoT 可以模拟人类的头脑风暴过程：发散 -> 收敛 -> 再发散 -> 再收敛。
这种结构特别适合创意写作、代码重构等任务。

## 4. 成本与延迟的考量

### 4.1 Token 消耗爆炸
ToT/GoT 需要生成大量中间思考过程（Thoughts），还要对每个 Thought 进行评估。
Token 消耗可能是 CoT 的 10 倍甚至 100 倍。

### 4.2 延迟不可忽视
搜索过程是串行的（虽然部分生成可以并行），导致最终结果产出很慢。
**适用场景**：离线任务（如数据分析报告生成）、高价值决策（如医疗诊断辅助），而不适合实时聊天。

从 CoT 到 ToT 再到 GoT，我们正在教 LLM 像人类一样**结构化思考**。
虽然目前的实现还比较“暴力”（Brute Force），但随着模型推理速度的提升和成本的下降（如 Groq, Cerebras），这种高级推理模式将成为解决复杂问题的标配。
未来的 Agent，不仅会思考，还会**画思维导图**。
