# RAPTOR 索引：递归树状索引提升长文档全局理解

当你把一本小说切分成 500 个 Chunk 进行 RAG 时，你会发现一个问题：
*   用户问细节（"哈利波特哪一年出生？"） -> RAG 很准。
*   用户问宏观（"这本小说的核心主题是什么？"） -> RAG 很烂。
因为每个 Chunk 只有几百字，丢失了全局上下文。
模型就像在玩拼图，只看到了碎片，却看不到整幅画。
**RAPTOR (Recursive Abstractive Processing for Tree-Organized Retrieval)** 提出了一种递归的树状索引结构，专门解决长文档的全局理解问题。

## 1. 核心思想：Bottom-up Clustering & Summarization

### 1.1 聚类 (Clustering)
首先，将所有基础 Chunk（叶子节点）进行聚类。
比如把讲“魔法石”的 Chunk 聚在一起，把讲“伏地魔”的 Chunk 聚在一起。
使用 **Gaussian Mixture Models (GMM)** 或 **K-Means**。

### 1.2 摘要 (Summarization)
对每个聚类生成一个摘要（Summary）。
这个摘要代表了这个聚类的主题（Topic）。
摘要本身成为上一层节点。

### 1.3 递归 (Recursion)
对上一层的摘要再次聚类、再次摘要。
如此反复，直到根节点（Root Summary）。
这就形成了一棵树：
*   **Root**: 全书大纲。
*   **Level 1**: 各章节摘要。
*   **Level 2**: 各段落摘要。
*   **Leaf**: 原始文本 Chunk。

## 2. 检索机制：Tree Traversal

当用户提问时，RAPTOR 可以根据问题的抽象程度，在不同层级进行检索。

### 2.1 混合检索 (Collapsed Tree Retrieval)
这是 RAPTOR 论文推荐的方法。
将树的所有节点（包括摘要和原始 Chunk）都拉平，存入同一个向量库。
检索时，同时匹配宏观摘要和微观细节。
*   **Query**: "What is the main theme?" -> 匹配 Root Summary。
*   **Query**: "Who killed Dumbledore?" -> 匹配 Leaf Chunk。

### 2.2 树遍历 (Tree Traversal)
也可以像决策树一样逐层向下。
1.  **Level 0**: 检索最相关的 Level 1 节点。
2.  **Level 1**: 在该节点下的 Level 2 节点中继续检索。
这种方法更精准，但实现复杂。

## 3. 工程实现：LlamaIndex RAPTOR Pack

LlamaIndex 已经实现了 RAPTOR。

### 3.1 代码示例
```python
from llama_index.packs.raptor import RaptorPack

# 1. 初始化 RaptorPack
raptor_pack = RaptorPack(
    documents=documents, 
    llm=OpenAI(model="gpt-4"),
    embed_model=OpenAIEmbedding(),
    mode="collapsed" # 混合检索模式
)

# 2. 构建索引 (会自动聚类、摘要)
raptor_pack.run()

# 3. 检索
retriever = raptor_pack.retriever
nodes = retriever.retrieve("Explain the high-level impact of AI.")
```

## 4. 成本与性能分析

### 4.1 构建成本高
RAPTOR 需要调用大量 LLM 生成摘要。
对于 100K Token 的文档，可能需要额外生成 20K Token 的摘要。
构建时间较长。

### 4.2 检索效果显著
在 Q&A 任务上，尤其是涉及跨章节推理的问题，RAPTOR 的准确率比朴素 RAG 提升了 20% 以上。
它真正让 RAG 具备了**全局视野**。

RAPTOR 是长文档 RAG 的终极形态。
它模拟了人类阅读长文的过程：先读目录（Root），再读章节摘要（Level 1），最后读细节（Leaf）。
如果你在做法律文档分析、研报解读、书籍问答，RAPTOR 是必选项。
不要让你的 RAG 系统只做一个“断章取义”的傻瓜。
