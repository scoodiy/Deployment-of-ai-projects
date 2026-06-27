import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { withAdminAuth } from '@/lib/auth/with-admin-auth';

export const GET = withAdminAuth(async (_request, _admin) => {
  const db = getDb();
  const configs = db.prepare('SELECT config_key, config_value FROM site_config').all() as { config_key: string; config_value: string }[];
  
  const configMap: Record<string, string> = {};
  for (const c of configs) {
    configMap[c.config_key] = c.config_value;
  }

  return NextResponse.json({ config: configMap });
});
