# Self-RAG 架构：按需检索与自我修正

传统的 RAG 架构是**静态**的：
1.  用户提问。
2.  无脑检索（无论问题是否需要检索）。
3.  无脑生成（无论检索结果是否相关）。
这种机制导致了两个问题：
1.  **资源浪费**：用户问 "你好"，RAG 也去向量库搜了一圈，还把搜到的垃圾信息喂给 LLM。
2.  **幻觉加剧**：如果检索回来的全是无关文档，LLM 被迫基于这些噪音生成，反而不如直接回答。

**Self-RAG (Self-Reflective RAG)** 引入了一种**自省机制 (Self-Reflection)**，让模型在生成的过程中，不断评估自己的需求和产出。

## 1. 核心思想：按需检索 (On-demand Retrieval)

Self-RAG 在训练时引入了特殊的**反思 Token (Reflection Tokens)**。
模型在生成过程中，会输出这些 Token 来控制流程：
*   **[Retrieve]**：我需要检索外部知识吗？（Yes/No/Continue）
*   **[IsRel]**：检索回来的这段文字相关吗？（Relevant/Irrelevant）
*   **[IsSup]**：生成的这句话有证据支持吗？（FullySupported/PartiallySupported/NoSupport）
*   **[IsUse]**：生成的这句话对用户有用吗？（Useful/NotUseful）

## 2. 推理流程详解

### 2.1 检索决策 (Retrieval Decision)
用户问 "What is the capital of France?"
模型生成：`[Retrieve] No` -> 直接回答 "Paris"。
用户问 "Who won the latest Super Bowl?"
模型生成：`[Retrieve] Yes` -> 触发检索。

### 2.2 相关性评估 (Relevance Check)
检索回 3 个文档。
模型对每个文档打分：
*   Doc 1: `[IsRel] Relevant`
*   Doc 2: `[IsRel] Irrelevant`
只保留 Doc 1。

### 2.3 生成与验证 (Generation & Critique)
基于 Doc 1 生成答案。
模型每生成一句话，就自我检查：
*   "The Chiefs won..." -> `[IsSup] FullySupported`
*   "...with a score of 100-0." -> `[IsSup] NoSupport` (幻觉，重写！)

## 3. 训练方法：Critic 模型

Self-RAG 的核心是一个经过指令微调（Instruction Tuning）的模型。
训练数据包含了大量 `(Input, Retrieval, Output, Reflection Tokens)` 的样本。
通过训练，模型学会了何时该检索，何时该引用，何时该闭嘴。

## 4. 工程实现：LangGraph / CRAG (Corrective RAG)

虽然训练一个 Self-RAG 模型成本很高，但我们可以用 **LangGraph** 实现类似的逻辑（Agentic RAG）。

### 4.1 状态机 (State Machine)
定义一个图：
*   **Start Node**: 接收问题。
*   **Grade Node**: 评估问题是否需要检索。
    *   If No -> **LLM Node** (直接回答)。
    *   If Yes -> **Retrieve Node**。
*   **Check Node**: 评估检索结果相关性。
    *   If Relevant -> **Generate Node**。
    *   If Irrelevant -> **Rewrite Query Node** (重写查询，重新检索)。
*   **Verify Node**: 评估生成结果是否有幻觉。
    *   If Hallucination -> **Regenerate Node**。

### 4.2 CRAG (Corrective RAG)
这是 Self-RAG 的简化版。
引入一个轻量级的 **Retrieval Evaluator**。
如果评估检索结果不可靠，它会触发**Web Search**（联网搜索）作为补充。

Self-RAG 标志着 RAG 从“流水线”走向了“智能体”。
它赋予了模型**元认知 (Metacognition)** 能力。
未来的 RAG 系统，不再是简单的 `Retrieve -> Generate`，而是一个复杂的、动态的、自我修正的**思考过程**。
它可能慢一点，但它更可靠。
