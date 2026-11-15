# 任务跟踪：GitHub Issues

本仓库的任务和需求记录在 DCZJtAWhH/link-game 的 GitHub Issues 中。
使用 gh CLI 操作；在仓库目录内运行时，从 Git remote 推断目标仓库。

## 常用操作

- 创建：gh issue create --title "标题" --body-file <正文文件>
- 读取：gh issue view <编号> --json number,title,body,labels,comments
- 列表：gh issue list --state open --json number,title,body,labels
- 更新正文：gh issue edit <编号> --body-file <正文文件>
- 评论：gh issue comment <编号> --body-file <正文文件>
- 添加标签：gh issue edit <编号> --add-label "标签"
- 移除标签：gh issue edit <编号> --remove-label "标签"
- 关闭：gh issue close <编号>

多行正文通过 UTF-8 临时文件配合 --body-file 传入，保留真实换行。
标签含义和映射见 triage-labels.md。

## 技能指令的含义

- “发布到任务跟踪系统”：创建 GitHub Issue。
- “获取相关任务”：读取对应 Issue 的正文、标签和评论。

## Pull requests as a triage surface

**PRs as a request surface: no.**

## 父子任务与依赖

使用 GitHub 原生子任务关系组织父子任务。
无法建立原生关系时，在子任务正文顶部写 Part of #<父任务编号>，
并在父任务正文中维护子任务清单。

使用 GitHub 原生任务依赖表示阻塞关系。
无法建立原生依赖时，在被阻塞任务正文顶部写
Blocked by: #<编号>, #<编号>。
所有阻塞任务关闭后，该任务才解除阻塞。
