# 重排序：Cross-Encoder 作为 RAG 的精准过滤器

Embedding（向量）检索虽然快（ANN），但有一个致命弱点：它把复杂的语义压缩成了一个定长的向量（比如 768 维）。
在这个过程中，大量的细节丢失了。
所以，基于 Cosine Similarity 的检索结果（Top-K），往往不够精准。
Top-10 可能只有 Top-1 是相关的，其他 9 个都是噪音。
这些噪音如果直接喂给 LLM，会导致幻觉、忽略重点（Lost in the Middle），甚至增加成本。

**重排序 (Reranking)** 就是在粗排（Vector Search）之后，用一个更强的模型（Cross-Encoder），对 Top-K 结果进行**二次精排**。

## 1. Bi-Encoder vs Cross-Encoder

### 1.1 Bi-Encoder (Embedding Model)
我们平时用的 Sentence-Transformers 都是 Bi-Encoder。
*   **Query**: [Embedding]
*   **Doc**: [Embedding]
*   **Score**: Cosine(Query, Doc)
计算速度极快（点积），适合大规模检索（Top-100）。

### 1.2 Cross-Encoder (Reranker)
Cross-Encoder 把 Query 和 Doc **拼在一起**，作为一个整体输入给 BERT 模型。
*   **Input**: `[CLS] Query [SEP] Doc [SEP]`
*   **Output**: 一个分数（Score），表示两者的相关性。
由于模型能同时看到 Query 和 Doc 的所有 Token 交互（Full Attention），精度远高于 Bi-Encoder。
但计算量大，只适合对少量文档（Top-50）进行重排。

## 2. 架构模式：Retrieve-then-Rerank

RAG 标准流程：
1.  **Retrieve**: 使用 Vector Search（Bi-Encoder）从 100M 文档中召回 Top-50。
2.  **Rerank**: 使用 Cross-Encoder 对这 50 个文档进行打分。
3.  **Filter**: 取 Top-5 分数最高的文档。
4.  **Generate**: 把 Top-5 文档喂给 LLM。

这种架构兼顾了**速度**（Retrieve）和**精度**（Rerank）。

## 3. 开源 Reranker 选型

### 3.1 BGE-Reranker (BAAI)
目前开源界最强的 Reranker 之一。
*   `BAAI/bge-reranker-large`
*   `BAAI/bge-reranker-base`
多语言支持好，中文效果出色。

### 3.2 Cohere Rerank API
商业 API，效果极佳，且无需自己部署模型。
只需调用 `cohere.rerank(query, documents)` 即可。

### 3.3 Jina Reranker
支持超长上下文（8K Token）的 Reranker。
适合对长文档进行重排。

## 4. 实战代码：使用 Sentence-Transformers

```python
from sentence_transformers import CrossEncoder

# 1. 加载模型
model = CrossEncoder('cross-encoder/ms-marco-MiniLM-L-6-v2')

# 2. 准备数据
query = "How many people live in Berlin?"
documents = [
    "Berlin had a population of 3.5 million people.",
    "Berlin is well known for its museums.",
    "Germany has a population of 83 million."
]

# 3. 构造 Input Pairs
pairs = [[query, doc] for doc in documents]

# 4. 打分
scores = model.predict(pairs)

# 5. 排序
ranked_docs = sorted(zip(documents, scores), key=lambda x: x[1], reverse=True)

for doc, score in ranked_docs:
    print(f"{score:.4f}: {doc}")
```

## 5. 性能优化

虽然 Rerank 比 Retrieve 慢，但通常只需要几十毫秒（Top-50）。
如果对延迟极其敏感：
1.  **模型蒸馏**：用大模型（GPT-4）蒸馏一个小型的 Cross-Encoder。
2.  **量化**：使用 INT8 量化的 Reranker（ONNX Runtime）。
3.  **ColBERT**：一种介于 Bi-Encoder 和 Cross-Encoder 之间的 Late Interaction 架构，速度接近 Bi，精度接近 Cross。

Reranker 是 RAG 系统的**性价比之王**。
加上它，只需增加极少的延迟（< 50ms），就能让检索准确率（MRR@10）提升 10-20 个点。
它是连接粗糙检索与精准生成的**黄金桥梁**。
