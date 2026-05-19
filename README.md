# Stock-AYUU 股票数据分析与可视化平台

> 本网站仅用于股票数据分析、策略研究和回测展示，不构成任何投资建议，不提供自动交易或委托下单服务。

## 功能特性

- 📊 市场概览仪表盘
- 📈 股票列表与搜索
- 🔍 个股详情 (K线/技术指标/K线形态/筹码分布)
- 🎯 综合选股 (200+条件组合)
- 📋 策略选股 (10种内置策略)
- 📉 回测验证
- ⭐ 关注列表
- ⚙️ 系统状态

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React 18, TypeScript, Vite, Tailwind CSS, ECharts |
| 后端 | Python 3.11, FastAPI, SQLAlchemy |
| 数据库 | MySQL 8.0 |
| 部署 | Docker, Nginx, HTTPS |

## 快速开始

### 开发环境

```bash
# 克隆项目
git clone https://github.com/your-username/stock-ayuu.git
cd stock-ayuu

# 复制环境配置
cp .env.example .env
# 编辑 .env 填入数据库等配置

# 启动后端
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 9988

# 启动前端
cd frontend
npm install
npm run dev
```

### Docker 部署

```bash
# 构建并启动
docker-compose -f deploy/docker-compose.yml up -d

# 查看日志
docker-compose -f deploy/docker-compose.yml logs -f
```

## 部署到 ayuu.fun

详见 [README_DEPLOY.md](README_DEPLOY.md)

## 项目结构

```
stock-ayuu/
├── backend/          # FastAPI 后端
│   ├── app/
│   │   ├── api/      # REST API 路由
│   │   ├── services/ # 业务逻辑
│   │   ├── models/   # 数据模型
│   │   └── database/ # 数据库连接
│   └── requirements.txt
├── frontend/         # React 前端
│   ├── src/
│   │   ├── pages/    # 页面组件
│   │   ├── components/ # 通用组件
│   │   └── charts/   # ECharts 图表
│   └── package.json
├── deploy/           # 部署配置
│   ├── nginx.conf
│   └── docker-compose.yml
└── README.md
```

## 安全声明

- ✅ 本项目**不支持**任何自动交易功能
- ✅ 不接入券商客户端
- ✅ 不保存任何交易账号密码
- ✅ 不提供买入、卖出、撤单、打新功能
- ✅ 仅提供数据分析、策略研究和回测展示

## License

MIT
