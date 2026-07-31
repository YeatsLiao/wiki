# Prompt 评估体系：构建自动化测试集

如果不能衡量它，就不能改进它。
在传统的软件工程中，单元测试（Unit Test）是代码质量的保证。
在 Prompt Engineering 中，我们同样需要一套**评估体系 (Evals)**。
没有 Evals，任何 Prompt 的修改都是“盲改”。
也许改了这句，那个 Case 好了，但另外 10 个 Case 坏了（Regression）。

## 1. 评估的核心挑战

LLM 的输出是开放的（Open-ended）。
对于 "Write a poem about AI"，没有唯一的标准答案。
这就导致了评估的困难：
1.  **非确定性**：同样的 Prompt，每次输出都不一样。
2.  **主观性**：好坏取决于人的审美。
3.  **多维度**：准确性、流畅性、安全性、格式规范性。

## 2. 评估方法论：从规则到模型

### 2.1 基于规则 (Rule-based)
最简单，最客观。
*   **Exact Match (EM)**：完全匹配。适用于数学题、代码填空。
*   **Contains Keyword**：包含特定关键词。适用于 RAG 问答（必须包含原文实体）。
*   **JSON Schema Validation**：输出是否符合 JSON 格式。
*   **Length Check**：字数是否达标。

### 2.2 基于参考答案 (Reference-based)
即使没有唯一答案，如果有标准答案（Ground Truth），也可以计算相似度。
*   **Embedding Similarity**：计算生成文本与参考文本的向量余弦相似度（Cosine Similarity > 0.8）。
*   **ROUGE / BLEU**：传统的 NLP 指标（N-gram 重叠率）。虽然过时，但仍有参考价值。

### 2.3 基于模型 (Model-based / LLM-as-a-Judge)
让另一个更强的模型（如 GPT-4）来当裁判。
**Prompt**:
> "You are an expert judge. Here is a question, a reference answer, and a student answer.
> Rate the student answer from 1 to 5 based on accuracy and helpfulness.
> Explain your reasoning first."

这种方法被称为 **LLM-as-a-Judge**。
它虽然昂贵，但是最接近人类评估（Human Eval）。
常用框架：**G-Eval**, **Prometheus**, **JudgeLM**。

## 3. 构建 Golden Dataset (黄金数据集)

评估的前提是有数据。
你需要建立一个 **Golden Dataset**，包含高质量的 `(Input, Expected Output)` 对。

### 3.1 来源
1.  **人工编写**：最精准，但成本高。
2.  **生产日志挖掘**：从线上日志中挑选典型 Case，人工修正。
3.  **合成数据**：用 GPT-4 生成一批 Case，人工审核。

### 3.2 维护
Golden Dataset 是活的。
每当线上出现 Bad Case，都要第一时间加入 Dataset，防止以后再次出现（Regression Test）。

## 4. 工具链推荐

### 4.1 Ragas
专为 RAG 系统设计的评估框架。
*   **Context Precision**：检索到的文档是否相关？
*   **Context Recall**：是否遗漏了关键信息？
*   **Faithfulness**：回答是否忠实于原文？
*   **Answer Relevancy**：回答是否切题？

### 4.2 TruLens
记录每一次 LLM 调用的输入输出，并自动计算 Feedback Function（如 PII 检测、毒性检测）。
支持 Dashboard 可视化。

### 4.3 DeepEval
基于 PyTest 的 LLM 测试框架。
你可以像写单元测试一样写 Prompt 测试：
```python
from deepeval import assert_test
from deepeval.metrics import AnswerRelevancyMetric
from deepeval.test_case import LLMTestCase

def test_answer_relevancy():
    input = "What if these shoes don't fit?"
    actual_output = "We offer a 30-day full refund at no extra cost."
    metric = AnswerRelevancyMetric(threshold=0.7)
    test_case = LLMTestCase(input=input, actual_output=actual_output)
    assert_test(test_case, [metric])
```

Prompt Engineering 正在变成 **Prompt Programming**。
而 Evals 就是它的 **CI/CD**。
只有建立了完善的评估体系，我们才能在大模型的浪潮中，稳步前行，不断迭代，打造出真正可用的 AI 产品。
