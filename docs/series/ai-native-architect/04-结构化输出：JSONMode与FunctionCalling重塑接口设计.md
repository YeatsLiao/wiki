# 结构化输出：JSON Mode 与 Function Calling 重塑接口设计

在 LLM 刚出现时，开发者最头疼的问题是如何从模型那一大段“废话”中提取出关键信息。
我们不得不写复杂的 Regex 来匹配 `Answer: (.*)`，或者在 Prompt 里苦苦哀求：“Please output ONLY JSON, no other text.”
即便如此，模型还是经常输出：`Sure! Here is the JSON: { ... }`，导致 JSON 解析失败。

**结构化输出（Structured Output）** 的出现，彻底改变了这一现状。
现在，我们可以像调用普通函数一样调用 LLM，得到的不再是 String，而是强类型的 Object。
这不仅是便利性的提升，更是**AI 应用架构的基石**。

## 1. JSON Mode：最基础的约束

### 1.1 什么是 JSON Mode？
OpenAI 等模型提供了一个 `response_format={"type": "json_object"}` 参数。
开启后，模型会**保证**输出合法的 JSON 字符串。
*   **注意**：你必须在 Prompt 里明确提到 "JSON" 这个词，否则模型可能会报错或生成空白。
*   **局限**：它只保证是 JSON，不保证符合你的 Schema（比如字段名可能是错的）。

### 1.2 架构模式：TypeChat
微软推出的 TypeChat 库，核心思想是利用 TypeScript 类型定义作为 Prompt。
```typescript
// 定义 Schema
interface SentimentResponse {
    sentiment: "positive" | "negative" | "neutral";
    score: number; // 0 to 1
}
```
LLM 会根据这个 Interface 生成符合结构的数据。如果验证失败，TypeChat 会自动把错误信息（如 "score missing"）喂回给 LLM 重试。

## 2. Function Calling (Tool Use)：真正的革命

### 2.1 什么是 Function Calling？
这不仅仅是输出 JSON，而是让 LLM **“以为”** 自己在调用一个函数。
你给 LLM 一个函数签名（Name, Description, Parameters），LLM 决定是否调用它，以及用什么参数调用。

### 2.2 流程详解
1.  **User**: "查一下北京明天的天气。"
2.  **App**: 发送 Prompt + `get_weather(city: str, date: str)` 定义给 LLM。
3.  **LLM**: 思考后，返回一个结构化对象：
    ```json
    {
      "tool_calls": [{
        "name": "get_weather",
        "arguments": "{\"city\": \"Beijing\", \"date\": \"tomorrow\"}"
      }]
    }
    ```
    *(注意：此时 LLM 并没有真的去查天气，它只是生成了参数)*
4.  **App**: 拿到参数，执行真正的 API：`weather_api.query("Beijing", "tomorrow")` -> 得到 "Sunny, 25°C"。
5.  **App**: 把 "Sunny, 25°C" 作为 `tool_output` 发回给 LLM。
6.  **LLM**: 生成最终自然语言回复：“北京明天天气晴朗，气温 25度。”

### 2.3 架构意义：LLM 作为路由器
在 Function Calling 模式下，LLM 不再只是生成器，而是**智能路由器 (Intelligent Router)**。
它连接了自然语言意图和确定性的代码逻辑。

## 3. Pydantic Is All You Need

在 Python 生态中，**Pydantic** 成为了定义 LLM 接口的事实标准。
不管是 LangChain, LlamaIndex 还是 OpenAI SDK，都原生支持 Pydantic 模型。

### 3.1 定义数据模型
```python
from pydantic import BaseModel, Field
from typing import List

class Step(BaseModel):
    explanation: str = Field(description="Step explanation")
    output: str = Field(description="Result of this step")

class MathReasoning(BaseModel):
    steps: List[Step]
    final_answer: float
```

### 3.2 Instructor 库：最优雅的封装
`instructor` 库（基于 Pydantic）让 LLM 调用变得极其 Pythonic。
```python
import instructor
from openai import OpenAI

client = instructor.patch(OpenAI())

resp = client.chat.completions.create(
    model="gpt-4-turbo",
    response_model=MathReasoning, # 直接传 Class
    messages=[{"role": "user", "content": "Solve 2x + 5 = 15"}]
)

print(resp.final_answer) # 5.0 (Type: float)
print(resp.steps[0].explanation) # "Subtract 5 from both sides"
```
**这就是未来的后端接口开发体验**。没有 Regex，没有 String Parsing，只有强类型的对象。

## 4. 最佳实践与坑

### 4.1 描述 (Description) 至关重要
函数名和参数的 `description` 是给 LLM 看的“文档”。
*   **Bad**: `date: str`
*   **Good**: `date: str, format YYYY-MM-DD, default to today if not specified.`
写好 Description 等于写好了 Prompt。

### 4.2 容错与重试
即使有 Function Calling，LLM 偶尔也会生成不符合 Schema 的参数（比如 Enum 越界）。
*   **Validation**: 使用 Pydantic 的 `validator` 装饰器进行校验。
*   **Retry**: 捕获 `ValidationError`，将错误信息作为 System Message 发回 LLM，让其修正（Self-Correction）。

### 4.3 性能优化
定义过于复杂的 Schema 会消耗大量 Token，且增加延迟。
*   **Tip**: 尽量把大 Schema 拆分成多个小 Function。
*   **Tip**: 对于简单任务，用 JSON Mode 可能比 Function Calling 更快（少了一次往返）。

结构化输出将 LLM 从“聊天机器人”升级为“数据处理引擎”。
掌握 JSON Mode 和 Function Calling，是构建 Agent、RAG 和复杂 AI 工作流的前提。
未来的 API，输入是 Prompt，输出是 Object。中间的转换，交给 LLM。
