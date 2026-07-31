# 无服务器 AI：Vercel AI SDK 与 Cloudflare Workers

对于大多数 AI 应用（如 Chatbot），传统的后端架构（Docker + K8s + GPU 服务器）显得太重了。
*   **启动慢**：冷启动要几分钟。
*   **闲置贵**：没人用时 GPU 也在空转。
*   **运维难**：要管负载均衡、扩缩容。
**Serverless AI** 是一种全新的范式：
代码运行在边缘（Edge），模型运行在 API 提供商（OpenAI/Anthropic）。
你只需要写一个函数，按毫秒付费。

## 1. 核心优势

### 1.1 极致冷启动
Edge Function（如 Cloudflare Workers）冷启动在 10ms 以内。
用户感觉不到延迟。

### 1.2 全球分布
代码部署在全球 300+ 个节点。
用户在哪里，代码就在哪里运行。
虽然 LLM API 在美国，但前处理（鉴权、RAG）在边缘完成，依然能加速。

### 1.3 成本
没有请求就不收费。
适合流量波动大、偶尔有突发的应用。

## 2. 工具链：Vercel AI SDK

Vercel 推出的 AI SDK 是目前 Serverless AI 的标准库。

### 2.1 统一 API
```javascript
import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';

export const POST = async (req) => {
  const { messages } = await req.json();
  const result = await streamText({
    model: openai('gpt-4'),
    messages,
  });
  return result.toDataStreamResponse();
};
```
几行代码，就实现了一个支持流式的 Chat API。

### 2.2 React Hooks
前端：
```javascript
import { useChat } from 'ai/react';

const { messages, input, handleInputChange, handleSubmit } = useChat();
```
自动处理 State、Streaming 解析、错误重试。

## 3. Cloudflare Workers + AI

Cloudflare 不仅提供 Workers，还提供了 **Workers AI**（Serverless GPU）。
你可以在边缘直接运行 Llama 3 8B，无需调用 OpenAI。
```javascript
import { Ai } from '@cloudflare/ai';

export default {
  async fetch(request, env) {
    const ai = new Ai(env.AI);
    const response = await ai.run('@cf/meta/llama-3-8b-instruct', {
        prompt: "Hello!"
    });
    return new Response(JSON.stringify(response));
  }
};
```
虽然性能不如 H100，但对于简单任务，延迟极低，且**免费额度**很高。

## 4. 局限性

### 4.1 运行时限制
Edge 环境通常不支持 Python，只支持 JS/Wasm。
如果你依赖 Pandas/Numpy，这就很难受。

### 4.2 连接数据库
边缘节点连接中心化数据库（如 AWS RDS）可能会有延迟（物理距离）。
建议搭配边缘数据库（如 Cloudflare D1, Neon Postgres）。

### 4.3 显存限制
Workers AI 目前只支持中小模型（< 70B）。

Serverless AI 是独立开发者（Indie Hacker）和初创公司的神器。
它让你在 5 分钟内上线一个全球可用的 AI 应用，且运维成本为零。
虽然它不能替代高性能的 GPU 集群，但对于 90% 的 **Wrapper 类应用**，它是最佳选择。
