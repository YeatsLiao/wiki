# Token经济学与模型路由：成本、延迟、质量的三角决策

在 AI 原生应用中，一切计算、存储、交互都围绕一个基本单位展开：**Token**。它不仅是计费单位，更是延迟、上下文窗口和推理能力的度量衡。架构师需要像财务总监精算每一分钱那样，精算每一个 Token 的流向。本篇合并系列原稿中「Token 经济学」「模型路由」「AI 工程师技能树」三篇，先建立**成本（Cost）、延迟（Latency）、质量（Quality）**的「不可能三角」决策模型，再给出打破三角的工程手段——模型路由，最后附上支撑这些决策所需的技能地图。

## 一、成本：不仅是 API 调用费

### Input 与 Output 的差异化定价

主流 LLM 提供商都采用 Input/Output 差异定价，Output Token 通常明显贵于 Input Token。两个架构启示：

* **RAG 场景**：检索回来的文档块属于 Input，虽单价低但量大，精简检索结果（Re-ranking + Filtering）能显著降本。
* **CoT 场景**：思维链要生成大量中间步骤（Output），成本极高。要权衡：是否值得为 5% 的准确率提升付出 3 倍推理成本？

### 隐性成本：Prompt Caching

长上下文模型每次请求都重复发送 System Prompt + Few-Shot 示例 + 文档，是巨大浪费。利用 Prompt Caching（对重复前缀内容缓存，最高可省约 90% Input 成本），把静态的 System Prompt、工具定义、知识库索引置于 Prompt 头部。

### 自托管 vs API

* **API**：按量付费、弹性伸缩、无运维，适合流量波动大、初期验证阶段。
* **自托管（vLLM/TGI）**：固定 GPU 成本 + 运维投入。经验阈值：Token 吞吐量超过约 1000 万 tokens/天且模型参数量较小（< 70B）时，自托管 ROI 更高。

## 二、延迟：TTFT 与 TPS 的权衡

* **首字延迟（TTFT）**：请求发出到看见第一个字符的时间。输入越长 Prefill 越慢；命中 KV Cache 可大幅缩短；Groq 等推理专用芯片（LPU）可做到极低 TTFT。
* **生成速度（TPS）**：模型越大越慢；INT8/INT4 量化和投机采样（小模型出草稿、大模型验证）都能显著提升 TPS。
* **流式输出（Streaming）**：不减少总耗时，但显著降低**感知延迟**，长文本生成场景是必须项（SSE 或 WebSocket 实现打字机效果）。

## 三、质量：分级与蒸馏

按能力把模型分为三级：

* **S 级**（旗舰模型）：复杂逻辑推理、代码生成、创意写作。成本高、延迟高。
* **A 级**（70B 级开源模型）：通用任务、RAG 问答、摘要。性价比高。
* **B 级**（8B 级小模型）：简单分类、实体提取、高并发任务。极快极便宜。

**蒸馏与微调**是打破不可能三角的终极手段：用 S 级模型（Teacher）生成高质量数据，微调 B 级模型（Student），让小模型在特定任务上达到大模型效果，同时保持低延迟低成本。

### 场景化决策矩阵

| 场景 | 优先级 | 推荐档位 | 架构策略 |
| :--- | :--- | :--- | :--- |
| 智能客服 | Latency > Cost > Quality | B 级小模型 | 流式输出、常见问题缓存、RAG 加速 |
| 代码助手 | Quality > Latency > Cost | S 级旗舰 | 中间补全用小模型，复杂重构用大模型 |
| 离线数据分析 | Cost > Quality > Latency | 轻量旗舰 / 高性价比模型 | Batch API 折扣、异步执行 |
| 创意写作 | Quality > Cost > Latency | S 级旗舰 | 高 Temperature、多次生成供用户选择 |

## 四、模型路由：把三角决策自动化

没有万能的 LLM：有的模型编程强，有的性价比高，有的以速度见长。只用一种模型，要么在浪费钱（牛刀杀鸡），要么在牺牲体验（鸡刀宰牛）。**模型路由（Model Routing）**在不同任务之间动态选择最优模型，通常能在保证 95% 任务质量的前提下降低 50%~80% 成本，同时提供故障转移能力（OpenAI 超时自动切 Azure，再降级到 Bedrock）。

### 三种路由策略（由简到繁）

**1. 静态规则路由**：基于预设规则。Context 超长 → 长上下文模型；Prompt 含 "Python/Java/Code" → 代码特长模型；免费用户 → 小模型，付费用户 → 旗舰模型。

**2. 语义分类路由**：先用一个小模型（BERT/fastText/8B 模型）对 Prompt 做意图分类，再按标签分发：

```
User Query -> [Classifier (Small Model)] -> {Label: Coding} -> [Router] -> 代码特长模型
```

**3. 级联路由（LLM Cascade）**：先用小模型回答，评估器（或自反思）判断质量，低于阈值再升级到大模型，并把小模型的答案作为上下文一并传入。

开源方案可参考 LMSYS 的 **RouteLLM**：训练一个 Router Model 学习不同 LLM 在不同 Prompt 下的表现（Elo Score），在 MT-Bench 上能以 GPT-4 级质量降低 2~4 倍成本。

### 网关层落地：LiteLLM

工程上路由逻辑应下沉到 **LLM Gateway**，不要在应用代码里写 `if model == 'claude'`。LiteLLM 提供统一 OpenAI 格式接口、多 Key 负载均衡、成本追踪和 Fallback：

```yaml
model_list:
  - model_name: gpt-4
    litellm_params:
      model: azure/gpt-4-turbo
      api_base: https://my-endpoint.openai.azure.com/
  - model_name: gpt-4
    litellm_params:
      model: openai/gpt-4-turbo

router_settings:
  routing_strategy: "latency-based-routing"
  redis_host: "localhost"
  redis_port: 6379
```

落地节奏：先静态规则起步 → 收集路由日志分析误路由 → 引入语义分类与级联；对极重要任务（如医疗建议）始终用多模型投票。

## 五、附：AI 全栈工程师技能地图

要支撑上面的决策，传统「前端 + 后端 + 数据库」的技能栈需要扩展为五层：

| 层 | 核心内容 | 代表工具 |
| :--- | :--- | :--- |
| 提示工程 | Few-Shot、CoT、ReAct、Prompt 评估与版本管理 | LangSmith、PromptLayer |
| 数据与 RAG | Embedding、向量库、Chunking、Hybrid Search、Re-ranking | LlamaIndex、pgvector、Milvus |
| Agent 与工具调用 | Function Calling、Planning、Memory、Multi-Agent | AutoGen、CrewAI、LangGraph |
| LLMOps | 推理服务、可观测性、微调 | vLLM、LangFuse、LoRA/QLoRA |
| 前端交互 | Streaming（SSE）、Generative UI、多模态 | Vercel AI SDK、ElevenLabs |

学习路径：跑通一个 Chatbot（入门）→ 搭一套 RAG 系统（进阶）→ 用 LangGraph 做复杂任务规划（高级）→ 掌握微调与推理优化、构建企业级平台（专家）。

工具更新极快，但第一性原理不变：**Token 是计算单位，Embedding 是语义表示，Attention 是上下文关联，Probability 是输出本质。**掌握了这些，无论工具怎么变都能游刃有余。

Token 经济学不是为了省钱，而是为了**价值最大化**。不要迷信「最强模型」，最适合业务场景的模型才是最好的模型。架构师的职责，是在 Cost、Latency、Quality 的三维空间中绘制最优的帕累托前沿——而模型路由，就是把这条前沿变成每天自动运行的基础设施。
