# 流式输出实践：SSE 协议与 Markdown 增量渲染

LLM 生成一段 500 字的回复可能需要 10 秒。
如果等生成完了再返回，用户会以为网断了。
**Streaming (流式输出)** 是 AI 应用的标配。
它让用户能看到字一个个蹦出来（打字机效果），心理等待时间趋近于零。

## 1. 协议选型：SSE vs WebSocket

### 1.1 Server-Sent Events (SSE)
*   **原理**: 基于 HTTP 的长连接。服务器单向推送文本流。
*   **优点**: 简单，浏览器原生支持 (`EventSource`)，防火墙友好，支持自动重连。
*   **缺点**: 单向（Server -> Client）。
*   **结论**: **首选**。因为 LLM 生成就是单向的。

### 1.2 WebSocket
*   **原理**: TCP 双向全双工。
*   **优点**: 双向实时（如实时语音打断）。
*   **缺点**: 复杂，心跳保活，状态管理麻烦。
*   **适用**: 实时语音对话、多人协作编辑。

## 2. 后端实现 (Python / FastAPI)

OpenAI SDK 默认支持 Streaming。
我们需要把这个 Iterator 包装成 SSE 格式返回。

```python
from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from openai import OpenAI

app = FastAPI()
client = OpenAI()

def generate_stream(prompt):
    stream = client.chat.completions.create(
        model="gpt-4",
        messages=[{"role": "user", "content": prompt}],
        stream=True, # 开启流式
    )
    for chunk in stream:
        if chunk.choices[0].delta.content:
            yield chunk.choices[0].delta.content

@app.get("/chat")
async def chat(prompt: str):
    return StreamingResponse(generate_stream(prompt), media_type="text/event-stream")
```

## 3. 前端实现 (React / Markdown)

### 3.1 接收流
使用 `fetch` + `ReadableStream` 读取数据。
```javascript
const response = await fetch("/chat");
const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  const chunk = decoder.decode(value);
  setMessages((prev) => prev + chunk); // 增量更新 State
}
```

### 3.2 增量渲染 Markdown
Markdown 解析器（如 `react-markdown`）通常需要完整的文本才能解析。
如果在生成过程中，Markdown 语法不完整（如 `**bold` 只输出了 `**b`），渲染会乱。
**解决方案**：
*   **Debounce**: 降低渲染频率。
*   **Streaming-ready Parser**: 使用支持流式的解析库，或者容错性强的库。
*   **光标闪烁**: 在最后加一个闪烁的光标 `|`，模拟打字机。

## 4. 复杂场景：JSON Mode Streaming

如果 LLM 输出的是 JSON，流式解析就很难了。
因为 `{"key": "val` 不是合法的 JSON。
**解决方案**：
*   **Partial JSON Parser**: 使用 `json-repair` 等库，尝试解析不完整的 JSON。
*   **Vercel AI SDK**: 封装了 `StreamData`，专门处理流式结构化数据。

Streaming 看起来简单，细节魔鬼很多。
*   **Buffer**: Nginx 或 CDN 可能会缓存 SSE，导致流变成“一坨”。需要配置 `X-Accel-Buffering: no`。
*   **Error Handling**: 流中间报错了怎么处理？
做好 Streaming，是 AI 应用**用户体验 (UX)** 的第一步。
