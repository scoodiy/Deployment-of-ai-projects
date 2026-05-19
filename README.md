# QuantBot - 量化交易机器人系统

## 项目简介

QuantBot 是一个全栈量化交易机器人系统，支持 A 股和加密货币的自动化交易策略执行、实时风控管理、市场数据采集和智能问答。系统采用微服务架构，各模块独立部署、松耦合通信。

**核心能力：**
- 多策略引擎（网格、马丁格尔、趋势跟踪 + 用户自定义策略）
- 实时风控（仓位限制、每日亏损、连续亏损、熔断机制）
- 多源数据采集（A股：东方财富/同花顺，加密货币：Binance/OKX/Bybit）
- RAG 智能问答（意图识别 → 文档检索 → 重排序 → 生成回答）
- 现代化暗色主题前端（React + TypeScript + Tailwind CSS + 代码分割）

---

## 系统架构

```
┌─────────────────────────────────────────────────────────────────┐
│                    Frontend (React + Vite + Tailwind)            │
│     Dashboard │ Trading │ Strategies │ Risk │ Stocks │ Crypto    │
│     QABot │ Admin                                                │
│              (React.lazy 代码分割 + ErrorBoundary 错误边界)         │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTP REST / WebSocket
┌──────────────────────────┴──────────────────────────────────────┐
│                    Backend (FastAPI + JWT Auth)                   │
│    /users │ /trades │ /strategies │ /risk │ /stocks │ /crypto    │
│    /qa │ /health                                                 │
└──────┬──────────┬──────────┬──────────┬─────────────────────────┘
       │          │          │          │
┌──────┴───┐ ┌───┴────┐ ┌───┴──────┐ ┌─┴──────────┐
│ Strategy │ │  Risk  │ │   Data   │ │   QA Bot   │
│  Engine  │ │ Engine │ │Collector │ │   (RAG)    │
│ Grid     │ │ Rules  │ │ Stock    │ │ Intent     │
│ Martingale│ │ Notifier│ │ Crypto │ │ Retriever  │
│ Trend    │ │Emergency│ │ Pipeline│ │ Generator  │
└──────────┘ └────────┘ └──────────┘ └────────────┘
       │          │          │
┌──────┴──────────┴──────────┴────────────────────────────────────┐
│              Kafka (异步消息)  │  Redis (缓存/实时数据)           │
└─────────────────────────────────────────────────────────────────┘
                           │
┌──────────────────────────┴──────────────────────────────────────┐
│              PostgreSQL (持久化存储)                              │
│   users │ trades │ strategies │ risk_rules │ knowledge           │
└─────────────────────────────────────────────────────────────────┘
```

---

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React 18 + TypeScript + Vite + Tailwind CSS + Recharts + Zustand |
| 后端 | FastAPI + Pydantic + JWT + httpx |
| 策略引擎 | Python + NumPy + Pandas + TA-Lib |
| 风控引擎 | Python + httpx + asyncio |
| 数据采集 | Python + httpx + APScheduler |
| QA Bot | Python + NumPy + scikit-learn + jieba |
| 数据库 | PostgreSQL + Redis |
| 消息队列 | Kafka |
| 部署 | Docker Compose / Kubernetes |

---

## 目录结构

```
quant-trading-bot/
├── frontend/                    # React + TypeScript + Vite 前端
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/          # Card, Button, Input, Badge, Table, Modal, Toast, ErrorBoundary
│   │   │   ├── layout/          # Sidebar, Header, Layout
│   │   │   └── charts/          # PriceChart, PnLChart, RiskGauge, AllocationPie
│   │   ├── pages/
│   │   │   ├── dashboard/       # 仪表盘（资产概览、价格走势、盈亏图）
│   │   │   ├── trading/         # 交易（下单表单、持仓、订单簿）
│   │   │   ├── strategies/      # 策略管理（创建、启停、配置）
│   │   │   ├── risk/            # 风控面板（指标仪表盘、告警列表）
│   │   │   ├── stocks/          # A股行情（搜索、K线、详情）
│   │   │   ├── crypto/          # 加密货币（多交易所、实时行情）
│   │   │   ├── qa-bot/          # 智能问答（聊天界面、源引用）
│   │   │   ├── admin/           # 管理面板（用户、服务状态）
│   │   │   └── Login.tsx        # 登录页（首屏同步加载）
│   │   ├── stores/              # Zustand 状态管理
│   │   ├── services/            # API 调用层（axios）
│   │   ├── hooks/               # useAuth, useWebSocket
│   │   ├── utils/               # format, constants
│   │   ├── types/               # TypeScript 类型定义
│   │   ├── App.tsx              # 路由配置（React.lazy 代码分割 + ErrorBoundary）
│   │   └── main.tsx             # 入口
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── tsconfig.json
│
├── backend/                     # FastAPI 后端
│   ├── app/
│   │   ├── api/v1/              # API 路由（users, trades, strategies, risk, stocks, crypto, qa）
│   │   ├── core/                # config, security (JWT), events (lifespan)
│   │   ├── models/              # Pydantic 模型（user, trade, strategy, risk）
│   │   ├── schemas/             # 请求/响应 Schema
│   │   ├── main.py              # FastAPI 应用入口
│   │   └── utils.py             # 工具函数
│   ├── services/                # 业务逻辑（trading, market, strategy）
│   ├── repositories/            # 数据访问层（base, user, trade, strategy）
│   ├── requirements.txt
│   └── Dockerfile
│
├── strategy-engine/             # 策略引擎（独立进程）
│   ├── engine/
│   │   ├── loader.py            # 动态加载策略类
│   │   ├── runner.py            # 策略运行器（asyncio）
│   │   ├── scheduler.py         # 策略调度器
│   │   └── signals.py           # 信号定义与合并
│   ├── strategies/
│   │   ├── base.py              # BaseStrategy 抽象基类
│   │   ├── grid.py              # 网格交易策略
│   │   ├── martingale.py        # 马丁格尔策略
│   │   └── trend_following.py   # 趋势跟踪策略（EMA交叉 + ATR止损）
│   ├── user_strategies/         # 用户自定义策略目录
│   │   └── example_custom.py    # 示例自定义策略
│   ├── requirements.txt
│   └── Dockerfile
│
├── risk-engine/                 # 风控引擎（独立进程）
│   ├── engine/
│   │   ├── checker.py           # 风控检查器（聚合所有规则）
│   │   ├── rules/
│   │   │   ├── position_limit.py    # 仓位限制
│   │   │   ├── daily_loss.py        # 每日亏损监控
│   │   │   ├── consecutive_loss.py  # 连续亏损保护
│   │   │   ├── circuit_breaker.py   # 熔断机制
│   │   │   └── api_monitor.py       # API 健康监控
│   │   ├── notifier.py          # 告警通知（日志/Webhook/邮件）
│   │   └── emergency.py         # 紧急处理（暂停交易、平仓）
│   ├── requirements.txt
│   └── Dockerfile
│
├── data-collector/              # 数据采集服务
│   ├── collectors/
│   │   ├── stock/
│   │   │   ├── market_data.py   # 股票行情采集
│   │   │   ├── financials.py    # 财务数据采集
│   │   │   ├── announcements.py # 公告采集
│   │   │   └── adapters/
│   │   │       ├── eastmoney.py # 东方财富 API 适配器
│   │   │       └── tonghuashun.py # 同花顺 API 适配器
│   │   └── crypto/
│   │       ├── binance.py       # Binance API
│   │       ├── okx.py           # OKX API
│   │       └── bybit.py         # Bybit API
│   ├── pipeline/
│   │   ├── cleaner.py           # 数据清洗（去异常值、补缺）
│   │   ├── normalizer.py        # 数据标准化（跨交易所符号转换）
│   │   └── storage.py           # 数据存储（Redis 缓存 + DB）
│   ├── scheduler/               # 定时采集调度
│   ├── requirements.txt
│   └── Dockerfile
│
├── qa-bot/                      # RAG 智能问答
│   ├── bot/
│   │   ├── router.py            # 查询路由
│   │   ├── intent.py            # 意图分类器（关键词匹配）
│   │   ├── query_rewriter.py    # 查询改写（上下文消歧）
│   │   ├── retriever.py         # 文档检索（向量相似度）
│   │   ├── reranker.py          # 重排序（BM25）
│   │   ├── generator.py         # 答案生成（模板 + 上下文）
│   │   └── guard.py             # 输出合规检查
│   ├── knowledge/
│   │   ├── loader.py            # 知识库加载
│   │   ├── chunker.py           # 文本分块
│   │   ├── embedder.py          # 文本向量化（TF-IDF + SVD）
│   │   └── indexer.py           # 向量索引与检索
│   ├── rag/
│   │   └── pipeline.py          # RAG 流水线编排
│   ├── prompts/                 # 提示模板
│   ├── requirements.txt
│   └── Dockerfile
│
├── common/                      # 公共模块（所有服务共享）
│   ├── models/                  # Pydantic 数据模型（market, trade, risk）
│   ├── exceptions/              # 自定义异常类
│   ├── constants/               # 枚举与常量
│   └── utils/                   # 工具函数（日志、重试、ID生成）
│
├── deploy/                      # 部署配置
│   ├── docker/
│   │   ├── docker-compose.yml       # 开发环境
│   │   ├── docker-compose.prod.yml  # 生产环境覆盖
│   │   └── Dockerfile.frontend      # 前端多阶段构建
│   ├── k8s/                         # Kubernetes 部署清单
│   └── scripts/                     # 部署脚本
│
├── tests/                       # 测试代码
│   ├── unit/                    # 单元测试（模型、策略、风控规则、QA）
│   ├── integration/             # 集成测试（API 端点）
│   └── e2e/                     # 端到端测试（完整交易流程）
│
├── docs/                        # 文档
├── scripts/                     # 开发脚本
├── pyproject.toml               # Python 项目配置
├── Makefile                     # 常用命令
├── .env.example                 # 环境变量模板
└── .gitignore
```

---

## 模块说明

### Frontend (React + TypeScript + Vite)
现代化暗色主题交易界面，使用 Tailwind CSS + glassmorphism 设计风格。

**性能优化：**
- ✅ **React.lazy 代码分割**：所有页面组件（Dashboard、Trading、Strategies、Risk、Stocks、Crypto、QABot、Admin）按需懒加载，首屏只加载入口包 + 登录页
- ✅ **React ErrorBoundary**：全局错误边界捕获渲染错误，显示友好错误页面，支持一键重试
- ✅ **Suspense 加载态**：每个懒加载页面配有独立的 loading spinner

**页面功能：**
- **仪表盘**：资产概览卡片、价格走势图、盈亏图、资产配置饼图
- **交易**：买卖下单表单、持仓列表、订单簿可视化
- **策略**：策略卡片（启停控制）、创建策略弹窗、盈亏统计
- **风控**：风险指标仪表盘、告警列表、指标概览
- **股票/加密货币**：搜索、实时行情、K线图、多交易所切换
- **智能问答**：聊天界面、快速提问、源引用显示
- **管理**：用户管理、系统状态监控

### Backend (FastAPI)
RESTful API 服务，JWT 认证，CORS 支持。
- 用户注册/登录/个人信息管理
- 交易订单 CRUD、持仓查询、投资组合概览
- 策略 CRUD、启停控制
- 风控指标查询、告警列表、规则管理
- 股票/加密货币行情 API
- QA 问答接口

### Strategy Engine
独立进程，支持动态加载策略。
- **网格策略**：固定价格区间内自动低买高卖
- **马丁格尔策略**：亏损后加倍仓位，适合震荡行情
- **趋势跟踪**：EMA 交叉信号 + ATR 止损
- **用户自定义**：继承 BaseStrategy 即可编写自定义策略

### Risk Engine
独立风控裁判，实时检查每笔交易。
- 仓位限制检查（单品种/总仓位）
- 每日亏损监控（超过阈值暂停交易）
- 连续亏损保护（累计亏损次数上限）
- 熔断机制（总亏损百分比触发，紧急停止所有交易）
- API 健康监控（错误率/延迟阈值）
- 告警通知（日志输出 / Webhook / 邮件）

### Data Collector
多源市场数据采集，支持 A 股和加密货币。
- **A股**：东方财富 API、同花顺 API（行情、财务、公告）
- **加密货币**：Binance、OKX、Bybit 公开 API
- 数据清洗（去异常值、修复高低倒挂）
- 数据标准化（跨交易所符号转换）
- 定时采集调度

### QA Bot (RAG)
基于检索增强生成的智能问答系统。
- 意图分类（市场数据、策略咨询、风险问题、通用）
- 查询改写（代词消歧、上下文补充）
- 文档检索（TF-IDF + SVD 向量化 + 余弦相似度）
- BM25 重排序
- 模板答案生成 + 合规检查
- 内置量化交易知识库

---

## 安装和运行

### 环境要求
- Python 3.10+
- Node.js 18+
- Docker & Docker Compose（可选）

### 1. 克隆项目

```bash
git clone https://github.com/your-username/quant-trading-bot.git
cd quant-trading-bot
```

### 2. 安装依赖

```bash
# 一键安装所有服务依赖
make install

# 或分别安装
# 后端
cd backend && pip install -r requirements.txt

# 策略引擎
cd strategy-engine && pip install -r requirements.txt

# 风控引擎
cd risk-engine && pip install -r requirements.txt

# 数据采集
cd data-collector && pip install -r requirements.txt

# QA Bot
cd qa-bot && pip install -r requirements.txt

# 前端
cd frontend && npm install
```

### 3. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env 填入必要的配置
```

### 4. 启动开发服务

```bash
# 方式一：使用 Makefile
make dev

# 方式二：分别启动
# 启动后端
cd backend && uvicorn app.main:app --reload --port 8000

# 启动前端
cd frontend && npm run dev

# 启动策略引擎
cd strategy-engine && python -m engine.runner

# 启动风控引擎
cd risk-engine && python -m engine.checker

# 启动数据采集
cd data-collector && python -m scheduler.main
```

### 5. 使用 Docker Compose

```bash
cd deploy/docker
docker-compose up -d

# 生产环境
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### 6. 访问

- 前端界面：http://localhost:3000
- 后端 API：http://localhost:8000
- API 文档：http://localhost:8000/docs
- 健康检查：http://localhost:8000/health

### 默认账号
- 用户名：admin
- 密码：admin123（需先注册）

---

## 运行测试

```bash
# 运行所有测试
make test

# 运行单元测试
pytest tests/unit/ -v

# 运行集成测试
pytest tests/integration/ -v

# 运行端到端测试
pytest tests/e2e/ -v

# 前端代码检查
cd frontend && npm run lint
```

---

## 部署说明

### Netlify 部署（前端）

1. 将代码推送到 GitHub 仓库
2. 登录 [Netlify](https://app.netlify.com)
3. 点击 "New site from Git" → 选择 GitHub 仓库
4. 配置构建设置：
   - **Build command**: `cd frontend && npm install && npm run build`
   - **Publish directory**: `frontend/dist`
5. 设置环境变量：
   - `NODE_VERSION`: `18`
6. 部署后会自动分配 `xxx.netlify.app` 域名

**Netlify 重定向配置**（在 `frontend/public/_redirects` 或根目录 `netlify.toml`）：
```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Vercel 部署（后端 API）

1. 登录 [Vercel](https://vercel.com)
2. 导入 GitHub 仓库
3. 配置构建设置：
   - **Framework Preset**: Other
   - **Root Directory**: `backend`
   - **Build Command**: 无需设置（Python 项目）
4. 设置环境变量：
   - `DATABASE_URL`: PostgreSQL 连接字符串
   - `REDIS_URL`: Redis 连接字符串
   - `JWT_SECRET`: JWT 密钥
5. 部署后会自动分配 `xxx.vercel.app` 域名

### Vercel Serverless 部署方式

如需将后端部署为 Vercel Serverless Functions：
1. 在 `backend/api/` 目录下创建 Serverless 入口文件
2. 在 Vercel 根目录添加 `vercel.json` 配置路由重写
3. 配置环境变量和构建命令

### 前端环境自动检测

前端 `constants.ts` 会自动检测部署环境：
- **生产环境**（域名匹配 `ayuu.fun` 或 `*.netlify.app`）→ 调用 Vercel 后端 API
- **开发环境**（localhost）→ 调用本地后端 API

### 自动部署（CI/CD）

可配置 GitHub Actions 实现自动部署：
```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 18
      - run: cd frontend && npm install && npm run build
      - uses: netlify/actions/cli@master
        with:
          args: deploy --dir=frontend/dist --prod
        env:
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
```

---

## 未来改进

### 功能增强
- [ ] 接入真实交易所 API（Binance/OKX WebSocket 行情推送）
- [ ] A 股实盘交易接口（需券商 API 接入）
- [ ] 更多技术指标（MACD、RSI、布林带、成交量分析）
- [ ] 策略回测引擎（历史数据回测、绩效评估）
- [ ] 策略组合优化（多策略协同、资金分配）
- [ ] 实时 WebSocket 行情推送（替代轮询）
- [ ] 用户自定义仪表盘（拖拽布局）
- [ ] 移动端响应式适配

### 风控增强
- [ ] 基于波动率的动态仓位管理
- [ ] 相关性风控（多品种相关性监控）
- [ ] 流动性风控（滑点预估、成交量限制）
- [ ] 黑天鹅事件检测（异常波动自动暂停）

### QA Bot 增强
- [ ] 接入 LLM（GPT/Claude）提升回答质量
- [ ] 多模态支持（图表分析、K线识别）
- [ ] 对话记忆（长期上下文管理）
- [ ] 知识库自动更新（定时抓取最新研报）

### 工程改进
- [ ] 数据库迁移（Alembic）
- [ ] 完善 CI/CD 流水线（GitHub Actions）
- [ ] 监控与可观测性（Prometheus + Grafana）
- [ ] 日志聚合（ELK Stack）
- [ ] API 限流（令牌桶算法）
- [ ] 多租户支持
- [ ] 国际化（i18n）
- [ ] 前端性能监控（Sentry / Web Vitals）
- [ ] 前端 E2E 测试（Playwright）

---

## 许可证

MIT License
