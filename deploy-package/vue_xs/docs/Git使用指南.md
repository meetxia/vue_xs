# 📦 Git使用指南

**项目：** MOMO炒饭店小说网站 V2.0  
**仓库地址：** https://github.com/meetxia/vue_xs.git  
**编写者：** 工程师A  
**日期：** 2025-10-27

---

## 📋 目录

1. [仓库信息](#仓库信息)
2. [克隆仓库](#克隆仓库)
3. [分支策略](#分支策略)
4. [提交规范](#提交规范)
5. [常用命令](#常用命令)
6. [协作流程](#协作流程)

---

## 🔗 仓库信息

```yaml
仓库地址: https://github.com/meetxia/vue_xs.git
仓库名称: vue_xs
组织/用户: meetxia
默认分支: main (推荐) 或 master
```

### 克隆地址

```bash
# HTTPS (推荐)
https://github.com/meetxia/vue_xs.git

# SSH (需要配置SSH密钥)
git@github.com:meetxia/vue_xs.git
```

---

## 💻 克隆仓库

### 首次克隆

```powershell
# 克隆仓库
git clone https://github.com/meetxia/vue_xs.git

# 进入项目目录
cd vue_xs

# 查看远程仓库
git remote -v
# 应显示:
# origin  https://github.com/meetxia/vue_xs.git (fetch)
# origin  https://github.com/meetxia/vue_xs.git (push)
```

### 如果已有本地项目

```powershell
# 进入项目目录
cd H:\momo-ruanjiansheji\axs_html\deploy-package\vue_xs

# 添加远程仓库
git remote add origin https://github.com/meetxia/vue_xs.git

# 验证远程仓库
git remote -v

# 推送代码到远程仓库
git push -u origin master
# 或
git push -u origin main
```

---

## 🌲 分支策略

### 分支命名规范

```
main/master    - 生产分支（受保护）
develop        - 开发分支
feature/*      - 功能分支
bugfix/*       - Bug修复分支
hotfix/*       - 热修复分支
release/*      - 发布分支
```

### 分支示例

```
feature/user-login        - 用户登录功能
feature/novel-reader      - 小说阅读器
bugfix/login-validation   - 修复登录验证bug
hotfix/security-patch     - 安全补丁
```

---

## 📝 提交规范

### Commit Message格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type类型

```
feat:     新功能
fix:      修复bug
docs:     文档更新
style:    代码格式（不影响功能）
refactor: 重构
perf:     性能优化
test:     测试
chore:    构建/工具
```

### Scope范围

```
auth:     认证相关
user:     用户相关
novel:    小说相关
comment:  评论相关
admin:    管理后台
ui:       UI组件
api:      API接口
db:       数据库
```

### 提交示例

```bash
# 简单提交
git commit -m "feat(auth): 完成用户登录功能"

# 详细提交
git commit -m "feat(auth): 完成用户登录功能

- 实现JWT认证
- 添加密码加密
- 完成登录表单验证
- 添加错误提示

Closes #123"
```

---

## 🔧 常用命令

### 基础操作

```bash
# 查看状态
git status

# 查看更改
git diff

# 添加文件
git add .                    # 添加所有文件
git add src/               # 添加指定目录
git add src/App.vue        # 添加指定文件

# 提交
git commit -m "提交信息"

# 推送
git push origin 分支名
```

---

### 分支操作

```bash
# 查看所有分支
git branch -a

# 创建分支
git branch feature/user-login

# 切换分支
git checkout feature/user-login

# 创建并切换分支（推荐）
git checkout -b feature/user-login

# 删除本地分支
git branch -d feature/user-login

# 删除远程分支
git push origin --delete feature/user-login
```

---

### 同步代码

```bash
# 拉取最新代码
git pull origin main

# 等同于
git fetch origin
git merge origin/main

# 拉取并变基（保持提交历史整洁）
git pull --rebase origin main
```

---

### 合并分支

```bash
# 切换到目标分支
git checkout main

# 合并功能分支
git merge feature/user-login

# 推送到远程
git push origin main
```

---

### 撤销操作

```bash
# 撤销工作区修改
git checkout -- 文件名

# 撤销暂存区修改
git reset HEAD 文件名

# 撤销上一次提交（保留修改）
git reset --soft HEAD^

# 撤销上一次提交（不保留修改）
git reset --hard HEAD^

# 查看历史提交
git log --oneline

# 回退到指定提交
git reset --hard commit_hash
```

---

### 查看历史

```bash
# 查看提交历史
git log

# 简洁模式
git log --oneline

# 图形化显示
git log --graph --oneline --all

# 查看文件修改历史
git log -p 文件名

# 查看谁修改了文件
git blame 文件名
```

---

## 👥 协作流程

### 工程师A（Leader）

```bash
# 1. 创建develop分支
git checkout -b develop
git push -u origin develop

# 2. 审查代码后合并
git checkout main
git merge develop
git push origin main

# 3. 打标签发布
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0
```

---

### 工程师B、C（开发）

```bash
# 1. 克隆仓库
git clone https://github.com/meetxia/vue_xs.git
cd vue_xs

# 2. 创建功能分支
git checkout -b feature/user-login

# 3. 开发...

# 4. 提交代码
git add .
git commit -m "feat(auth): 完成用户登录功能"

# 5. 推送到远程
git push origin feature/user-login

# 6. 创建Pull Request（在GitHub上）
# 或直接合并到develop
git checkout develop
git pull origin develop
git merge feature/user-login
git push origin develop
```

---

## 🔄 每日工作流程

### 开始工作前

```bash
# 1. 拉取最新代码
git checkout develop
git pull origin develop

# 2. 创建功能分支
git checkout -b feature/今天的功能

# 3. 开始开发...
```

### 工作结束时

```bash
# 1. 查看修改
git status
git diff

# 2. 提交代码
git add .
git commit -m "feat(module): 完成XX功能"

# 3. 推送到远程
git push origin feature/今天的功能

# 4. 合并到develop（或等待Code Review）
git checkout develop
git merge feature/今天的功能
git push origin develop
```

---

## 🆘 常见问题

### Q1: 忘记切换分支，在main上开发了

```bash
# 保存当前修改
git stash

# 切换到正确的分支
git checkout -b feature/correct-branch

# 恢复修改
git stash pop
```

---

### Q2: 代码冲突了

```bash
# 1. 拉取代码时冲突
git pull origin develop
# 显示冲突

# 2. 手动解决冲突（编辑文件）
# 找到 <<<<<<< HEAD 和 >>>>>>> 之间的内容

# 3. 标记为已解决
git add 冲突文件

# 4. 提交
git commit -m "fix: 解决合并冲突"
```

---

### Q3: 提交了错误的代码

```bash
# 撤销上一次提交（保留修改）
git reset --soft HEAD^

# 修改代码...

# 重新提交
git add .
git commit -m "正确的提交信息"
```

---

### Q4: 如何更新fork的仓库

```bash
# 添加上游仓库
git remote add upstream https://github.com/原始仓库/vue_xs.git

# 拉取上游更新
git fetch upstream

# 合并到本地
git checkout main
git merge upstream/main

# 推送到自己的仓库
git push origin main
```

---

## 📊 Git最佳实践

### ✅ 推荐做法

```
✅ 频繁提交（每完成一个小功能就提交）
✅ 提交信息要清晰
✅ 每天至少推送一次
✅ 在功能分支开发
✅ 代码合并前先拉取最新代码
✅ 使用.gitignore忽略不必要的文件
✅ 重要节点打标签
```

### ❌ 避免做法

```
❌ 直接在main分支开发
❌ 提交信息写"update"、"fix"等无意义内容
❌ 提交包含密码、密钥的文件
❌ 提交node_modules等依赖文件
❌ 长时间不推送代码
❌ 强制推送（git push -f）到main分支
```

---

## 🔐 .gitignore配置

项目已配置`.gitignore`，包含：

```gitignore
# 依赖
node_modules/

# 环境变量（注意：开发阶段可能需要共享.env示例）
.env
.env.local
.env.production

# 构建产物
dist/
build/

# IDE
.vscode/
.idea/

# 日志
logs/
*.log

# OS
.DS_Store
Thumbs.db
```

---

## 📚 学习资源

### 官方文档

- Git官方文档: https://git-scm.com/doc
- GitHub文档: https://docs.github.com/

### 推荐教程

- Git教程 - 廖雪峰: https://www.liaoxuefeng.com/wiki/896043488029600
- Pro Git（中文版）: https://git-scm.com/book/zh/v2

### 可视化工具

- GitHub Desktop: https://desktop.github.com/
- GitKraken: https://www.gitkraken.com/
- SourceTree: https://www.sourcetreeapp.com/

---

## 🎯 团队Git规范

### 提交频率

```
工程师A: 每天至少1-2次
工程师B: 每完成一个组件提交一次
工程师C: 每完成一个API提交一次
```

### Code Review

```
时间: 每天17:00
方式: GitHub Pull Request 或 直接Review
要求: 至少1人Review通过才能合并
```

### 分支保护

```
main分支:
  - 禁止直接推送
  - 需要Code Review
  - 通过CI测试

develop分支:
  - 可以直接推送
  - 建议Review
```

---

## 📞 需要帮助？

遇到Git问题：
1. 查看本文档
2. Google/百度搜索
3. 问工程师A
4. 查看官方文档

---

**编写者：** 工程师A  
**最后更新：** 2025-10-27  
**版本：** v1.0

