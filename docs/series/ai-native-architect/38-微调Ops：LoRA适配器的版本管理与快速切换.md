# 微调 Ops：LoRA 适配器的版本管理与快速切换

在 SaaS 场景下，我们可能需要为每个租户（Tenant）定制模型。
*   客户 A 需要法律风格的写作。
*   客户 B 需要医疗风格的写作。
如果为每个客户部署一个 70B 模型，显存成本会爆炸。
**LoRA (Low-Rank Adaptation)** 解决了这个问题。
它只训练模型的一小部分参数（Adapter），大小只有几十 MB。
我们可以部署**一个 Base Model**，并在推理时动态加载**成千上万个 Adapter**。
这就是 **Multi-LoRA Serving**。

## 1. 核心架构：Multi-LoRA Serving

### 1.1 共享 Base Model
所有请求共享同一个底座（如 Llama 3 70B），加载在 GPU 显存中。

### 1.2 动态加载 Adapter
Adapter 存在内存或 SSD 中。
当请求来了（带上 `adapter_id=customer_a`），Inference Server 实时将 Adapter 的权重合并到计算图中，或者在计算时动态相加。
由于 Adapter 很小，切换几乎是瞬时的（毫秒级）。

### 1.3 显存池化 (Page Attention)
vLLM 等推理引擎支持 S-LoRA，将 Adapter 的权重也纳入统一的显存管理，避免碎片化。

## 2. 工具选型：vLLM / LoRAX

### 2.1 vLLM
支持 Multi-LoRA。
*   **配置**: `enable_lora=True`, `max_loras=10`。
*   **请求**:
    ```json
    {
      "prompt": "Hello",
      "lora_name": "sql_adapter"
    }
    ```

### 2.2 LoRAX (LoRA Exchange)
Predibase 推出的专门用于 Multi-LoRA 的推理服务器。
号称可以在单卡上服务 1000 个 Adapter。
优化了 Adapter 的换入换出策略（LRU Cache）。

## 3. 微调流水线 (Fine-tuning Pipeline)

微调不再是“一次性”的工作，而是持续的 Ops。

### 3.1 数据收集
从线上日志中筛选出特定领域的高质量数据。

### 3.2 自动训练
使用 Axolotl 或 Unsloth 启动训练任务。
*   **Unsloth**: 训练速度提升 2 倍，显存减少 60%。强烈推荐。

### 3.3 版本管理 (Model Registry)
训练好的 Adapter 上传到 S3 或 HuggingFace Hub。
记录 Metadata：`version`, `base_model`, `training_data_hash`, `eval_score`。

### 3.4 灰度发布
新版 Adapter 先给 1% 的流量，观察 Evals 指标和用户反馈。
没问题全量推。

微调 Ops 让**个性化 AI** 成为可能。
我们不再需要训练一个“全知全能”的巨型模型。
而是构建一个**专家网络**：一个通用的基座，加上无数个专精的 LoRA 插件。
这不仅降低了成本，更提升了垂直领域的表现。
