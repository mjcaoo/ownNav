# Personal Nav Dashboard

一个带管理后台的个人导航站，功能风格类似 OneNav：前台用于展示分类导航链接，后台用于维护分类、链接和站点基础信息。

## 功能

- 前台导航首页，支持分类筛选和关键词搜索（`Ctrl+K` 快捷键）
- 链接卡片展示（favicon 图标、标题、描述、置顶标记）
- 后台登录保护（签名 Cookie + 环境变量密码）
- 链接增删改查 + 浏览器书签 HTML 导入
- 分类增删改查，支持父子级嵌套
- 站点标题、副标题、Logo 文本和主题色设置
- SQLite 数据库持久化（WAL 模式）

## 技术栈

- **框架**: Next.js 16 (App Router) + React 19
- **样式**: Tailwind CSS v4
- **数据库**: better-sqlite3 (WAL mode, foreign keys)
- **中文拼音**: pinyin-pro（分类名自动生成 slug）
- **语言**: TypeScript

## 开发运行

```bash
npm install
npm run dev
```

访问：

- 前台：http://localhost:3000
- 后台：http://localhost:3000/admin

默认后台密码在 `.env` 中配置：

```env
ADMIN_PASSWORD="your-password"
```

首次运行时会在 `data/` 目录自动创建 `navigation.sqlite` 数据库文件。

## 数据文件

导航数据保存在 SQLite 数据库：

```text
data/navigation.sqlite
```

修改后台内容后，数据库会自动更新。

## Docker 部署

```bash
docker compose up -d
```

## 构建

```bash
npm run lint
npm run build
```
