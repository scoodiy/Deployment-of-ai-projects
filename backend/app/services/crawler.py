"""数据抓取服务 - 使用腾讯财经 API 获取 A 股实时行情。"""

import math
import re
import time
import httpx
from sqlalchemy import text
from sqlalchemy.orm import Session


TENCENT_API = "https://qt.gtimg.cn/q="
TENCENT_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Referer": "https://finance.qq.com/",
}

# 所有 A 股代码范围
STOCK_CODE_RANGES = [
    # 上交所主板
    ("sh", range(600000, 606000)),
    # 上交所科创板
    ("sh", range(688000, 690000)),
    # 深交所主板
    ("sz", range(0, 3500)),
    # 深交所创业板
    ("sz", range(300000, 302000)),
    # 北交所
    ("bj", range(430001, 440000)),
    ("bj", range(830001, 840000)),
    ("bj", range(870001, 880000)),
    ("bj", range(920001, 930000)),
]


def _generate_all_codes() -> list[str]:
    """生成所有可能的 A 股代码列表。"""
    codes = []
    for prefix, code_range in STOCK_CODE_RANGES:
        for c in code_range:
            codes.append(f"{prefix}{c:06d}" if prefix != "bj" else f"{prefix}{c}")
    return codes


def _parse_tencent_line(line: str) -> dict | None:
    """解析腾讯 API 返回的一行数据。

    腾讯 API 返回格式: v_sh600519="1~贵州茅台~600519~1324.30~..."
    字段用 ~ 分隔，主要字段:
    [1] 名称 [2] 代码 [3] 当前价 [4] 昨收 [5] 今开
    [6] 成交量(手) [30] 时间 [31] 涨跌额 [32] 涨跌幅
    [33] 最高 [34] 最低 [35] 价格/成交量/成交额
    [36] 成交量(手) [37] 成交额(万) [38] 换手率 [39] PE
    [43] 振幅 [44] 流通市值(亿) [45] 总市值(亿) [46] PB
    """
    m = re.search(r'v_(\w+)="(.+?)"', line)
    if not m:
        return None

    fields = m.group(2).split("~")
    if len(fields) < 47:
        return None

    code_raw = fields[2]
    name = fields[1]
    price = _safe_float(fields[3])

    if not code_raw or not name or price is None or price <= 0:
        return None

    # 判断市场
    if code_raw.startswith("6"):
        market = "SH"
    elif code_raw.startswith(("0", "3")):
        market = "SZ"
    elif code_raw.startswith(("4", "8")):
        market = "BJ"
    else:
        market = "OTHER"

    return {
        "code": code_raw,
        "name": name,
        "market": market,
        "price": price,
        "pre_close": _safe_float(fields[4]),
        "open": _safe_float(fields[5]),
        "volume": _safe_float(fields[6]),  # 手
        "pct_change": _safe_float(fields[32]),
        "change_amount": _safe_float(fields[31]),
        "high": _safe_float(fields[33]),
        "low": _safe_float(fields[34]),
        "turnover": _safe_float(fields[38]),  # 换手率
        "pe_ratio": _safe_float(fields[39]),
        "float_market_cap": _safe_float(fields[44]),  # 亿
        "total_market_cap": _safe_float(fields[45]),   # 亿
        "pb_ratio": _safe_float(fields[46]),
        "amount": _safe_float(fields[37]),  # 万
    }


def _safe_float(val):
    if val is None or val == '' or val == '-' or val == 'None':
        return None
    try:
        return float(val)
    except (ValueError, TypeError):
        return None


def fetch_stock_list() -> list[dict]:
    """从腾讯财经抓取 A 股实时行情。批量请求，自动分页。"""
    all_codes = _generate_all_codes()
    batch_size = 80  # 每次最多请求 80 个
    all_stocks = []
    total_batches = math.ceil(len(all_codes) / batch_size)

    with httpx.Client(headers=TENCENT_HEADERS, timeout=30) as client:
        for i in range(0, len(all_codes), batch_size):
            batch = all_codes[i:i + batch_size]
            batch_num = i // batch_size + 1
            codes_str = ",".join(batch)

            try:
                r = client.get(f"{TENCENT_API}{codes_str}")
                text = r.content.decode("gbk", errors="replace")

                for line in text.strip().split(";"):
                    line = line.strip()
                    if not line or "none_match" in line:
                        continue
                    stock = _parse_tencent_line(line)
                    if stock:
                        all_stocks.append(stock)

                if batch_num % 20 == 0:
                    print(f"[crawler] 进度: {batch_num}/{total_batches} 批次, 已获取 {len(all_stocks)} 只股票")
                time.sleep(0.1)  # 避免请求过快

            except Exception as e:
                print(f"[crawler] 批次 {batch_num} 失败: {e}")
                continue

    print(f"[crawler] 共获取 {len(all_stocks)} 只有效股票")
    return all_stocks


def save_stock_list(db: Session, stocks: list[dict]) -> dict:
    """将抓取的股票数据保存到数据库。"""
    inserted = 0
    updated = 0

    for s in stocks:
        code = s.get("code")
        name = s.get("name")
        if not code or not name:
            continue

        existing = db.execute(
            text("SELECT id FROM stocks WHERE code = :code"), {"code": code}
        ).fetchone()

        if existing:
            db.execute(
                text("""
                    UPDATE stocks SET name = :name, market = :market, updated_at = NOW()
                    WHERE code = :code
                """),
                {"code": code, "name": name, "market": s.get("market", "")}
            )
            updated += 1
        else:
            db.execute(
                text("""
                    INSERT INTO stocks (code, name, market, is_active, created_at, updated_at)
                    VALUES (:code, :name, :market, true, NOW(), NOW())
                """),
                {"code": code, "name": name, "market": s.get("market", "")}
            )
            inserted += 1

    # 保存实时行情
    for s in stocks:
        code = s.get("code")
        if not code or s.get("price") is None:
            continue
        db.execute(
            text("""
                INSERT INTO stock_realtime (code, name, price, pct_change, change_amount,
                    volume, amount, open, high, low, pre_close, turnover, pe_ratio, pb_ratio,
                    market_cap, float_market_cap, update_time)
                VALUES (:code, :name, :price, :pct_change, :change_amount,
                    :volume, :amount, :open, :high, :low, :pre_close, :turnover, :pe_ratio, :pb_ratio,
                    :market_cap, :float_market_cap, NOW())
                ON CONFLICT (code) DO UPDATE SET
                    name = EXCLUDED.name, price = EXCLUDED.price, pct_change = EXCLUDED.pct_change,
                    change_amount = EXCLUDED.change_amount, volume = EXCLUDED.volume,
                    amount = EXCLUDED.amount, open = EXCLUDED.open, high = EXCLUDED.high,
                    low = EXCLUDED.low, pre_close = EXCLUDED.pre_close, turnover = EXCLUDED.turnover,
                    pe_ratio = EXCLUDED.pe_ratio, pb_ratio = EXCLUDED.pb_ratio,
                    market_cap = EXCLUDED.market_cap, float_market_cap = EXCLUDED.float_market_cap,
                    update_time = NOW()
            """),
            {
                "code": code,
                "name": s.get("name", ""),
                "price": s.get("price"),
                "pct_change": s.get("pct_change"),
                "change_amount": s.get("change_amount"),
                "volume": s.get("volume"),
                "amount": s.get("amount"),
                "open": s.get("open"),
                "high": s.get("high"),
                "low": s.get("low"),
                "pre_close": s.get("pre_close"),
                "turnover": s.get("turnover"),
                "pe_ratio": s.get("pe_ratio"),
                "pb_ratio": s.get("pb_ratio"),
                "market_cap": s.get("total_market_cap"),
                "float_market_cap": s.get("float_market_cap"),
            }
        )

    db.commit()
    result = {"inserted": inserted, "updated": updated, "total": len(stocks)}
    print(f"[crawler] 保存完成: 新增 {inserted}, 更新 {updated}")
    return result


def run_full_crawl(db: Session) -> dict:
    """执行完整数据抓取。"""
    print("[crawler] 开始抓取 A 股实时行情（腾讯数据源）...")
    stocks = fetch_stock_list()
    if not stocks:
        return {"error": "抓取失败，未获取到数据"}
    result = save_stock_list(db, stocks)
    return result
