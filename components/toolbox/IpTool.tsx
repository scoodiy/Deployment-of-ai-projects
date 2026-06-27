"use client";
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface IpResult {
  ip?: string;
  city?: string;
  region?: string;
  country_name?: string;
  org?: string;
  timezone?: string;
  latitude?: number;
  longitude?: number;
  postal?: string;
  error?: string;
}

export default function IpTool() {
  const [myIp, setMyIp] = useState('');
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<IpResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('https://api.ipify.org?format=json').then(r => r.json()).then(d => setMyIp(d.ip)).catch(() => {});
  }, []);

  const lookup = async (ip?: string) => {
    const target = ip || query;
    if (!target) return;
    setLoading(true);
    try {
      const res = await fetch(`https://ipapi.co/${target}/json/`);
      const data = await res.json();
      setResult(data);
    } catch { setResult({ error: '查询失败' }); }
    finally { setLoading(false); }
  };

  return (
    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="flex flex-col gap-3">
      {myIp && (
        <button onClick={() => lookup(myIp)}
          className="w-full text-left px-3 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800 text-xs">
          <span className="text-slate-500">您的 IP：</span>
          <span className="font-bold text-indigo-600 dark:text-indigo-400">{myIp}</span>
          <span className="text-[10px] text-slate-400 ml-2">点击查询</span>
        </button>
      )}
      <div className="flex gap-1.5">
        <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && lookup()}
          placeholder="输入 IP 地址..." className="flex-1 px-3 py-2 text-xs rounded-xl bg-white/60 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-400" />
        <button onClick={() => lookup()} disabled={loading || !query.trim()}
          className="px-3 py-2 bg-indigo-500 text-white text-xs font-bold rounded-xl hover:bg-indigo-600 disabled:opacity-40 transition-all active:scale-95">{loading ? '...' : '查'}</button>
      </div>
      {result && !result.error && (
        <div className="grid grid-cols-2 gap-1.5">
          {[
            ['IP', result.ip], ['城市', result.city], ['地区', result.region],
            ['国家', result.country_name], ['组织', result.org], ['时区', result.timezone],
            ['经纬度', `${result.latitude}, ${result.longitude}`], ['邮编', result.postal],
          ].filter(([_, v]) => v).map(([k, v]) => (
            <div key={k} className="flex justify-between items-center px-2 py-1.5 rounded-lg bg-white/40 dark:bg-slate-700/40 text-[10px]">
              <span className="text-slate-500">{k}</span>
              <span className="font-bold text-slate-700 dark:text-slate-200 truncate ml-1">{v}</span>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
