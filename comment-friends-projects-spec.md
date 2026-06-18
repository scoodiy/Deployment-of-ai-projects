# 需求：评论系统 + 友链后台管理 + 项目后台管理

## 一、评论系统（替换 Gitalk）

### 目标
去掉 Gitalk，改用网站自己的用户登录系统。只有登录用户才能发评论。

### 数据库
- 现有 `comments` 表的 `target_type` 只支持 `'blog', 'media'`，需要扩展支持 `'music', 'friend', 'project'`
- 修改 CHECK 约束：`CHECK(target_type IN ('blog', 'media', 'music', 'friend', 'project'))`
- 新增字段：`parent_id INTEGER DEFAULT NULL`（回复功能，可选）
- 新增字段：`updated_at DATETIME DEFAULT CURRENT_TIMESTAMP`

### API 路由

#### GET /api/comments?target_type=music&target_id=1
- 无需登录
- 返回 approved 状态的评论列表
- 包含用户信息（nickname, avatar）
- 按 created_at 倒序

#### POST /api/comments
- 需要用户登录（从 Authorization header 读 user_token）
- body: { target_type, target_id, content, parent_id? }
- status 默认 'approved'（直接通过，不需要审核）

#### DELETE /api/comments/[id]
- 需要用户登录
- 只能删除自己的评论

#### GET /api/admin/comments
- 需要管理员登录
- 返回所有评论，可筛选 status

#### PUT /api/admin/comments/[id]
- 需要管理员登录
- 修改 status（approved/rejected）

#### DELETE /api/admin/comments/[id]
- 需要管理员登录
- 删除任意评论

### 前端组件：SiteComments
- 替换 `components/Comments.tsx`（Gitalk 版）
- 新建 `components/SiteComments.tsx`
- Props: `targetType: string, targetId: number | string`
- 功能：
  - 显示评论列表（头像、昵称、内容、时间）
  - 未登录：显示"请先登录后评论" + 跳转登录链接
  - 已登录：显示评论输入框 + 发送按钮
  - 支持删除自己的评论
  - 毛玻璃风格，和现有 UI 一致

### 页面改造
- `app/music/MusicClient.tsx`：底部留言板改为 `<SiteComments targetType="music" targetId={0} />`（music 页面是通用评论区，targetId 用 0）
- `app/friends/FriendsBoard.tsx`：底部评论区改为 `<SiteComments targetType="friend" targetId={0} />`
- `app/posts/[slug]/page.tsx`：如果有 Gitalk Comments 也替换

### 管理后台
- 新建 `/admin/comments` 页面
- 评论列表，支持按状态筛选
- 支持批准/拒绝/删除操作

---

## 二、友链后台管理

### 数据库
新建 `friends` 表：
```sql
CREATE TABLE IF NOT EXISTS friends (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  description TEXT DEFAULT '',
  avatar TEXT DEFAULT '',
  theme_color TEXT DEFAULT 'rgba(99, 102, 241, 0.5)',
  sort_order INTEGER DEFAULT 0,
  is_enabled INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  version INTEGER DEFAULT 1
);
```

### API
- GET /api/friends — 公开接口，返回 is_enabled=1 的友链
- GET /api/admin/friends — 管理员接口，返回全部
- POST /api/admin/friends — 新增
- PUT /api/admin/friends/[id] — 编辑
- DELETE /api/admin/friends/[id] — 删除

### 前端
- `FriendsBoard.tsx` 改为从 `/api/friends` 读取数据（不再从 `data/friends.ts`）
- 后台新建 `/admin/friends` 页面，表格列表+表单 CRUD

---

## 三、项目后台管理

### 数据库
新建 `projects` 表：
```sql
CREATE TABLE IF NOT EXISTS projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  icon TEXT DEFAULT '🚀',
  github_url TEXT DEFAULT '',
  tags TEXT DEFAULT '[]',
  sort_order INTEGER DEFAULT 0,
  is_enabled INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  version INTEGER DEFAULT 1
);
```

### API
- GET /api/projects — 公开接口，返回 is_enabled=1 的项目
- GET /api/admin/projects — 管理员接口，返回全部
- POST /api/admin/projects — 新增
- PUT /api/admin/projects/[id] — 编辑
- DELETE /api/admin/projects/[id] — 删除

### 前端
- `ProjectsBoard.tsx` 改为从 `/api/projects` 读取数据（不再从 `data/projects.ts`）
- 后台新建 `/admin/projects` 页面，表格列表+表单 CRUD

---

## 四、数据迁移

- 将 `data/friends.ts` 中的现有数据插入 friends 表
- 将 `data/projects.ts` 中的现有数据插入 projects 表

## 五、注意事项

- 项目路径：/opt/xhblogs
- 数据库：SQLite，路径 data/ayuu.db
- 用户认证用 user_token（从 localStorage 读，放在 Authorization header）
- 管理员认证用 admin_token（cookie）
- 现有的 UserProvider 在 components/UserProvider.tsx
- 现有的 Comments 组件用 Gitalk，需要保留 Gitalk 版本作为备份，新建 SiteComments
- 不要改动其他正常运行的服务
- 构建后需要 rm -rf .next && npm run build
- 完成后重启 pm2
