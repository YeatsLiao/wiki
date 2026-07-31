# Git 实用技巧速查

> 覆盖：新仓库抹除旧提交历史。后续 git 技巧条目直接追加本篇。

## 一、把现有代码放入新仓库且不带旧提交历史

**场景**：基于开源项目（如 RuoYi）二次开发，代码要放进自己的新仓库，但不想把原项目几千条提交历史带过去。

### 方法：orphan 孤儿分支法

```bash
# 1. 创建无历史的孤儿分支（工作区文件保持不变）
git checkout --orphan latest_branch

# 2. 全部文件加入暂存并做首次提交
git add -A
git commit -am "Initial commit"

# 3. 删除旧 master，把孤儿分支转正
git branch -D master
git branch -m master

# 4. 强推到新仓库
git push -f origin master
```

**原理**：`--orphan` 创建的分支没有任何父提交，工作区文件原样保留，提交后即形成「只有一条初始提交」的干净历史。

**注意**：

- 强推是破坏性操作，确认远端是**新建的空仓库**（或确实要覆盖）再执行
- 如果远端默认分支是 `main`，把上面命令里的 `master` 替换为 `main`
- 抹历史意味着无法追溯原项目的变更记录，二开项目建议在 README 里注明基于的原项目版本号
