# 多模态 RAG：索引 PDF 中的表格、图表与图片

企业知识库中 80% 的信息存在于 PDF、PPT、Excel 等非结构化文档中。
传统的 RAG 系统往往忽略了这些文档中的图片、表格。
你问：“这个季度的营收是多少？”RAG 找不到，因为答案在一个 Excel 截图里。
这部分信息被称为 **Dark Data (暗数据)**。
**Multimodal RAG (多模态 RAG)** 的使命，就是点亮这些暗物质。

## 1. 核心挑战：非文本数据的解析与索引

### 1.1 表格解析 (Table Parsing)
表格是最难处理的。
简单的 OCR 会把表格变成一堆乱码。
*   **Structure Extraction**: 必须识别出行、列、表头。
*   **Markdown Conversion**: 将表格转为 Markdown 格式，便于 LLM 理解。
*   **工具**: **LlamaParse**, **Unstructured**, **Nougat**。

### 1.2 图片解析 (Image Parsing)
图片包含丰富的信息。
*   **Captioning**: 使用 GPT-4V 生成图片的详细描述（Caption）。
*   **OCR**: 提取图片中的文字。
*   **Embedding**: 使用 CLIP 将图片本身转化为向量。

## 2. 架构模式一：多路召回 (Multi-Vector Retriever)

### 2.1 文本路
对 PDF 中的正文文本，按常规切片、Embedding、索引。

### 2.2 图片路
对每一张图片：
1.  生成 Summary (by GPT-4V): "A bar chart showing revenue growth in Q1."
2.  计算 Summary 的 Embedding。
3.  存储 `(Summary Embedding, Image Base64)` 对。

### 2.3 检索与生成
用户提问 "Revenue growth"。
1.  检索到文本 Chunk。
2.  检索到图片 Summary -> 找到对应的 Image Base64。
3.  把文本 Chunk 和 Image Base64 一起喂给 GPT-4V 生成答案。

## 3. 架构模式二：ColPali (ColBERT + PaliGemma)

这是最新的多模态检索模型。
它不需要复杂的 OCR，不需要把图片转成文字。
它直接对**页面截图 (Page Screenshot)** 进行 Embedding。

### 3.1 page-level embedding
把 PDF 的每一页截图，作为一张图片。
使用 ColPali 模型计算这张截图的 Embedding（包含视觉特征和文本特征）。

### 3.2 检索流程
用户提问（文本） -> ColPali 计算 Query Embedding -> 在页面截图库中检索最相关的截图。
找到截图后，直接把整页截图喂给 VLM (Visual Language Model) 回答问题。

## 4. 工程实现：LlamaIndex Multimodal

### 4.1 代码示例
```python
from llama_index.multi_modal_llms.openai import OpenAIMultiModal
from llama_index import SimpleDirectoryReader, VectorStoreIndex

# 1. 加载文档（包含图片）
documents = SimpleDirectoryReader("./data").load_data()

# 2. 构建多模态索引
index = VectorStoreIndex.from_documents(
    documents,
    image_vector_store=image_store,
    embed_model=ClipEmbedding()
)

# 3. 检索
retriever = index.as_retriever(image_similarity_top_k=2)
nodes = retriever.retrieve("Show me the revenue chart.")

# 4. 生成
response = OpenAIMultiModal(model="gpt-4-vision-preview").complete(
    prompt="Explain this chart.",
    image_documents=[n for n in nodes if n.metadata["type"] == "image"]
)
```

多模态 RAG 是企业知识库落地的最后一公里。
只有搞定了表格和图表，RAG 才能真正替代人类分析师。
未来的 RAG，检索的不再是 Text Chunk，而是 **Multimodal Chunk**（文本+图片+表格的混合体）。
架构师需要掌握 OCR、VLM、Layout Analysis 等全栈技能。
