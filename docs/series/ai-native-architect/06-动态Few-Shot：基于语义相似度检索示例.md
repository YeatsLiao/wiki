# 动态 Few-Shot：基于语义相似度检索示例

在 Prompt Engineering 中，没有什么比 **Few-Shot Learning (少样本学习)** 更能显著提升模型效果了。
给 LLM 看几个例子（Input -> Output），它就能举一反三，学会新的任务格式、风格或逻辑。
然而，传统的 Few-Shot 是**静态的**（Static Few-Shot）：在 Prompt 中硬编码 3-5 个例子。
这有两个问题：
1.  **Token 限制**：例子太多放不下，例子太少覆盖不全。
2.  **相关性差**：对于不同的输入，固定的例子可能并不是最贴切的参考。

**动态 Few-Shot (Dynamic Few-Shot)** 解决了这个问题：根据用户的当前输入，动态检索最相似的例子放入 Prompt。

## 1. 架构原理：RAG for Prompts

Dynamic Few-Shot 本质上就是**针对 Prompt 的 RAG**。
我们将例子库（Example Store）视为知识库，将用户输入视为 Query。

### 1.1 流程详解
1.  **准备例子库**：收集 100+ 个高质量的 `(input, output)` 对。
2.  **向量化 (Embedding)**：计算所有 `input` 的向量，存入向量数据库（如 Chroma）。
3.  **用户查询**：计算用户当前 `input` 的向量。
4.  **相似度检索**：在向量库中查找 Top-K 最相似的例子（如 K=3）。
5.  **构建 Prompt**：将这 3 个例子插入 Prompt 模板，再拼接用户输入。
6.  **生成**：调用 LLM。

### 1.2 为什么有效？
*   **上下文相关性**：如果用户问 SQL 问题，检索到的例子也是 SQL 相关的；如果问 Python，例子也是 Python。
*   **Token 节省**：永远只放最相关的 3 个例子，而不是把整个库塞进去。

## 2. 工程实现：LangChain ExampleSelector

LangChain 提供了开箱即用的 `SemanticSimilarityExampleSelector`。

### 2.1 代码示例
```python
from langchain.prompts.example_selector import SemanticSimilarityExampleSelector
from langchain.vectorstores import Chroma
from langchain.embeddings import OpenAIEmbeddings
from langchain.prompts import FewShotPromptTemplate, PromptTemplate

# 1. 定义例子库
examples = [
    {"input": "happy", "output": "sad"},
    {"input": "tall", "output": "short"},
    {"input": "energetic", "output": "lethargic"},
    {"input": "sunny", "output": "gloomy"},
    {"input": "windy", "output": "calm"},
]

# 2. 创建 Selector
example_selector = SemanticSimilarityExampleSelector.from_examples(
    examples,
    OpenAIEmbeddings(),
    Chroma,
    k=1 # 只选 1 个最相似的
)

# 3. 定义 Prompt 模板
example_prompt = PromptTemplate(
    input_variables=["input", "output"],
    template="Input: {input}\nOutput: {output}",
)

prompt = FewShotPromptTemplate(
    example_selector=example_selector,
    example_prompt=example_prompt,
    prefix="Give the antonym of every input",
    suffix="Input: {adjective}\nOutput:",
    input_variables=["adjective"],
)

# 4. 测试
print(prompt.format(adjective="worried"))
# 检索到了 "happy" -> "sad" 吗？还是 "energetic" -> "lethargic"？
# "worried" 和 "happy" (情感) 比较接近，可能会选 "happy"。
```

## 3. 进阶策略：多样性与覆盖率

### 3.1 最大边际相关性 (MMR)
单纯用 Cosine Similarity 可能会选出 3 个非常相似的例子（冗余）。
使用 MMR (Maximal Marginal Relevance) 可以在保证相关性的同时，增加例子的**多样性**。
比如用户问“写代码”，MMR 可能会选一个 Python 例子，一个 Java 例子，一个 SQL 例子，而不是三个 Python 例子。

### 3.2 难例挖掘 (Hard Negative Mining)
在例子库中专门加入一些**易错题**（Hard Examples）和对应的正确解法。
当用户输入类似易错题时，检索出这些“坑”，提醒模型不要踩。

### 3.3 长度自适应
根据当前 Prompt 的剩余 Token 空间，动态调整 K 值（检索多少个例子）。
如果 Context 还有很大空间，检索 10 个；如果空间紧张，只检索 1 个最关键的。

Dynamic Few-Shot 是 Prompt Engineering 从“手艺活”走向“工程化”的关键一步。
它让 Prompt 变得**如影随形**，永远为当前任务提供最佳的上下文支持。
建立一个高质量、覆盖全面的**例子库 (Example Store)**，是每个 AI 团队的核心资产。
不要只收集数据，要收集**好的例子**。
