"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Cloud, Sun, CloudRain, Snowflake, CloudLightning, Loader2, Wind, Droplets, Eye, Thermometer } from 'lucide-react';

interface WeatherData {
  city: string;
  temp: number;
  feelsLike: number;
  text: string;
  icon: string;
  windDir: string;
  windScale: string;
  humidity: string;
  vis: string;
  isMock: boolean;
}

export default function WeatherTool() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [city, setCity] = useState('北京');

  const fetchWeather = async (location: string = '北京') => {
    setLoading(true);
    try {
      const res = await fetch(`/api/weather?city=${encodeURIComponent(location)}`);
      const data = await res.json();

      if (data.code === "200" && data.now) {
        setWeather({
          city: data.city || location,
          temp: parseInt(data.now.temp),
          feelsLike: parseInt(data.now.feelsLike || data.now.temp),
          text: data.now.text,
          icon: data.now.icon,
          windDir: data.now.windDir || '',
          windScale: data.now.windScale || '',
          humidity: data.now.humidity || '',
          vis: data.now.vis || '',
          isMock: false
        });
      } else {
        throw new Error(data.message || "Data Error");
      }
    } catch (err) {
      // 模拟模式
      setWeather({
        city: location,
        temp: 22,
        feelsLike: 20,
        text: "气候模拟",
        icon: "101",
        windDir: "东南风",
        windScale: "2",
        humidity: "45",
        vis: "10",
        isMock: true
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather(city);
  }, []);

  const getWeatherIcon = (iconCode: string) => {
    const code = parseInt(iconCode);
    if (code === 100) return <Sun className="text-amber-400" size={32} />;
    if (code >= 101 && code <= 104) return <Cloud className="text-slate-400" size={32} />;
    if (code >= 300 && code <= 399) return <CloudRain className="text-blue-400" size={32} />;
    if (code >= 400 && code <= 499) return <Snowflake className="text-indigo-300" size={32} />;
    if (code >= 150 && code <= 153) return <Sun className="text-orange-300" size={32} />;
    return <Cloud className="text-slate-400" size={32} />;
  };

  const handleSearch = () => {
    if (city.trim()) fetchWeather(city.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="flex flex-col gap-3"
    >
      {/* 城市搜索 */}
      <div className="flex gap-1.5">
        <input
          value={city}
          onChange={(e) => setCity(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="输入城市名"
          className="flex-1 px-3 py-2 text-xs rounded-xl bg-white/60 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-400 dark:focus:border-indigo-500 transition-colors"
        />
        <button
          onClick={handleSearch}
          disabled={loading}
          className="px-3 py-2 bg-indigo-500 text-white text-xs font-bold rounded-xl hover:bg-indigo-600 disabled:opacity-40 transition-all active:scale-95 shadow-sm"
        >
          {loading ? '...' : '查'}
        </button>
      </div>

      {/* 天气展示 */}
      {loading ? (
        <div className="h-40 flex flex-col items-center justify-center gap-2 text-slate-400">
          <Loader2 className="animate-spin text-indigo-400" size={24} />
          <span className="text-[10px] font-bold">同步气象数据...</span>
        </div>
      ) : weather ? (
        <div className="flex flex-col gap-3">
          {/* 主要信息 */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 dark:from-indigo-500/20 dark:to-purple-500/20 border border-indigo-200/30 dark:border-indigo-500/20">
            <div className="flex flex-col">
              <span className={`text-[10px] font-black uppercase tracking-widest ${weather.isMock ? 'text-amber-500' : 'text-indigo-500 dark:text-indigo-400'}`}>
                {weather.isMock ? 'SIMULATED' : 'LIVE'}
              </span>
              <span className="text-sm font-bold text-slate-800 dark:text-white mt-1">{weather.city}</span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-3xl font-black text-slate-900 dark:text-slate-100">{weather.temp}°</span>
                <span className="text-xs text-slate-500 dark:text-slate-400">{weather.text}</span>
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5">体感 {weather.feelsLike}°</span>
            </div>
            <div className="drop-shadow-lg">
              {getWeatherIcon(weather.icon)}
            </div>
          </div>

          {/* 详细信息网格 */}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/40 dark:bg-slate-700/40">
              <Wind size={14} className="text-slate-400" />
              <div className="flex flex-col">
                <span className="text-[9px] text-slate-400">风向</span>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{weather.windDir} {weather.windScale}级</span>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/40 dark:bg-slate-700/40">
              <Droplets size={14} className="text-blue-400" />
              <div className="flex flex-col">
                <span className="text-[9px] text-slate-400">湿度</span>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{weather.humidity}%</span>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/40 dark:bg-slate-700/40 col-span-2">
              <Eye size={14} className="text-slate-400" />
              <div className="flex flex-col">
                <span className="text-[9px] text-slate-400">能见度</span>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{weather.vis} km</span>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </motion.div>
  );
}
