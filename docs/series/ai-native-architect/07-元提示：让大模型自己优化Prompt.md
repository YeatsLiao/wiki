# 元提示：让大模型自己优化 Prompt

Prompt Engineering 是 AI 应用开发中的**玄学**。
你加了一句 "Let's think step by step"，效果变好了。
你换了一个词，效果变差了。
这就像在调参（Hyperparameter Tuning），但更不可控。
**元提示 (Meta-Prompting)** 的核心思想是：既然大模型这么聪明，为什么不让它自己来写 Prompt？

## 1. 架构原理：Prompt Optimization as a Search Problem

### 1.1 流程详解
1.  **初始 Prompt**：你写一个大概的意图（Baseline）。
2.  **生成变体 (Variations)**：让 LLM 根据这个意图，生成 5 个不同风格的 Prompt（更详细的、更简洁的、CoT 风格的）。
3.  **评估 (Evaluation)**：在一个测试集（Golden Dataset）上跑这 5 个 Prompt。
4.  **选择 (Selection)**：计算 Pass Rate，选出最好的一个。
5.  **迭代 (Iteration)**：把最好的那个作为种子，再生成 5 个变体，重复上述过程。

### 1.2 为什么有效？
*   **探索空间**：LLM 能够探索人类想不到的表达方式（如特定领域的术语、更精确的指令）。
*   **适应性**：针对特定任务（如 SQL 生成），LLM 可能会发现 "Explain the query first" 比直接写 SQL 效果更好。

## 2. 工程实现：DSPy / APE (Automatic Prompt Engineer)

### 2.1 APE (Automatic Prompt Engineer)
这是最早的 Meta-Prompting 框架之一。
*   **Generator**: 给定 Input/Output 对，让 LLM 生成 Instruction。
*   **Scorer**: 评估 Instruction 的质量（Likelihood 或 Accuracy）。
*   **Selector**: 选出 Top-1。

### 2.2 DSPy (Declarative Self-improving Python)
斯坦福团队推出的 DSPy 是目前最先进的框架。
它将 Prompt 视为**程序**，而不是字符串。
*   **Module**: 定义逻辑（ChainOfThought, Retrieve）。
*   **Signature**: 定义输入输出类型（Question -> Answer）。
*   **Optimizer (Teleprompter)**：这就是 Meta-Prompting 的核心。它会自动尝试不同的 Prompt 和 Few-Shot 例子，直到在验证集上达到最高分。

**代码示例**：
```python
import dspy

# 1. 定义任务
class QASignature(dspy.Signature):
    question = dspy.InputField()
    answer = dspy.OutputField()

# 2. 定义模块
class CoTQA(dspy.Module):
    def __init__(self):
        super().__init__()
        self.generate_answer = dspy.ChainOfThought(QASignature)

    def forward(self, question):
        return self.generate_answer(question=question)

# 3. 准备数据
trainset = [dspy.Example(question="...", answer="...").with_inputs('question'), ...]

# 4. 优化 (Compile)
from dspy.teleprompt import BootstrapFewShot

optimizer = BootstrapFewShot(metric=dspy.evaluate.answer_exact_match)
compiled_qa = optimizer.compile(CoTQA(), trainset=trainset)

# 5. 使用
result = compiled_qa(question="What is 2+2?")
print(result.answer)
```
在这个过程中，你完全没有写任何 Prompt 字符串！DSPy 自动帮你生成了最优的 Prompt。

## 3. 进阶策略：Self-Refine

除了搜索，还可以让模型自我反思。
*   **Critic**: 让另一个 LLM（或同一个）评价当前的 Prompt：“这个 Prompt 有什么问题？是不是太啰嗦了？是不是缺少边界条件？”
*   **Refine**: 根据评价，修改 Prompt。

### 3.1 架构图
`Initial Prompt` -> `LLM Output` -> `Evaluator (Score < 8)` -> `Critic (Feedback)` -> `Optimizer (New Prompt)` -> `LLM Output` ...

Meta-Prompting 是 Prompt Engineering 的终局。
就像编译器自动优化汇编代码一样，未来的 AI 工程师将不再需要手写 Prompt，而是编写**Prompt 生成器**和**评估器**。
掌握 DSPy 等工具，你将从“炼丹师”升级为“化学工程师”。
