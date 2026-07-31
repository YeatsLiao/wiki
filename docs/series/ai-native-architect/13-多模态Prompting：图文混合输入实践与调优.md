# 多模态 Prompting：图文混合输入实践与调优

GPT-4V (Vision), Claude 3 Opus, Gemini Pro Vision 等模型不仅能读文字，还能看图片、图表、甚至视频截图。
这开启了 **Multimodal Prompting (多模态提示工程)** 的新纪元。
你可以上传一张 UI 设计图，让它生成代码；上传一张财报截图，让它分析趋势；上传一张 X 光片，让它辅助诊断。
但是，如何写好既包含图片又包含文字的 Prompt？这还是一个全新的领域。

## 1. 核心挑战：Token 消耗与幻觉

### 1.1 Token 消耗巨大
一张高清图片可能消耗 1000+ Token（取决于分辨率和切片策略）。
如果你的 Prompt 包含 10 张图，成本瞬间飙升。
*   **优化策略**：
    *   **Low-Res Mode**：对于不需要细节的任务（如分类），使用低分辨率模式（512x512），大幅降低 Token。
    *   **Crop**：只裁剪出关键区域（如发票上的金额区域），再传给模型。

### 1.2 视觉幻觉 (Visual Hallucination)
模型可能会“看错”细节。
比如把图中的 "5" 看成 "6"，或者把红色的车看成蓝色的。
*   **应对策略**：
    *   **OCR 辅助**：先用专门的 OCR 模型（如 PaddleOCR）提取文字，把文字和图片一起给 LLM。
    *   **CoT**：让模型先描述图片内容（Describe first），再回答问题。

## 2. Prompt 技巧：Set-of-Mark (SoM)

这是微软提出的多模态 Prompting 神技。
与其让模型“猜”你在指哪，不如直接在图上**画圈**。
1.  **预处理**：用检测模型（如 Grounding DINO）在图上标出所有物体，并打上数字标签（1, 2, 3...）。
2.  **Prompt**：
    > "Look at the image with numbered marks. What is object #3 holding?"
    > "Compare the color of object #1 and object #5."
3.  **效果**：这种方法显著降低了指代不清导致的幻觉，提升了空间推理能力。

## 3. 多图推理 (Multi-Image Reasoning)

很多任务需要跨图片比较。
*   **Change Detection**：两张图有什么不同？
*   **Video Understanding**：从视频中截取 5 帧，问“这个人在做什么？”
*   **Prompt 结构**：
    ```markdown
    Image 1: [image_bytes]
    Image 2: [image_bytes]
    Image 3: [image_bytes]
    
    Question: Describe the sequence of events shown in these images.
    Constraint: Focus on the movement of the red ball.
    ```
    注意：要明确每张图的时间顺序或逻辑关系。

## 4. 视觉 RAG (Visual RAG)

传统的 RAG 检索的是文本。现在的 RAG 可以检索图片。
### 4.1 多模态 Embedding (CLIP / SigLIP)
将图片和文本映射到同一个向量空间。
用户搜 "red shoes"，系统不仅能搜到包含 "red shoes" 文字的文档，还能搜到红鞋子的图片。

### 4.2 流程
1.  **Index**：对 PDF 中的插图、图表进行截图，计算 Image Embedding，存入向量库。
2.  **Retrieve**：用户提问时，同时检索相关文本和相关图片。
3.  **Generate**：把检索到的 Top-K 图片和文本一起喂给 GPT-4V，生成图文并茂的回答。

多模态能力是 AI 通向 AGI 的必经之路。
作为架构师，我们要思考的不仅是 Prompt，更是**数据流的设计**。
如何高效地处理、存储、索引海量的非结构化数据（图片、视频），是构建多模态 AI 应用的关键。
未来的 Prompt，可能是一段视频，配上一段解说词。
