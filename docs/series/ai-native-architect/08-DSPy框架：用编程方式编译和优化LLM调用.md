# DSPy 框架：用编程方式编译和优化 LLM 调用

在 LLM 应用开发中，我们习惯了这种工作流：
1.  写一个 Prompt。
2.  跑几个例子。
3.  如果不满意，手动改 Prompt。
4.  重复 N 次。
这既不可靠，又难以维护。
DSPy (Declarative Self-improving Python) 提出了一种革命性的理念：**不要写 Prompt，去定义逻辑**。
就像 PyTorch 定义神经网络层一样，DSPy 定义 LLM 模块。
然后，利用**优化器 (Teleprompter)** 在你的数据集上自动搜索最佳 Prompt 和 Few-Shot 示例。

## 1. 核心概念：Signature, Module, Teleprompter

### 1.1 Signature (签名)
类似于函数签名，定义输入输出类型。
```python
import dspy

class GenerateAnswer(dspy.Signature):
    """Answer questions with short factoid answers."""
    context = dspy.InputField(desc="may contain relevant facts")
    question = dspy.InputField()
    answer = dspy.OutputField(desc="often between 1 and 5 words")
```
这就够了。不需要写 "You are a helpful assistant..."，也不需要写 "Answer strictly based on context..."。

### 1.2 Module (模块)
类似于 `torch.nn.Module`，定义处理逻辑。
```python
class RAG(dspy.Module):
    def __init__(self, num_passages=3):
        super().__init__()
        self.retrieve = dspy.Retrieve(k=num_passages)
        self.generate_answer = dspy.ChainOfThought(GenerateAnswer)
    
    def forward(self, question):
        context = self.retrieve(question).passages
        prediction = self.generate_answer(context=context, question=question)
        return dspy.Prediction(context=context, answer=prediction.answer)
```
这就把 RAG 的逻辑（检索 -> 生成）定义好了。

### 1.3 Teleprompter (优化器)
这是最神奇的部分。
`BootstrapFewShot` 是最常用的优化器。
它会拿你的训练集（Question, Answer），让上面的 `RAG` 模块跑一遍。
如果某条数据跑通了（生成了正确的 Answer），它就把这条数据的中间过程（检索到的 Context，生成的 CoT 推理步骤）存下来，作为 Few-Shot 示例放入 Prompt 中。
如果没跑通，就丢弃。

## 2. 为什么 DSPy 比手写 Prompt 好？

### 2.1 自动化 Few-Shot 选择
手写 Few-Shot 很难选出最佳示例。DSPy 通过试错（Bootstrapping），自动找到了那些能让模型推理成功的示例。

### 2.2 适应性
当你换模型（从 GPT-3.5 换到 Llama 3）时，手写的 Prompt 往往失效了（因为不同模型偏好不同）。
DSPy 只需要重新 `compile()` 一次，它会针对新模型重新优化 Prompt。

### 2.3 模块化
复杂的 RAG 流程（多跳推理、自我修正）在 Prompt 里很难写清楚。
在 DSPy 里，就是几个 `dspy.Module` 的组合。

## 3. 实战案例：优化 Multi-Hop QA

假设我们要回答“奥巴马出生那年的美国总统是谁？”
这是一个两步推理：
1.  奥巴马哪年出生？(1961)
2.  1961 年美国总统是谁？(肯尼迪)

### 3.1 定义 Module
```python
class MultiHop(dspy.Module):
    def __init__(self):
        self.generate_query = dspy.ChainOfThought("question -> search_query")
        self.retrieve = dspy.Retrieve(k=3)
        self.generate_answer = dspy.ChainOfThought("context, question -> answer")

    def forward(self, question):
        # Step 1
        query = self.generate_query(question=question).search_query
        passages = self.retrieve(query).passages
        
        # Step 2
        return self.generate_answer(context=passages, question=question)
```

### 3.2 编译
```python
from dspy.teleprompt import BootstrapFewShotWithRandomSearch

teleprompter = BootstrapFewShotWithRandomSearch(metric=dspy.evaluate.answer_exact_match)
compiled_multihop = teleprompter.compile(MultiHop(), trainset=trainset)
```
DSPy 会自动尝试生成不同的 `search_query`，看看哪种 Query 能检索到正确文档，最终回答正确。
它可能会发现："What year was Obama born?" 比 "Obama birth year" 效果好。
然后它就把这个发现固化到 Prompt 里。

DSPy 代表了 AI 开发的未来方向：**声明式编程 (Declarative Programming)**。
你只关心**做什么 (What)**，而不关心**怎么做 (How)**。
Prompt 的细节交给优化器去处理。
如果你还在手动调 Prompt，是时候试试 DSPy 了。
