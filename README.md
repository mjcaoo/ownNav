# Personal Nav Dashboard

一个带管理后台的个人导航站，功能风格类似 OneNav：前台用于展示分类导航链接，后台用于维护分类、链接和站点基础信息。

## 功能

- 前台导航首页
- 分类筛选和关键词搜索
- 链接卡片展示
- 后台登录保护
- 链接增删改查
- 分类增删改查
- 站点标题、副标题、Logo 文本和主题色设置
- 本地 JSON 数据持久化

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
ADMIN_PASSWORD="admin123456"
```

## 数据文件

导航数据保存在：

```text
data/navigation.json
```

修改后台内容后，该文件会自动更新。

## 构建

```bash
npm run lint
npm run build
```
