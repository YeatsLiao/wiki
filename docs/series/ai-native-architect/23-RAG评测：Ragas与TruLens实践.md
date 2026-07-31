# RAG 评测：Ragas 与 TruLens 实践

传统的 QA 系统评估很简单：
*   **Question**: "Who is the CEO of OpenAI?"
*   **Reference**: "Sam Altman."
*   **Model**: "Sam Altman." -> Pass.

但 RAG 不一样，它有中间过程（检索）。
如果检索错了，即使回答对了（靠幻觉），也是**不合格**的。
因为这说明 RAG 系统在“猜”。
我们需要一套能够深入到 RAG 内部的评估体系。

## 1. RAG 评估三要素 (RAG Triad)

TruLens 提出了著名的 RAG Triad：
1.  **Context Relevance**：检索到的 Context 和 Question 相关吗？（Precision）
2.  **Groundedness (Faithfulness)**：生成的 Answer 是基于 Context 的吗？（No Hallucination）
3.  **Answer Relevance**：生成的 Answer 回答了 Question 吗？（Utility）

## 2. Ragas (RAG Assessment)

Ragas 是目前最流行的开源评估框架。
它不需要参考答案（Reference-free），只需要 Question, Contexts, Answer。
利用 LLM-as-a-Judge 来打分。

### 2.1 核心指标
*   **Context Precision**：相关的 Context 排在第几位？（MRR）
*   **Context Recall**：是否召回了所有相关 Context？
*   **Faithfulness**：Answer 中的每句话，能否在 Context 中找到证据？
*   **Answer Relevancy**：Answer 是否切题？

### 2.2 代码示例
```python
from ragas import evaluate
from ragas.metrics import context_precision, faithfulness
from datasets import Dataset

# 1. 准备数据
data = {
    'question': ['Who won the 2022 World Cup?'],
    'answer': ['Argentina won against France.'],
    'contexts': [['The 2022 FIFA World Cup final was played... Argentina won on penalties.']],
    'ground_truth': ['Argentina']
}
dataset = Dataset.from_dict(data)

# 2. 评估
results = evaluate(
    dataset = dataset, 
    metrics=[
        context_precision,
        faithfulness,
    ],
)

# 3. 结果
print(results)
# {'context_precision': 0.9999, 'faithfulness': 0.9999}
```

## 3. TruLens Eval

TruLens 更偏向于**全链路监控 (Observability)**。
它记录每一次 RAG 调用的 Trace，并自动计算 Feedback Function。

### 3.1 Feedback Function
定义一个评估函数，如“检测毒性”、“检测 PII”、“检测相关性”。
TruLens 会自动调用 LLM 对每一条记录进行打分。

### 3.2 Dashboard
TruLens 自带一个 Web UI。
你可以看到：
*   所有请求的时间线。
*   每个请求的 Context Relevance 分数。
*   哪些请求分数低（Bad Case），方便排查。

## 4. DeepEval

DeepEval 更像是一个**单元测试框架**。
它可以集成到 CI/CD 流水线中。
每次代码提交，自动跑一遍 RAG 测试集。
如果 Pass Rate 低于阈值（如 0.8），这就阻止合并。

没有评估的 RAG 就是在裸奔。
不要等到上线后用户投诉“这是什么鬼回答”，才去查 Log。
从第一天起，就把 Ragas 或 TruLens 集成进你的开发流程。
建立一个 Golden Dataset，包含 50-100 个典型问题。
每次修改 Prompt 或更换 Embedding 模型，都跑一遍评估。
数据不会说谎。
