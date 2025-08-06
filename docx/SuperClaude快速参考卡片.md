# SuperClaude 快速参考卡片 🚀

> 📋 **打印友好版本** | 适合新手用户 | 随时查阅

---

## 🔥 必备10命令

| 命令 | 用途 | 示例 |
|------|------|------|
| `/sc:load @.` | 📂 加载项目 | 开始工作前必用 |
| `/sc:analyze @src` | 🔍 代码分析 | 找问题、看质量 |
| `/sc:implement 功能` | ⚡ 实现功能 | 写新代码 |
| `/sc:improve @文件` | 🚀 优化代码 | 提升性能质量 |
| `/sc:test @目录` | 🧪 运行测试 | 验证代码正确性 |
| `/sc:explain 概念` | 📚 概念解释 | 学习新知识 |
| `/sc:document @文件` | 📝 生成文档 | 自动写文档 |
| `/sc:troubleshoot 问题` | 🔧 问题诊断 | 修复Bug |
| `/sc:git commit` | 📦 Git操作 | 智能提交 |
| `/sc:index` | 📖 查看命令 | 找其他命令 |

---

## 🏷️ 常用参数

| 参数 | 作用 | 何时使用 |
|------|------|----------|
| `--quick` | ⚡ 快速模式 | 需要快速结果时 |
| `--safe-mode` | 🛡️ 安全模式 | 修改重要代码时 |
| `--backup` | 💾 创建备份 | 大改动前 |
| `--verbose` | 📊 详细输出 | 需要了解详情时 |
| `--auto-fix` | 🔧 自动修复 | 信任自动修复时 |
| `--dry-run` | 👀 模拟执行 | 想先看看效果 |

---

## 📁 文件路径语法

| 写法 | 含义 | 示例 |
|------|------|------|
| `@.` | 当前目录 | `/sc:load @.` |
| `@src` | src文件夹 | `/sc:analyze @src` |
| `@file.js` | 具体文件 | `/sc:improve @app.js` |
| `@src/*.js` | 所有JS文件 | `/sc:test @src/*.js` |

---

## 🎯 新手3步法

### 第1步：了解项目
```bash
/sc:load @.
```

### 第2步：分析现状
```bash
/sc:analyze @src --quick
```

### 第3步：开始改进
```bash
/sc:improve @src --safe-mode
```

---

## 🚨 紧急救援

### 命令不工作？
1. 重启Claude Code
2. 检查安装：`python -m SuperClaude install --diagnose`
3. 重新安装：`python -m SuperClaude install --force`

### 执行太慢？
- 加上 `--quick` 参数
- 先用 `/sc:load @.` 建立上下文
- 把复杂任务分解成简单任务

### 结果不满意？
- 提供更详细的描述
- 使用 `--type` 指定类型
- 先用 `/sc:explain` 了解概念

---

## 🎭 智能专家系统

SuperClaude会自动选择合适的专家：

- 🏗️ **架构师** - 系统设计
- 🎨 **前端专家** - 用户界面  
- ⚙️ **后端专家** - 服务器端
- 🔍 **分析师** - 问题诊断
- 🛡️ **安全专家** - 安全防护
- ✍️ **文档专家** - 文档编写

---

## 💡 每日工作流

### 🌅 开始工作
```bash
/sc:load @.                    # 加载项目
/sc:analyze @. --health-check  # 健康检查
```

### 💻 开发过程
```bash
/sc:implement 新功能           # 实现功能
/sc:test @新代码               # 测试验证
/sc:improve @代码 --performance # 性能优化
```

### 🌙 结束工作
```bash
/sc:document @修改的文件        # 更新文档
/sc:git commit --smart-message # 智能提交
```

---

## 🆘 常见问题速查

| 问题 | 解决方案 |
|------|----------|
| 命令无响应 | 重启Claude Code |
| 执行很慢 | 加 `--quick` 参数 |
| 修改有风险 | 加 `--safe-mode` 参数 |
| 不知道用什么命令 | 用 `/sc:index` 查看 |
| 不理解概念 | 用 `/sc:explain 概念` |
| 代码有问题 | 用 `/sc:troubleshoot 问题描述` |

---

## 🎓 学习建议

### 第1天：基础命令
- `/sc:explain` - 学习概念
- `/sc:load` - 加载项目
- `/sc:index` - 查看命令

### 第1周：实用命令  
- `/sc:analyze` - 分析代码
- `/sc:implement` - 实现功能
- `/sc:improve` - 优化代码

### 第1月：高级功能
- Wave系统体验
- 工作流集成
- 团队协作

---

## 🔗 更多资源

- 📖 **完整指南**：`SuperClaude新手使用指南.md`
- 🌐 **官方网站**：https://superclaude-org.github.io/
- 💻 **GitHub**：https://github.com/SuperClaude-Org/SuperClaude_Framework

---

**💡 记住：SuperClaude是你的AI编程助手，不要害怕尝试！**

*🖨️ 建议打印此卡片，放在桌边随时查阅*
