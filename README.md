# y悠悠の宝藏之地

> 个人博客 & 创意空间 — ayuu.fun

一个基于 Next.js 构建的全功能个人博客平台，集成了文章管理、音乐播放、照片墙、留言板、友链、项目展示等模块。

## 功能特性

- 📝 **博客系统** — 文章发布、分类标签、富文本编辑器（TipTap）、评论互动
- 🎵 **音乐播放器** — 云音乐集成、歌词显示、浮动播放器
- 📷 **照片墙** — 图片瀑布流展示、上传管理
- 💬 **留言板（Chatter）** — 弹幕背景、实时互动
- 🌳 **树洞（Tree）** — 匿名心情分享
- 👥 **友链** — 友情链接管理
- 🛠 **工具箱** — 天气查询等实用小工具
- 🔐 **后台管理** — 博客/评论/用户/图片/音乐/站点配置/标签/项目/日志 全方位管理
- 🎨 **视觉效果** — 背景轮播、樱花/雪花粒子、萤火虫、页面切换动画、弹幕背景
- 📱 **响应式设计** — 移动端适配

## 技术栈

| 层级 | 技术 |
|------|------|
| 框架 | Next.js 15 (App Router) |
| 语言 | TypeScript |
| 样式 | Tailwind CSS |
| 编辑器 | TipTap |
| 3D | Three.js / React Three Fiber |
| 数据库 | SQLite (better-sqlite3) |
| 部署 | PM2 + Nginx |

## 项目结构

```
├── app/                # Next.js App Router 页面
│   ├── admin/          # 后台管理页面
│   ├── api/            # API 路由
│   ├── about/          # 关于页
│   ├── chatter/        # 留言板
│   ├── friends/        # 友链
│   ├── login/          # 登录/注册
│   ├── moments/        # 动态
│   ├── music/          # 音乐页
│   ├── photowall/      # 照片墙
│   ├── posts/          # 博客文章
│   ├── projects/       # 项目展示
│   ├── timeline/       # 时间线
│   ├── tools/          # 工具箱
│   └── tree/           # 树洞
├── components/         # 通用组件
├── lib/                # 工具库（数据库、认证、存储、API）
├── data/               # 静态数据 & SQLite 数据库
├── public/             # 静态资源
└── siteConfig.ts       # 全站配置中心
```

## 快速开始

```bash
# 克隆项目
git clone git@github.com:scoodiy/Deployment-of-ai-projects.git
cd Deployment-of-ai-projects

# 安装依赖
npm install

# 复制环境配置
cp .env.example .env
# 编辑 .env 填入配置

# 开发模式
npm run dev

# 构建 & 启动
npm run build
npm start
```

## 环境变量

参考 `.env.example` 配置以下变量：

- `ADMIN_PASSWORD` — 管理员密码
- `JWT_SECRET` — JWT 签名密钥
- 其他可选配置见 `.env.example`

## License

MIT
