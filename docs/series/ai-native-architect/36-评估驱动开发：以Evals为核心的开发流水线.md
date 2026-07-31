# 评估驱动开发：以 Evals 为核心的开发流水线

在传统的 TDD (Test-Driven Development) 中，我们先写测试，再写代码。
在 AI 开发中，我们也应该遵循 **EDD (Evaluation-Driven Development)**。
先定义好“什么是好的回答”，再去写 Prompt、调模型。
否则，你永远不知道你的修改是进步了，还是退步了。

## 1. 什么是 Evals？

Evals 是一组**测试用例**和**评分标准**。
*   **Dataset**: 输入（Input）和预期输出（Reference）。
*   **Metric**: 准确率、相关性、毒性、幻觉率。
*   **Scorer**: 谁来打分？（正则、代码、LLM）。

## 2. 构建 EDD 流水线

### 2.1 第一步：建立 Golden Dataset
在项目初期，手动编写 20-50 个高质量问答对。
覆盖常见场景、边缘场景（Edge Cases）、恶意攻击场景。

### 2.2 第二步：开发与调试
1.  写一个 Prompt V1。
2.  跑一遍 Dataset。
3.  看分数，看 Bad Cases。
4.  修改 Prompt 为 V2。
5.  再跑一遍。对比 V1 和 V2。

### 2.3 第三步：CI 集成
将 Evals 集成到 GitHub Actions。
每次提交代码（修改 Prompt 或 RAG 逻辑），自动运行 Evals。
如果分数下降（Regression），禁止合并。

## 3. 工具链：Promptfoo / DeepEval

### 3.1 Promptfoo
一个专注于 Prompt 比较的 CLI 工具。
`promptfooconfig.yaml`:
```yaml
prompts: [prompt1.txt, prompt2.txt]
providers: [openai:gpt-4, anthropic:claude-3-opus]
tests:
  - vars:
      question: "Who is the president?"
    assert:
      - type: contains
        value: "Biden"
```
运行 `npx promptfoo eval`，它会生成一个漂亮的 HTML 报告，展示不同 Prompt x 不同 Model 的矩阵对比。

### 3.2 DeepEval
Python 优先的测试框架。
支持 RAG 专属指标（Context Recall, Faithfulness）。

## 4. 挑战：LLM-as-a-Judge 的偏差

用 GPT-4 给 GPT-3.5 打分，靠谱吗？
*   **Positivity Bias**: LLM 倾向于给高分。
*   **Length Bias**: LLM 认为写得长的就是好的。
*   **Self-Preference**: GPT-4 更喜欢 GPT-4 风格的回答。

**解决方案**：
*   **Few-Shot Judging**: 给 Judge 提供评分示例（"这个给 5 分因为..."）。
*   **Pairwise Comparison**: 不打绝对分，只让 Judge 选“A 好还是 B 好”。

EDD 是一种**开发纪律**。
它虽然在初期会增加工作量（写测试集），但在后期会节省无数的时间。
当你面对老板的质疑：“这个新模型真的比旧的好吗？”
你可以自信地甩出一份 Evals 报告：“准确率提升了 5.2%，幻觉率下降了 3%。”
这就是工程师的底气。
