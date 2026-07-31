# 多智能体协作：AutoGen 与 CrewAI 的角色分工

单个 LLM 再强，也有思维盲区和幻觉。
正如人类社会分工合作一样，让多个不同角色的 Agent 互相协作、甚至**辩论**，往往能解决单个 Agent 搞不定的复杂任务。
这就是 **Multi-Agent Systems (MAS)** 的核心思想。
微软的 AutoGen 和 CrewAI 是目前最流行的两个框架。

## 1. 为什么需要多智能体？

### 1.1 分工明确 (Specialization)
让一个通才 Agent 写代码、测试、写文档，它可能会顾此失彼。
不如拆分成三个专才：
*   **Developer Agent**: 专注写代码。
*   **Tester Agent**: 专注找 Bug。
*   **Writer Agent**: 专注写文档。
每个 Agent 可以用不同的 Prompt，甚至不同的底层模型（Coder 用 DeepSeek，Writer 用 Claude）。

### 1.2 自我修正 (Self-Correction)
单 Agent 容易陷入死循环。
多 Agent 引入了**反馈回路 (Feedback Loop)**。
Tester 发现 Bug，反馈给 Developer，Developer 修改，再提交给 Tester。
这种**对抗生成 (Adversarial)** 的过程能显著提升最终结果的质量。

## 2. AutoGen 框架详解

微软开源的 AutoGen 是目前最强大的 MAS 框架。
它的核心概念是 **ConversableAgent**（可对话智能体）。
Agent 之间通过**发送消息**来协作。

### 2.1 角色定义
```python
from autogen import AssistantAgent, UserProxyAgent

# 1. 开发者
coder = AssistantAgent(
    name="Coder",
    system_message="You are a senior python engineer. Write code to solve problems.",
    llm_config=llm_config
)

# 2. 用户代理 (负责执行代码)
user_proxy = UserProxyAgent(
    name="User_Proxy",
    human_input_mode="NEVER",
    code_execution_config={"work_dir": "coding"}
)

# 3. 开始对话
user_proxy.initiate_chat(coder, message="Plot a stock price chart for NVDA.")
```

### 2.2 自动反馈循环
Coder 生成代码 -> UserProxy 执行代码 -> 如果报错，把错误信息发回给 Coder -> Coder 修正代码 -> UserProxy 再次执行...
直到任务完成。

## 3. CrewAI 框架详解

CrewAI 更侧重于**角色扮演 (Role-Playing)** 和 **任务编排 (Orchestration)**。
它基于 LangChain，更易上手。

### 3.1 定义 Crew (团队)
```python
from crewai import Agent, Task, Crew

# 1. 定义角色
researcher = Agent(
    role='Senior Researcher',
    goal='Uncover groundbreaking technologies',
    backstory='Driven by curiosity, you explore the depths of the internet.',
    tools=[SearchTool()]
)

writer = Agent(
    role='Tech Writer',
    goal='Write compelling articles about tech trends',
    backstory='You simplify complex topics for the general public.'
)

# 2. 定义任务
task1 = Task(description='Research the latest AI trends.', agent=researcher)
task2 = Task(description='Write a blog post based on the research.', agent=writer)

# 3. 组建团队
crew = Crew(
    agents=[researcher, writer],
    tasks=[task1, task2],
    process=Process.sequential # 顺序执行
)

# 4. 开工
result = crew.kickoff()
```

## 4. 辩论机制 (Debate)

除了协作，还可以让 Agent **吵架**。
比如让一个 Agent 提出观点 A，另一个 Agent 反驳（Devil's Advocate）。
第三个 Agent 作为法官，综合双方观点得出结论。
这种机制能有效减少幻觉，提升推理的深度。

多智能体协作是 AI 应用架构的未来。
它让我们从**编写 Prompt** 转向了**组织架构设计**。
你需要思考的不是“怎么问 LLM”，而是“我需要雇佣什么样的员工，他们之间该怎么配合”。
这就像是在管理一家虚拟公司。
