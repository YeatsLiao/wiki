# GraphRAG 实战：知识图谱增强跨文档推理

如果你问 RAG 系统：“苹果公司发布了什么新产品？”它能很快从新闻里检索到 iPhone 15。
但如果你问：“乔布斯的朋友圈里，谁创办的公司后来被谷歌收购了？”
这种问题涉及多跳推理（Multi-hop Reasoning）：
1.  乔布斯的朋友有哪些？（Entity A, B, C）
2.  A 创办了什么公司？（Company X）
3.  Company X 被谷歌收购了吗？
传统的向量检索（Vector Search）很难处理这种跨文档、跨实体的复杂关系。
这就需要引入 **Knowledge Graph (知识图谱)**，构建 **GraphRAG**。

## 1. 什么是 GraphRAG？

GraphRAG 不是取代向量检索，而是增强它。
它利用 LLM 从非结构化文本中提取**实体 (Entities)** 和**关系 (Relationships)**，构建一个知识图谱。
当用户提问时，不仅检索相关的文本块（Chunk），还检索相关的实体子图（Sub-graph）。

## 2. 架构流程：从文本到图谱

### 2.1 索引阶段 (Indexing)
1.  **Text Chunking**：切分文档。
2.  **LLM Extraction**：让 LLM 提取实体和关系。
    *   Prompt: "Extract entities (Person, Org, Location) and relationships from the text."
    *   Output: `(Steve Jobs, FOUNDED, Apple)`, `(Google, ACQUIRED, DeepMind)`
3.  **Graph Construction**：将提取的三元组存入图数据库（Neo4j, NebulaGraph）。
4.  **Vector Indexing**：同时为每个实体生成 Embedding。

### 2.2 检索阶段 (Retrieval)
1.  **Entity Linking**：识别用户 Query 中的实体（"乔布斯", "谷歌"）。
2.  **Graph Traversal**：在图谱中从这些实体出发，跳 2-3 步（2-hop），找到所有关联实体。
3.  **Context Construction**：将检索到的子图转化为自然语言描述，作为 Context。
4.  **Generation**：喂给 LLM 生成答案。

## 3. 微软 GraphRAG 框架

微软最近开源了 GraphRAG，不仅包含图谱构建，还引入了**社区发现 (Community Detection)**。
它通过 Leiden 算法将图谱划分为多个社区（Community），并为每个社区生成摘要。
当用户问宏观问题（如“这批文档主要讲了什么？”）时，直接检索社区摘要，而不是具体的实体。

## 4. 工程实现：LangChain + Neo4j

LangChain 提供了 `GraphCypherQAChain`，可以把自然语言转成 Cypher 查询语句。

### 4.1 代码示例
```python
from langchain.chains import GraphCypherQAChain
from langchain.chat_models import ChatOpenAI
from langchain.graphs import Neo4jGraph

# 1. 连接图数据库
graph = Neo4jGraph(
    url="bolt://localhost:7687", 
    username="neo4j", 
    password="password"
)

# 2. 初始化 Chain
chain = GraphCypherQAChain.from_llm(
    ChatOpenAI(temperature=0), 
    graph=graph, 
    verbose=True
)

# 3. 提问
query = "Who are the friends of Steve Jobs that founded companies acquired by Google?"
result = chain.run(query)

# LangChain 会自动生成 Cypher:
# MATCH (p:Person)-[:FRIEND_OF]->(s:Person {name: "Steve Jobs"})
# MATCH (p)-[:FOUNDED]->(c:Company)
# MATCH (c)-[:ACQUIRED_BY]->(g:Company {name: "Google"})
# RETURN p.name, c.name
```

## 5. 挑战与展望

### 5.1 构建成本高
提取实体关系需要调用大量 LLM，成本高昂。
微软 GraphRAG 甚至建议用 GPT-4 来提取，因为小模型提取质量差。

### 5.2 图谱维护难
知识是动态的。如果“谷歌收购了 X”后来被辟谣了，如何更新图谱？

### 5.3 混合检索是未来
GraphRAG + VectorRAG = **HybridRAG**。
*   **Vector**：处理语义相似性。
*   **Graph**：处理结构化逻辑。
两者互补，才能解决真正复杂的 RAG 问题。
