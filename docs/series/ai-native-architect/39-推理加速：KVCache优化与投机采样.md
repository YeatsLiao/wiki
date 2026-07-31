# 推理加速：KV Cache 优化与投机采样

用户对延迟是极度敏感的。
Google 研究表明，延迟每增加 100ms，流量下降 20%。
对于 LLM 应用，延迟更是痛点。
除了换更快的卡（H100），我们在**算法**和**应用层**还有哪些优化手段？

## 1. KV Cache 优化

### 1.1 什么是 KV Cache？
LLM 生成是自回归的（生成了 Token 1，把它作为输入生成 Token 2）。
为了避免重复计算前面所有 Token 的 Attention，我们将 Key 和 Value 矩阵缓存起来。
这就是 KV Cache。显存占用的罪魁祸首。

### 1.2 PagedAttention (vLLM)
受操作系统“虚拟内存”启发。
将 KV Cache 分块存储（Block），不要求连续物理显存。
大幅减少显存碎片，提高并发（Batch Size）。

### 1.3 Prompt Caching (应用层)
如果 System Prompt 很长（如 10K Token），每次请求都算一遍 KV Cache 很浪费。
*   **Prefix Caching**: 将 System Prompt 的 KV Cache 常驻显存。
*   **Radix Attention**: vLLM 的高级特性，自动识别不同请求的公共前缀，复用 Cache。

## 2. 投机采样 (Speculative Decoding)

### 2.1 核心思想
大模型（70B）推理很慢，小模型（7B）推理很快。
小模型虽然笨，但在生成简单词（"the", "is", "a"）时，和大模型是一样的。
**流程**：
1.  **Draft**: 小模型快速生成 5 个 Token（草稿）。
2.  **Verify**: 大模型并行验证这 5 个 Token。
3.  **Accept/Reject**: 大模型接受其中前 3 个，拒绝第 4 个。
4.  **Result**: 一次大模型前向传播，生成了 3 个 Token。

### 2.2 效果
在不损失任何精度（数学上等价）的前提下，加速 2-3 倍。
成本也降低了（因为小模型便宜）。

## 3. 量化 (Quantization)

### 3.1 Weight-Only (INT8/INT4)
只量化权重。显存减半，加载更快。
适合显存受限的场景。

### 3.2 Activation Quantization (W8A8)
权重和激活值都量化。计算更快（利用 Tensor Core 的 INT8 指令）。
AWQ, GPTQ, Marlin 是主流算法。

## 4. 架构师的决策

| 场景 | 推荐策略 |
| :--- | :--- |
| **高并发 Chatbot** | vLLM (PagedAttention) + INT8 量化 |
| **长文档分析** | Prompt Caching (Prefix Sharing) |
| **极致低延迟** | Speculative Decoding (Llama-70B + Llama-7B) |
| **离线批处理** | Batch API (非实时，更便宜) |

性能优化是一个系统工程。
从底层的 CUDA Kernel，到中间的推理引擎（vLLM），再到上层的 Prompt Caching。
每一层都有榨取性能的空间。
快，不仅是体验，更是**成本**。
因为 GPU 是按秒收费的。
