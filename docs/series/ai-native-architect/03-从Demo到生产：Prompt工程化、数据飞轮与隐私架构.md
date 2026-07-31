# 从Demo到生产：Prompt工程化、数据飞轮与隐私架构

很多 AI 应用看起来很酷——能写诗、能生成图片、能回答问题。然而真正上线面对海量用户时，Demo 往往不堪一击：生产环境不仅要求「能用」，更要求**可靠、稳定、低成本、安全**。这中间的差距被称为 AI 落地的「死亡之谷」。本篇合并系列原稿中「Prompt as Code」「数据飞轮」「隐私优先架构」「七个关键教训」四篇，按落地顺序组织：先把 Prompt 管起来，再把数据闭环铺好，然后守住隐私底线，最后用七条教训做一张上线前的检查清单。

## 一、Prompt as Code：把核心逻辑纳入工程管理

当 Prompt 变得像代码一样复杂、甚至比代码更难调试时，把它当「字符串常量」写死在代码里是极其危险的。三个现实痛点：

* **脆弱性**：加个逗号、换个同义词都可能导致输出剧烈变化，没有版本回滚，一次「优化」就是一次线上事故。
* **协作困难**：Prompt 需要产品经理和工程师共同打磨，散落在代码各处则无法 Review。
* **无法量化对比**：尝试了 5 种 Prompt 策略，哪种最好？没有系统管理就无从谈起。

### 目录结构与模板化

建立独立的 `prompts/` 目录，用 YAML + Jinja2 组织，实现模块化复用与参数注入：

```
prompts/
  ├── common/              # 通用组件
  │   ├── persona.yaml     # 角色设定
  │   ├── safety.yaml      # 安全防御指令
  ├── rag/
  │   ├── q_rewrite.yaml   # 查询重写
  │   ├── answer_gen.yaml  # 答案生成
  ├── agent/
  │   ├── planner.yaml     # 任务规划
  │   ├── tools.yaml       # 工具定义
```

```yaml
model: gpt-4-turbo
temperature: 0.3
messages:
  - role: system
    content: |
      {% include "common/persona.yaml" %}
      {% include "common/safety.yaml" %}

      Use the following context to answer the user's question.
      If the answer is not in the context, say "I don't know".

      Context:
      {{ context }}
  - role: user
    content: {{ query }}
```

注意模型参数（model、temperature）与 Prompt 绑定在一起版本化——**Prompt、Model、Parameters 三位一体**。

### 生命周期：测试、版本、灰度

* **测试**：Prompt 的单元测试就是 Evals。维护 `test_cases.json` 测试集，批量调用计算 Pass Rate，每次修改前后对比。
* **版本控制**：Git 管理 Prompt 文件，Commit Message 与 Tag 规范同代码（`feat(rag): add CoT reasoning`、`v1.0.1`）。
* **发布**：代码中按 Tag 加载（生产环境 `v1.0` 稳定版，灰度环境 `v1.1`），修改 Prompt 无需重新部署应用。

工具链：LangChain Hub（Prompt 仓库）、LangSmith / LangFuse（Playground + Tracing + Dataset + 自动评估）、PromptLayer / Pezzo（适合 PM 参与协作的 Prompt CMS）。

## 二、数据飞轮：设计「越用越聪明」的闭环

模型是公开的，算法是开源的，算力是可租的——AI 应用的护城河只有**私有数据**。但静态数据是死资产，只有形成 **Usage → Data → Model → Product → Usage** 的正向循环，数据才变成护城河。

### 埋点：记录结构化交互数据

不要只记日志，要记录带反馈语义的结构化数据：

```json
{
  "trace_id": "uuid-123",
  "user_id": "user-456",
  "prompt": "写一段 Python 代码...",
  "model_output": "def foo(): ...",
  "user_action": "copy",
  "user_feedback": null,
  "latency": 1200,
  "cost": 0.002
}
```

### 反馈收集的三种模式

* **Copilot 模式**：接受补全（Tab）→ 正样本；拒绝（继续打字覆盖）→ 负样本。GitHub Copilot 正是靠海量 Accept/Reject 数据把补全准确率从 20% 提升到 40% 以上。
* **Chatbot 模式**：每条回复加 👍/👎，点踩后追问「更好的回答是什么」。
* **Agent 模式**：执行报错或用户手动干预流程，记为负样本。

Midjourney 是经典案例：用户点击 U1（放大某张图）就是一次强烈正反馈，这些数据被用于训练 Reward Model，让生成越来越符合大众审美。

### 回流与迭代

垃圾进垃圾出，回流前先过滤：LLM-as-a-Judge 对用户反馈二次打分、去重、去 PII。然后进入迭代管道——RAG 知识实时入库、每周自动收集高质量问答对微调 LoRA Adapter、Bad Case 反哺 System Prompt 与测试集。冷启动没数据时，用合成数据（强模型生成种子数据）、团队内部标注和公开数据集预热。

## 三、隐私优先架构：端云之间的三种平衡模式

随着 GDPR、CCPA 等法规实施，把个人照片、聊天记录、企业文档直接丢给云端 API 不再被轻易接受；而完全本地部署又受限于端侧算力。三种务实的折衷架构：

### 模式一：端云协同（Hybrid）

端侧跑小模型处理敏感数据，云端跑大模型处理复杂推理。核心组件是客户端的**隐私路由器**：

* 含 SSN、信用卡、住址等敏感字段 → 路由到本地模型。
* 通用闲聊 → 路由到云端。
* 必须上云的内容先做 **PII 脱敏**（"John Doe" → "USER_001"），云端返回后端侧再还原——云端只看到结构，看不到数据。

### 模式二：本地 RAG

知识库（PDF、Word）在本地，向量索引就没理由放云端。用嵌入式向量库（Chroma、LanceDB、SQLite-VSS）+ 本地 Embedding 模型（Sentence-Transformers，CPU 即可），检索全部在端侧完成，**仅将 Top-K 相关且已脱敏的文本片段**发给云端大模型生成答案——非相关隐私数据完全不出域。

### 模式三：联邦学习 + 差分隐私

需要用用户数据提升模型但数据不能上传时：模型下发到设备本地训练，只上传梯度更新，云端聚合；上传梯度时加噪声（差分隐私），即使被截获也无法反推原始数据。代价是通信开销大、对端侧算力要求高。

工具推荐：Microsoft Presidio（PII 识别与脱敏）、Ollama / Llama.cpp / MLC LLM（本地推理运行时）。**隐私不是架构的补丁，而是架构的基石**——在 AI 原生时代，信任是最稀缺的货币。

## 四、上线前检查清单：七个关键教训

1. **幻觉**：不要试图彻底消除，学会共存——RAG Grounding、强制引用来源、置信度低于阈值拒答、关键决策人工审核。
2. **延迟**：用户不仅要答案还要快——Streaming、Optimistic UI、小模型先快速响应、常见问题走 Redis 缓存。
3. **成本**：Token 按字算钱不按次——模型路由、精简 Prompt、按用户限流限量、每日预算告警。
4. **安全**：Prompt Injection 是新的 SQL Injection——输入校验、输出过滤（敏感词/PII）、System Prompt 加固防御指令、代码执行环境沙箱隔离（Docker/Firecracker）。
5. **评估**：没有 Evals 就没有迭代——建 Golden Dataset，每次 Commit 自动跑测试防回退，LLM-as-a-Judge 打分。
6. **数据闭环**：上线不是结束是开始——反馈收集、Bad Case 定期复盘、数据够了微调专属模型（见本篇第二节）。
7. **预期管理**：不要承诺 AI 全能——明确告知内容由 AI 生成可能有错、限定能力范围、提供提问引导模板。

跨越死亡之谷，需要的不仅是技术，更是**工程素养**和**产品智慧**。把 Prompt 当代码管理，让评估驱动每一次迭代；在设计系统的第一天就铺好数据回流的管道；把隐私当基石而非补丁。当应用做到可靠、便宜、快，并且和用户一起成长时，AI 才算真正落了地。
