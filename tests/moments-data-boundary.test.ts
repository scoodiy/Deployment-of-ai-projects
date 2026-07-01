import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const root = process.cwd();
const read = (file: string) => readFileSync(path.join(root, file), 'utf8');
const exists = (file: string) => existsSync(path.join(root, file));

test('moments page delegates markdown filesystem reads to an API route', () => {
  assert.ok(exists('app/api/moments/route.ts'), 'moments API route should exist');
  assert.ok(exists('app/moments/MomentsPageClient.tsx'), 'moments client loader should exist');

  const page = read('app/moments/page.tsx');
  const client = read('app/moments/MomentsPageClient.tsx');
  const route = read('app/api/moments/route.ts');

  assert.doesNotMatch(page, /fs|readFileSync|readdirSync|gray-matter/);
  assert.match(client, /\/api\/moments/);
  assert.match(route, /readFileSync/);
  assert.match(route, /\/opt\/xhblogs/);
  assert.doesNotMatch(route, /process\.cwd/);
  assert.match(route, /NextResponse\.json/);
});
