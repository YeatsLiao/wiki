# AI 应用安全防护：PII 过滤与内容审核

如果你的 AI 应用泄露了用户的信用卡号，或者输出了种族歧视的言论，那么不管它有多聪明，它都死定了。
**Safety & Security** 是企业级 AI 的生命线。
我们不仅要防外部攻击（Prompt Injection），还要防内部泄露（PII Leakage）和模型失控（Toxic Output）。

## 1. PII 敏感信息过滤 (Data Loss Prevention)

### 1.1 什么是 PII？
Personally Identifiable Information。
姓名、邮箱、电话、身份证号、信用卡号。

### 1.2 进站过滤 (Inbound)
在用户输入发送给 LLM 之前，扫描并脱敏。
防止敏感数据进入 OpenAI 的日志（虽然他们承诺不训练，但合规要求）。
*   **工具**: Microsoft Presidio, Google DLP API。
*   **策略**:
    *   **Redact**: 替换为 `<EMAIL>`。
    *   **Mask**: 替换为 `****`。
    *   **Fake**: 替换为假数据（保持格式）。

### 1.3 出站过滤 (Outbound)
防止模型无意中输出了训练数据中的敏感信息。

## 2. 内容审核 (Moderation)

### 2.1 毒性检测 (Toxicity)
模型可能会输出仇恨言论、色情、暴力内容。
*   **OpenAI Moderation API**: 免费的。
    ```python
    response = client.moderations.create(input="I want to kill them.")
    if response.results[0].flagged:
        return "I cannot answer that."
    ```

### 2.2 竞品过滤
如果是企业客服，不希望 AI 推荐竞争对手的产品。
*   **Keyword Blocklist**: 简单粗暴。
*   **Semantic Filter**: 训练一个分类器，识别“推荐竞品”的意图。

## 3. 架构设计：安全网关 (Security Gateway)

不要在每个 Service 里写安全逻辑。
在 LLM Gateway 中集成安全插件。
**Request Flow**:
User -> [ Gateway (PII Filter -> Injection Check) ] -> LLM -> [ Gateway (Moderation -> PII Filter) ] -> User。

## 4. 挑战：过度防御 (Over-refusal)

如果过滤太严，模型会变成“杠精”。
用户：“如何杀掉一个 Python 进程？”
模型：“我不能提供杀人的建议。”（误判 `kill`）。
**对策**：
*   **Context Aware**: 理解上下文（是在编程，不是在犯罪）。
*   **Custom Policy**: 根据业务场景定制规则。

安全不是一个功能，而是一个**过程**。
攻击手段在变，防御手段也要变。
定期进行**红队测试 (Red Teaming)**，模拟黑客攻击自己的系统。
只有经得起攻击的系统，才是健壮的系统。
