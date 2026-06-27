import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const adminLayoutPath = path.join(process.cwd(), 'app', 'admin', 'layout.tsx');
const adminAiPagePath = path.join(process.cwd(), 'app', 'admin', 'ai', 'page.tsx');

test('admin sidebar exposes the AI cat configuration page', () => {
  const source = readFileSync(adminLayoutPath, 'utf8');

  assert.match(source, /path: '\/admin\/ai'/);
  assert.match(source, /label: 'AI猫猫'/);
  assert.match(source, /description: '助理模型'/);
});

test('AI cat admin page can manage all runtime config keys', () => {
  const source = readFileSync(adminAiPagePath, 'utf8');

  for (const key of [
    'show_ai_assistant',
    'ai_api_url',
    'ai_api_key',
    'ai_model_id',
    'ai_system_prompt',
    'ai_max_output_tokens',
    'ai_temperature',
  ]) {
    assert.match(source, new RegExp(key));
  }

  assert.match(source, /\/api\/admin\/site-config/);
  assert.match(source, /\/api\/chat/);
});
