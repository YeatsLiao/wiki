# 查询重写：HyDE 与多查询分解

用户在搜索时，往往表达得很模糊、简短，或者词不达意。
*   用户搜："苹果" -> 他是指水果，还是公司？
*   用户搜："报错 500" -> 哪个服务报错？什么上下文？
如果直接拿原始 Query 去做向量检索，效果通常很差。
因为 Embedding 匹配依赖于**语义相似度**，而简短的问题和详细的答案在语义空间中可能距离很远。
**查询重写 (Query Rewriting)** 的目标，就是把用户的“烂问题”，变成机器能理解的“好问题”。

## 1. HyDE (Hypothetical Document Embeddings)

### 1.1 核心思想
HyDE 的逻辑非常反直觉：
**与其用问题去搜答案，不如先“编”一个答案，再用这个“假答案”去搜“真答案”。**
因为“假答案”和“真答案”在语义空间中是非常接近的（虽然内容可能是错的），这比“问题”和“真答案”的距离要近得多。

### 1.2 流程详解
1.  **Generate**: 用户提问 "How to fix OOM in Java?"。让 LLM 生成一个假设性的回答（Hypothetical Document）：“To fix OutOfMemoryError in Java, you should check heap dump, analyze memory leaks...”。
2.  **Encode**: 计算这个“假答案”的 Embedding。
3.  **Retrieve**: 用这个 Embedding 去向量库检索。
4.  **Generate**: 把检索到的真实文档喂给 LLM 生成最终回答。

### 1.3 优缺点
*   **优点**：大幅提升了 Zero-shot 检索效果，无需针对特定领域微调 Embedding 模型。
*   **缺点**：增加了一次 LLM 调用，延迟增加；如果 LLM 生成的假答案完全离谱（幻觉），会误导检索。

## 2. 多查询分解 (Multi-Query Expansion)

### 2.1 核心思想
用户的问题可能包含多个子问题，或者可以用多种方式表述。
与其只搜一次，不如**搜多次**，取并集。

### 2.2 Paraphrasing (改写)
让 LLM 生成 3-5 个不同措辞的 Query。
*   Original: "AI in healthcare"
*   Rewritten 1: "Applications of artificial intelligence in medical field"
*   Rewritten 2: "Machine learning for diagnosis and treatment"
*   Rewritten 3: "LLM use cases in hospitals"
分别检索，合并去重。这能提高**召回率 (Recall)**。

### 2.3 Decomposition (分解)
对于复杂问题，拆解为子问题。
*   Query: "Compare the revenue of Tesla and BYD in 2023."
*   Sub-query 1: "Tesla revenue 2023"
*   Sub-query 2: "BYD revenue 2023"
分别检索，分别获得答案，最后汇总。这种方法称为 **Least-to-Most Prompting** 在检索中的应用。

## 3. Step-Back Prompting (后退一步)

### 3.1 核心思想
有时候问题太具体，反而搜不到（Over-specificity）。
“后退一步”，问一个更抽象、更宏观的问题，往往能找到背景知识。

### 3.2 流程
1.  **Step Back**: 用户问 "Why did my PyTorch training fail with CUDA error 2?" -> LLM 生成抽象问题 "What are common causes of CUDA errors in PyTorch?"
2.  **Retrieve**: 分别检索原始问题和抽象问题的答案。
3.  **Generate**: 结合具体报错信息和通用背景知识，生成最终诊断。

## 4. 工程实现：LangChain 示例

LangChain 提供了 `MultiQueryRetriever`。
```python
from langchain.retrievers.multi_query import MultiQueryRetriever
from langchain.chat_models import ChatOpenAI

# 1. 定义 LLM
llm = ChatOpenAI(temperature=0)

# 2. 定义 Retriever
retriever = MultiQueryRetriever.from_llm(
    retriever=vectordb.as_retriever(),
    llm=llm
)

# 3. 使用
# 自动执行：生成变体 -> 并行检索 -> 结果去重
docs = retriever.get_relevant_documents("How does RAG work?")
```

Query Rewriting 是 RAG 系统中**ROI 最高**的优化手段之一。
它不需要重训模型，不需要重建索引，只需要改几行代码，调整一下 Prompt，就能显著提升检索质量。
记住：**不要相信用户的输入，要相信 LLM 的理解。**
