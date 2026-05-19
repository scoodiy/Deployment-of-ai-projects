# Stock-AYUU - 股票数据分析与可视化平台

## 项目概述
基于 myhhub/stock 二次开发的股票分析工具，部署在 ayuu.fun。
**绝对不允许任何自动交易功能。**

## 技术栈
- **后端**: Python 3.11 + FastAPI + SQLAlchemy + MySQL
- **前端**: React 18 + TypeScript + Vite + Tailwind CSS + ECharts
- **部署**: Docker + Nginx + HTTPS

## 原项目分析
源项目: https://github.com/myhhub/stock (12k+ stars)

### 可复用模块 (instock/)
- `core/crawling/` - 数据抓取 (eastmoney)
- `core/indicator/` - 技术指标 (MACD, KDJ, RSI, BOLL等32种)
- `core/pattern/` - K线形态识别 (61种)
- `core/strategy/` - 选股策略 (10种: 海龟, 低ATR, 突破平台等)
- `core/backtest/` - 回测验证
- `job/` - 数据任务调度
- `lib/database.py` - 数据库连接

### 必须删除的模块
- `instock/trade/` - **整个交易模块删除**
- `requirements.txt` 中的 `easytrader` - **移除**
- 任何 buy, sell, cancel, auto_ipo, position, balance 相关代码

## 后端 API 设计
所有 API 以 `/api` 开头。

| 方法 | 路径 | 功能 |
|------|------|------|
| GET | `/api/health` | 健康检查 |
| GET | `/api/market/overview` | 市场概览 |
| GET | `/api/stocks` | 股票列表 |
| GET | `/api/stocks/{code}` | 个股详情 |
| GET | `/api/stocks/{code}/kline` | K线数据 |
| GET | `/api/stocks/{code}/indicators` | 技术指标 |
| GET | `/api/stocks/{code}/patterns` | K线形态 |
| GET | `/api/stocks/{code}/cyq` | 筹码分布 |
| GET | `/api/strategies` | 策略列表 |
| GET | `/api/strategies/{id}/results` | 策略结果 |
| GET | `/api/backtests` | 回测列表 |
| GET | `/api/backtests/{id}` | 回测详情 |
| GET | `/api/selections` | 选股结果 |
| POST | `/api/selections/run` | 执行选股 |
| GET | `/api/watchlist` | 关注列表 |
| POST | `/api/watchlist` | 添加关注 |
| DELETE | `/api/watchlist/{code}` | 取消关注 |

### 禁止的 API
- /api/trade, /api/order, /api/buy, /api/sell
- /api/cancel, /api/ipo, /api/broker
- /api/account, /api/balance, /api/position

## 前端页面
1. Dashboard - 市场概览
2. StockList - 股票列表 (搜索/筛选/分页)
3. StockDetail - 个股详情 (K线/指标/形态/筹码)
4. Screening - 综合选股
5. Strategies - 策略选股
6. Backtest - 回测结果
7. Watchlist - 关注列表
8. SystemStatus - 系统状态

## 安全要求
- 网站底部必须显示: "本网站仅用于股票数据分析、策略研究和回测展示，不构成任何投资建议，不提供自动交易或委托下单服务。"
- 启动时检查并阻止交易模块加载
- Docker 和 cron 不启动任何交易服务

## 代码规范
- Python: type hints, Google style docstrings
- TypeScript: strict mode, proper types
- 所有新函数必须有文档字符串
- 提交前运行 lint 检查
