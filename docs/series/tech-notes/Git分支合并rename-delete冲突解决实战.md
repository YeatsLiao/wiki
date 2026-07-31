# Git分支合并rename-delete冲突解决实战

> 技术栈：Git
> 适用场景：分支合并时遇到 rename/delete、modify/delete 等非内容冲突，搞清状态标识含义并选对解决策略

## 前言

在团队协作开发中，Git分支合并是最常见的操作之一。当不同分支对同一批文件做出不同处理时，就会产生合并冲突。大多数开发者熟悉内容冲突（Content Conflict），但遇到 rename/delete 冲突时往往束手无策。

本文基于真实案例，详细讲解 rename/delete 冲突的产生原因、解决方法和预防措施，帮助你从容应对这类"棘手"的合并冲突。

## 什么是 rename/delete 冲突

### 冲突类型对比

| 冲突类型 | 场景描述 | Git提示 |
|---------|---------|---------|
| 内容冲突 | 双方修改同一文件 | `CONFLICT (content)` |
| rename/delete | 一方移动文件，一方删除文件 | `CONFLICT (rename/delete)` |
| modify/delete | 一方修改文件，一方删除文件 | `CONFLICT (modify/delete)` |

### rename/delete 冲突示例

```
CONFLICT (rename/delete): src/config/app.ini renamed to config/app.ini in dev, but deleted in HEAD.
```

这个提示的含义是：
- `dev` 分支将 `src/config/app.ini` 移动到了 `config/app.ini`
- `HEAD`（当前分支）删除了 `src/config/app.ini`
- Git 无法确定：应该保留移动后的文件，还是执行删除？

## 真实案例复盘

### 场景背景

某项目存在两个主要分支：
- **master**：主分支，执行了目录清理，删除了 `bin/Debug/` 下的编译产物和配置文件
- **dev**：开发分支，进行了目录结构重构，将文件移动到规范化目录

### 冲突现象

执行合并命令后，出现大量冲突：

```bash
$ git merge dev -m "Merge branch 'dev' into master"
CONFLICT (content): Merge conflict in .gitignore
CONFLICT (rename/delete): bin/Debug/AccountMng.ini renamed to Config/AccountMng.ini in dev, but deleted in HEAD.
CONFLICT (rename/delete): bin/Debug/DeviceComm.dll renamed to DLLs/DeviceComm.dll in dev, but deleted in HEAD.
CONFLICT (rename/delete): bin/Debug/Image/logo.png renamed to Resources/logo.png in dev, but deleted in HEAD.
...
# 共计40+个冲突文件
```

### 冲突根因分析

```
master分支操作链：
  bin/Debug/*.ini  ──────► 删除

dev分支操作链：
  bin/Debug/*.ini  ──────► Config/*.ini（移动到规范目录）
```

双方对同一批文件做出了"相反"的操作：一方删除，一方移动。Git 无法自动判断应该保留哪个操作结果。

## 解决方案

### 步骤1：查看冲突状态

```bash
git status --short
```

输出示例：
```
DU Config/AccountMng.ini      # D=deleted by us, U=unmerged
DU DLLs/DeviceComm.dll
DU Resources/logo.png
M  .gitignore                 # M=modified（内容冲突）
```

**状态标识说明**：
- `DU`：我们删除（deleted by us），对方有修改
- `UD`：我们修改，对方删除
- `UU`：双方都修改（内容冲突）

### 步骤2：确定解决策略

对于 rename/delete 冲突，需要决定：

| 策略 | 命令 | 适用场景 |
|------|------|----------|
| 保留移动后的文件 | `git checkout --theirs <file>` | 接受对方的文件移动操作 |
| 执行删除 | `git rm <file>` | 确认文件应该被删除 |
| 保留原位置文件 | `git checkout --ours <file>` | 拒绝移动，保留原状 |

### 步骤3：执行解决方案

**场景A：接受对方的目录重构（推荐）**

```bash
# 接受dev分支的文件移动操作
git add Config/ DLLs/ Resources/

# 或者逐个文件处理
git checkout --theirs Config/AccountMng.ini
git add Config/AccountMng.ini
```

**场景B：确认文件应被删除**

```bash
git rm Config/AccountMng.ini
```

### 步骤4：解决内容冲突

```bash
# 接受dev分支的版本
git checkout --theirs .gitignore
git add .gitignore

# 或手动编辑解决冲突后
git add .gitignore
```

### 步骤5：验证并提交

```bash
# 检查是否还有未解决的冲突
git status --short | grep "^DU\|^UD\|^UU\|^AA"

# 无输出则冲突已全部解决，提交合并
git commit -m "Merge branch 'dev' into master"
```

## 批量处理技巧

### 批量接受对方版本

```bash
# 接受所有冲突文件使用dev分支版本
git checkout --theirs .
git add .
```

### 批量接受当前分支版本

```bash
# 接受所有冲突文件使用当前分支版本
git checkout --ours .
git add .
```

### 按目录批量处理

```bash
# 只处理特定目录的冲突
git checkout --theirs Config/ DLLs/
git add Config/ DLLs/
```

## 预防措施

### 1. 分支同步策略

```bash
# 定期将dev分支合并到master，保持同步
git checkout master
git merge dev --no-ff -m "sync: 定期同步dev分支"
```

### 2. 大规模重构前的准备

```
重构前：
├── 通知所有团队成员
├── 确保所有分支已提交
├── 创建备份分支
└── 重构后立即同步到所有活跃分支
```

### 3. 合并前预检

```bash
# 查看即将合并的提交
git log master..dev --oneline

# 查看文件差异统计
git diff master...dev --stat

# 模拟合并（不实际提交）
git merge dev --no-commit --no-ff
```

### 4. 分支管理规范

```
master (主分支)
    │
    ├── 每周/每两周同步dev分支
    │
dev (开发分支)
    │
    ├── 功能完成后及时合并回master
    │
feature/* (功能分支)
    │
    └── 短生命周期，完成后删除
```

## 应急处理流程

```
┌─────────────────────────────────────────────────────────────────┐
│                   rename/delete 冲突处理流程                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. 发现冲突                                                     │
│     └─► git status --short                                      │
│                                                                 │
│  2. 分析冲突类型                                                 │
│     └─► DU = 我们删除，对方移动/修改                              │
│     └─► UD = 我们修改，对方删除                                  │
│                                                                 │
│  3. 决定解决策略                                                 │
│     └─► 保留移动：git checkout --theirs <file>                   │
│     └─► 执行删除：git rm <file>                                  │
│     └─► 保留原状：git checkout --ours <file>                     │
│                                                                 │
│  4. 标记已解决                                                   │
│     └─► git add <file>                                          │
│                                                                 │
│  5. 验证完成                                                     │
│     └─► git status --short | grep "^DU\|^UD"                    │
│                                                                 │
│  6. 提交合并                                                     │
│     └─► git commit -m "Merge branch 'xxx'"                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 远程仓库注意事项

### 分支保护规则

许多代码托管平台（如GitLab、GitHub、阿里云Codeup）默认对主分支启用保护，禁止强制推送：

```bash
$ git push --force
remote: master:推送规则检查不通过！不允许强制提交。
! [remote rejected] master -> master (pre-receive hook declined)
```

### 应对策略

| 策略 | 操作 | 适用场景 |
|------|------|----------|
| 联系管理员 | 请管理员临时关闭分支保护 | 正式环境紧急修复 |
| 创建新分支 | `git push origin master:master-new` | 需要审核的变更 |
| 使用revert | `git revert` 创建撤销提交 | 不改变历史的回滚 |

### 无法强制推送时的回滚方案

```bash
# 方案：使用revert创建撤销提交
git revert <commit-hash> -m 1
git push

# 或：检出目标状态作为新提交
git checkout <target-commit> -- .
git commit -m "revert: 回滚到xxx状态"
git push
```

## 命令速查表

| 场景 | 命令 |
|------|------|
| 查看冲突文件 | `git status --short` |
| 接受对方版本 | `git checkout --theirs <file>` |
| 接受当前版本 | `git checkout --ours <file>` |
| 标记冲突已解决 | `git add <file>` |
| 放弃合并 | `git merge --abort` |
| 查看合并基点 | `git merge-base master dev` |
| 模拟合并 | `git merge --no-commit --no-ff` |
| 批量接受对方 | `git checkout --theirs . && git add .` |

## 总结

rename/delete 冲突虽然看起来复杂，但本质上是 Git 在询问你："这个文件应该保留还是删除？"

**核心要点**：
1. 理解 `DU`/`UD` 状态标识的含义
2. 根据业务需求选择 `--theirs`（保留移动）或 `git rm`（执行删除）
3. 大规模目录重构后及时同步分支
4. 了解远程仓库的分支保护规则

**记住**：冲突不可怕，可怕的是不了解冲突的原因。掌握原理，就能从容应对。
