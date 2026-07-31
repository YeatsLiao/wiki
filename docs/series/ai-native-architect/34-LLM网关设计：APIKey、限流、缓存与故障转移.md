# LLM 网关设计：API Key、限流、缓存与故障转移

在企业内部，如果每个团队都自己去申请 OpenAI Key，自己写代码调用，很快就会陷入混乱：
*   **安全风险**：Key 写死在代码里，泄露了怎么办？
*   **成本失控**：哪个部门用了多少钱？不知道。
*   **稳定性差**：OpenAI 挂了，全公司业务停摆。
你需要一个统一的 **LLM Gateway**。
它就像微服务架构中的 API Gateway，负责鉴权、路由、限流和监控。

## 1. 核心功能架构

### 1.1 统一鉴权 (Unified Auth)
前端或业务后端不直接持有 OpenAI Key，而是持有 Gateway 的 Key（可轮换、可撤销）。
Gateway 后端配置真实的 Provider Keys (OpenAI, Azure, Anthropic)。

### 1.2 速率限制 (Rate Limiting)
防止某个实习生写了个死循环，把公司预算跑光。
*   **Global Limit**: 全公司每分钟最多 1000 次请求。
*   **User Limit**: 每个用户每分钟最多 10 次。
*   **Cost Limit**: 每个部门每天预算 $100。

### 1.3 缓存 (Caching)
对于相同的 Prompt，直接返回缓存结果，既省钱又快。
*   **Semantic Cache**: 基于向量相似度的缓存。即使 Prompt 措辞稍有不同，也能命中缓存。

## 2. 高可用设计 (High Availability)

### 2.1 负载均衡 (Load Balancing)
配置多个 Key（比如 3 个 OpenAI 账号），轮询使用，突破 Tier 限制。

### 2.2 故障转移 (Failover / Fallback)
这是 Gateway 的杀手锏。
```yaml
fallbacks:
  - model: gpt-4
    targets:
      - azure/gpt-4-turbo  # 首选 Azure
      - openai/gpt-4       # Azure 挂了切 OpenAI
      - anthropic/claude-3-opus # 都挂了切 Claude
```
业务端无感知，只会觉得“今天 API 有点慢”，但不会报错。

## 3. 开源网关选型：LiteLLM vs OneAPI

### 3.1 LiteLLM Proxy
*   **语言**: Python。
*   **优势**: 兼容 OpenAI 格式，支持 100+ 模型。配置简单（YAML）。
*   **生态**: 与 LangChain, LlamaIndex 集成极好。

### 3.2 OneAPI
*   **语言**: Go。
*   **优势**: 性能极高，单文件部署。界面友好，支持渠道管理和倍率设置。
*   **场景**: 适合做“二传手”或内部中转站。

## 4. 实战：搭建 LiteLLM Proxy

### 4.1 安装与配置
```bash
pip install litellm[proxy]
```
`config.yaml`:
```yaml
model_list:
  - model_name: gpt-4
    litellm_params:
      model: azure/gpt-4-turbo
      api_base: https://my-endpoint.openai.azure.com/
      api_key: os.environ/AZURE_API_KEY

litellm_settings:
  cache: true
  cache_type: redis
```

### 4.2 启动
```bash
litellm --config config.yaml
```
现在，你的 Gateway 运行在 `http://localhost:4000`。
业务代码只需改一行：
```python
client = OpenAI(
    api_key="sk-anything", # Gateway 鉴权 Key
    base_url="http://localhost:4000"
)
```

LLM Gateway 是 AI 基础设施的第一块砖。
它把**模型供应商**和**业务逻辑**解耦了。
以后无论模型怎么换（GPT-5 出来了？Llama 4 开源了？），业务代码都不用动，只需要改 Gateway 配置。
这就是架构的**灵活性**。
