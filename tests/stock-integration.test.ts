import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const root = process.cwd();
const read = (file: string) => readFileSync(path.join(root, file), 'utf8');
const exists = (file: string) => existsSync(path.join(root, file));

test('stock tools are first-class independent pages and legacy routes redirect safely', () => {
  assert.ok(exists('app/tools/stock-analysis/page.tsx'), 'stock analysis page should exist');
  assert.ok(exists('app/tools/market-review/page.tsx'), 'market review page should exist');

  const catalog = read('app/tools/toolCatalog.ts');
  assert.match(catalog, /href: '\/tools\/stock-analysis'/);
  assert.match(catalog, /href: '\/tools\/market-review'/);

  const dynamicPage = read('app/tools/[tool]/page.tsx');
  assert.match(dynamicPage, /'stock-analysis'/, 'dynamic route should not pre-render explicit stock-analysis page');
  assert.match(dynamicPage, /'market-review'/, 'dynamic route should not pre-render explicit market-review page');
});

test('stock frontend uses same-origin Next API contracts instead of direct Python service calls', () => {
  const stockTool = read('components/toolbox/StockTool.tsx');
  const marketTool = read('components/toolbox/DailyStockTool.tsx');

  assert.doesNotMatch(stockTool, /127\.0\.0\.1:8000|API_BASE\s*=\s*['\"]http/);
  assert.doesNotMatch(marketTool, /127\.0\.0\.1:8000|API_BASE\s*=\s*['\"]http/);

  assert.match(stockTool, /\/api\/stock\/analyze/);
  assert.match(stockTool, /\/api\/stock\/reports/);
  assert.match(stockTool, /\/api\/stock\/config\/status/);
  assert.match(marketTool, /\/api\/stock\/market-review/);
  assert.match(marketTool, /\/api\/stock\/reports/);
  assert.match(marketTool, /\/api\/stock\/config\/status/);
});

test('stock backend exposes adapter-backed API routes and keeps Python implementation isolated', () => {
  for (const file of [
    'app/api/stock/route.ts',
    'app/api/stock/analyze/route.ts',
    'app/api/stock/market-review/route.ts',
    'app/api/stock/reports/route.ts',
    'app/api/stock/reports/[id]/route.ts',
    'app/api/stock/config/status/route.ts',
    'app/api/stock/config/test/route.ts',
    'lib/rate-limit.ts',
    'lib/stock/daily-stock-adapter.ts',
    'lib/stock/service.ts',
    'lib/stock/types.ts',
    'lib/stock/validation.ts',
  ]) {
    assert.ok(exists(file), `${file} should exist`);
  }

  const adapter = read('lib/stock/daily-stock-adapter.ts');
  assert.match(adapter, /DAILY_STOCK_API_URL/);
  assert.match(adapter, /api\/v1\/analysis\/analyze/);
  assert.match(adapter, /api\/v1\/analysis\/market-review/);
  assert.match(adapter, /api\/v1\/analysis\/status/);
  assert.match(adapter, /api\/v1\/history/);

  const service = read('lib/stock/service.ts');
  assert.match(service, /stock_analysis_reports/);
  assert.match(service, /stock_tasks/);
  assert.match(service, /createStockAnalysisReport/);
});

test('legacy stock endpoint no longer bypasses the daily stock integration', () => {
  const legacyRoute = read('app/api/stock/route.ts');

  assert.match(legacyRoute, /deprecated: true/);
  assert.match(legacyRoute, /\/api\/stock\/analyze/);
  assert.doesNotMatch(legacyRoute, /smartbox\.gtimg\.cn|qt\.gtimg\.cn|web\.ifzq\.gtimg\.cn/);
});

test('heavy stock endpoints are rate limited', () => {
  const rateLimit = read('lib/rate-limit.ts');
  const analyzeRoute = read('app/api/stock/analyze/route.ts');
  const marketReviewRoute = read('app/api/stock/market-review/route.ts');
  const configTestRoute = read('app/api/stock/config/test/route.ts');

  assert.match(rateLimit, /checkRequestRateLimit/);
  assert.match(rateLimit, /X-RateLimit-Remaining/);
  assert.match(analyzeRoute, /namespace: 'stock:analyze'/);
  assert.match(marketReviewRoute, /namespace: 'stock:market-review'/);
  assert.match(configTestRoute, /namespace: 'stock:config-test'/);
  assert.match(analyzeRoute, /status: 429/);
});

test('stock database schema stores reports and task metadata without plaintext provider secrets', () => {
  const db = read('lib/db/index.ts');
  assert.match(db, /CREATE TABLE IF NOT EXISTS stock_analysis_reports/);
  assert.match(db, /CREATE TABLE IF NOT EXISTS stock_tasks/);
  assert.match(db, /idx_stock_analysis_reports_created/);
  assert.match(db, /idx_stock_tasks_status/);
  assert.doesNotMatch(db, /stock_configs[\s\S]*config_value/);
});

test('stock docs and env example explain runtime boundaries', () => {
  const envExample = read('.env.example');
  const readme = read('README.md');

  assert.match(envExample, /DAILY_STOCK_API_URL/);
  assert.match(envExample, /STOCK_LIST/);
  assert.match(envExample, /LITELLM_MODEL/);
  assert.match(readme, /\/tools\/stock-analysis/);
  assert.match(readme, /\/tools\/market-review/);
  assert.match(readme, /DAILY_STOCK_API_URL/);
});

test('stock admin console is discoverable and Next proxy convention is migrated', () => {
  assert.ok(exists('app/admin/stock/page.tsx'), 'stock admin page should exist');
  assert.ok(exists('proxy.ts'), 'Next 16 proxy file should exist');
  assert.equal(exists('middleware.ts'), false, 'deprecated middleware.ts should be removed');

  const adminLayout = read('app/admin/layout.tsx');
  const stockAdmin = read('app/admin/stock/page.tsx');
  const proxy = read('proxy.ts');

  assert.match(adminLayout, /\/admin\/stock/);
  assert.match(stockAdmin, /\/api\/stock\/config\/status/);
  assert.match(stockAdmin, /\/api\/stock\/reports/);
  assert.match(stockAdmin, /\/api\/stock\/config\/test/);
  assert.match(proxy, /export async function proxy/);
});

test('stock processing reports can refresh from external task status', () => {
  const service = read('lib/stock/service.ts');
  const adapter = read('lib/stock/daily-stock-adapter.ts');

  assert.match(adapter, /export async function getDailyStockTaskStatus/);
  assert.match(service, /getDailyStockTaskStatus/);
  assert.match(service, /updateStockAnalysisReport/);
  assert.match(service, /external_task_id = CASE WHEN/);
  assert.match(service, /report\.status === 'processing'/);
});
