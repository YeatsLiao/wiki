# 工具使用设计模式：为 LLM 定义清晰鲁棒的 API

Agent 的核心能力在于**调用外部世界的能力 (Action)**。
如果把 LLM 比作大脑，那么 Tools 就是它的手脚。
而 API 定义（Function Signature）就是大脑控制手脚的指令集。
写好 API 定义，比写好代码更重要。
如果 API 定义含糊不清，LLM 就会乱调用，或者调用失败。

## 1. OpenAI Function Calling 标准

OpenAI 定义了一套标准的 JSON Schema 来描述工具。
```json
{
  "name": "get_weather",
  "description": "Get the current weather in a given location",
  "parameters": {
    "type": "object",
    "properties": {
      "location": {
        "type": "string",
        "description": "The city and state, e.g. San Francisco, CA"
      },
      "unit": {
        "type": "string",
        "enum": ["celsius", "fahrenheit"]
      }
    },
    "required": ["location"]
  }
}
```
**关键点**：
1.  **Name**: 清晰动词+名词（`get_weather`, `send_email`）。
2.  **Description**: 最重要！告诉 LLM 这个工具是干嘛的，什么时候用。
3.  **Parameters**: 字段类型、描述、枚举值、是否必填。

## 2. 设计模式一：原子化工具 (Atomic Tools)

### 2.1 什么是原子化？
每个工具只做一件事，且这件事是**不可拆分**的。
*   **Bad**: `manage_user(action, user_id, data)` —— 一个函数包揽增删改查。
*   **Good**: `create_user`, `delete_user`, `update_user_email`。

### 2.2 为什么？
LLM 更容易理解单一职责的工具。
如果一个工具太复杂，参数太多，LLM 很容易填错参数。

## 3. 设计模式二：容错与反馈 (Error Handling & Feedback)

### 3.1 错误信息反馈
当工具执行失败时（如 API 报错 404），不要直接抛出异常让程序崩溃。
而是捕获异常，把**错误信息作为 Observation 返回给 LLM**。
**Agent Loop**:
1.  **Action**: `get_user(id=123)`
2.  **Observation**: `Error: User 123 not found.`
3.  **Thought**: 用户不存在，我应该先创建用户。
4.  **Action**: `create_user(name="Alice")`

### 3.2 参数校验
在工具内部（Python 代码）进行严格的参数校验。
如果参数不合法（如 `age="abc"`），返回清晰的错误提示："Age must be an integer."。
LLM 会看到这个提示，并尝试修正参数。

## 4. 设计模式三：多步工具链 (Tool Chains)

有些任务需要连续调用多个工具。
比如：先查天气，再根据天气发邮件。

### 4.1 隐式传递
LLM 自己维护上下文。
1.  `get_weather("Beijing")` -> "Sunny".
2.  `send_email("Alice", "Weather is sunny")`。

### 4.2 显式传递 (Output Parser)
如果第一个工具返回的结果是一个很大的 JSON 对象，而第二个工具只需要其中的某个字段。
可以设计一个**中间解析器**，或者让 LLM 自己写代码（Code Interpreter）来处理数据流。

## 5. 最佳实践：Pydantic

使用 Pydantic 定义工具输入模型，既能生成 JSON Schema，又能做运行时校验。
```python
from pydantic import BaseModel, Field

class GetWeatherInput(BaseModel):
    location: str = Field(..., description="City name")
    unit: str = Field("celsius", description="Temperature unit")

def get_weather(args: GetWeatherInput):
    # Implementation
    pass
```
LangChain 等框架会自动把这个 Pydantic 模型转成 OpenAI 格式。

Tool Use 是 Agent 与现实世界交互的桥梁。
设计 API 时，要把 LLM 当作一个**聪明的实习生**。
给它清晰的文档（Description），简单的任务（Atomic），并允许它犯错（Error Feedback）。
只有这样，你的 Agent 才能稳健地行走在数字世界中。
