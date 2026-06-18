"use client";

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Search, Navigation, Loader2 } from 'lucide-react';

interface SearchResult {
  name: string;
  address: string;
  location: string;
  type: string;
}

export default function MapTool() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<SearchResult | null>(null);
  const [mapUrl, setMapUrl] = useState('');

  const searchPOI = useCallback(async () => {
    if (!query.trim()) return;
    setLoading(true);
    setResults([]);
    setSelected(null);

    try {
      // 使用高德地图 Web API 搜索 POI
      const key = 'c0a18e55b84a0068d4e0e6e0ab1c4e4c'; // 公共 Web API Key
      const res = await fetch(
        `https://restapi.amap.com/v3/place/text?keywords=${encodeURIComponent(query)}&key=${key}&offset=8&page=1`
      );
      const data = await res.json();

      if (data.status === '1' && data.pois) {
        const items: SearchResult[] = data.pois.map((poi: any) => ({
          name: poi.name,
          address: poi.address || poi.cityname || '',
          location: poi.location,
          type: poi.type?.split(';')[0] || '',
        }));
        setResults(items);
      }
    } catch (e) {
      console.error('搜索失败', e);
    } finally {
      setLoading(false);
    }
  }, [query]);

  const selectPlace = (item: SearchResult) => {
    setSelected(item);
    const [lng, lat] = item.location.split(',');
    setMapUrl(`https://uri.amap.com/marker?position=${lng},${lat}&name=${encodeURIComponent(item.name)}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') searchPOI();
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="flex flex-col gap-3"
    >
      {/* 搜索框 */}
      <div className="flex gap-1.5">
        <div className="relative flex-1">
          <MapPin size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="搜索地点、餐厅、景点..."
            className="w-full pl-8 pr-3 py-2 text-xs rounded-xl bg-white/60 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-400 dark:focus:border-indigo-500 transition-colors"
          />
        </div>
        <button
          onClick={searchPOI}
          disabled={loading || !query.trim()}
          className="px-3 py-2 bg-indigo-500 text-white text-xs font-bold rounded-xl hover:bg-indigo-600 disabled:opacity-40 transition-all active:scale-95 shadow-sm"
        >
          {loading ? <Loader2 className="animate-spin" size={14} /> : <Search size={14} />}
        </button>
      </div>

      {/* 地图预览 */}
      {selected && mapUrl && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700"
        >
          <iframe
            src={mapUrl}
            width="100%"
            height="200"
            style={{ border: 0 }}
            loading="lazy"
            allowFullScreen
            className="w-full"
          />
          <div className="px-3 py-2 bg-white/60 dark:bg-slate-700/60 flex items-center justify-between">
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-slate-800 dark:text-white truncate">{selected.name}</span>
              <span className="text-[10px] text-slate-400 truncate">{selected.address}</span>
            </div>
            <a
              href={`https://uri.amap.com/marker?position=${selected.location}&name=${encodeURIComponent(selected.name)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[10px] text-indigo-500 hover:text-indigo-600 font-bold flex-shrink-0"
            >
              <Navigation size={10} />
              导航
            </a>
          </div>
        </motion.div>
      )}

      {/* 搜索结果 */}
      <div className="flex flex-col gap-1 max-h-48 overflow-y-auto scrollbar-thin">
        {results.map((item, index) => (
          <motion.button
            key={index}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04 }}
            onClick={() => selectPlace(item)}
            className={`w-full flex items-start gap-2 px-3 py-2 rounded-xl text-left transition-all border ${
              selected?.location === item.location
                ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-300 dark:border-indigo-700'
                : 'bg-white/40 dark:bg-slate-700/40 border-transparent hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20 hover:border-indigo-200 dark:hover:border-indigo-800'
            }`}
          >
            <MapPin size={14} className="text-indigo-400 flex-shrink-0 mt-0.5" />
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{item.name}</span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                {item.address && `${item.address} · `}{item.type}
              </span>
            </div>
          </motion.button>
        ))}

        {!loading && results.length === 0 && !selected && (
          <div className="h-24 flex flex-col items-center justify-center text-slate-400 text-[10px]">
            <MapPin size={20} className="mb-1 opacity-40" />
            搜索地点查看详情
          </div>
        )}
      </div>
    </motion.div>
  );
}
