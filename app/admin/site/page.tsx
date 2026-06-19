"use client";

import { useState, useEffect } from "react";

interface Config {
  id: number;
  config_key: string;
  config_value: string;
  description: string;
}

export default function SiteConfigPage() {
  const [configs, setConfigs] = useState<Config[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/site-config")
      .then((res) => res.json())
      .then((data) => setConfigs(data?.data?.configs || []))
      .catch(() => setConfigs([]));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const configMap: Record<string, string> = {};
    configs.forEach((c) => { configMap[c.config_key] = c.config_value; });

    try {
      await fetch("/api/admin/site-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(configMap),
      });
      alert("保存成功");
    } catch {
      alert("保存失败");
    } finally {
      setSaving(false);
    }
  };

  const updateValue = (key: string, value: string) => {
    setConfigs(configs.map((c) => c.config_key === key ? { ...c, config_value: value } : c));
  };

  const handleImageUpload = async (key: string, file: File) => {
    if (file.size > 10 * 1024 * 1024) { alert('文件超过10MB'); return; }
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await fetch('/api/admin/media/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (res.ok && data.url) {
        updateValue(key, data.url);
      } else {
        alert(data.error?.message || data.error || '上传失败');
      }
    } catch { alert('上传失败'); }
  };

  const isImageField = (key: string) => /image|avatar|background|bg|logo|cover|icon|photo/i.test(key);

  const toggleConfigs = configs.filter((c) => c.config_key.startsWith("show_"));
  const otherConfigs = configs.filter((c) => !c.config_key.startsWith("show_") && c.config_key !== "danmaku_list");

  // 弹幕管理
  const danmakuRaw = configs.find(c => c.config_key === "danmaku_list")?.config_value || "[]";
  let danmakuList: string[] = [];
  try { danmakuList = JSON.parse(danmakuRaw); } catch {}

  const updateDanmaku = (newList: string[]) => {
    updateValue("danmaku_list", JSON.stringify(newList));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">网站配置</h2>
        <button onClick={handleSave} disabled={saving} className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg disabled:opacity-50">
          {saving ? "保存中..." : "💾 保存配置"}
        </button>
      </div>

      <div className="bg-black/30 backdrop-blur-xl rounded-xl border border-white/10 p-6">
        <h3 className="text-white text-lg mb-4">基本配置</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {otherConfigs.map((config) => (
            <div key={config.config_key}>
              <label className="block text-gray-400 text-sm mb-1">{config.description || config.config_key}</label>
              {isImageField(config.config_key) ? (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={config.config_value}
                      onChange={(e) => updateValue(config.config_key, e.target.value)}
                      className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500"
                      placeholder="https://... 或上传本地图片"
                    />
                    <label className="px-4 py-3 bg-purple-500/20 text-purple-300 rounded-lg hover:bg-purple-500/30 cursor-pointer transition-colors whitespace-nowrap">
                      📤 上传
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageUpload(config.config_key, file);
                          e.target.value = '';
                        }}
                      />
                    </label>
                  </div>
                  {config.config_value && (
                    <img src={config.config_value} alt="" className="w-24 h-24 object-cover rounded-lg border border-white/10" onError={(e) => (e.target as HTMLImageElement).style.display = 'none'} />
                  )}
                </div>
              ) : config.config_value.length > 100 ? (
                <textarea
                  value={config.config_value}
                  onChange={(e) => updateValue(config.config_key, e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500 h-24"
                />
              ) : (
                <input
                  type="text"
                  value={config.config_value}
                  onChange={(e) => updateValue(config.config_key, e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500"
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-black/30 backdrop-blur-xl rounded-xl border border-white/10 p-6">
        <h3 className="text-white text-lg mb-4">功能开关</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {toggleConfigs.map((config) => (
            <label key={config.config_key} className="flex items-center justify-between p-4 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10">
              <span className="text-gray-300">{config.description || config.config_key}</span>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={config.config_value === "true"}
                  onChange={(e) => updateValue(config.config_key, e.target.checked ? "true" : "false")}
                  className="sr-only"
                />
                <div className={`w-12 h-6 rounded-full transition-colors ${config.config_value === "true" ? "bg-purple-500" : "bg-gray-600"}`}>
                  <div className={`w-5 h-5 bg-white rounded-full transition-transform transform ${config.config_value === "true" ? "translate-x-6" : "translate-x-0.5"} mt-0.5`} />
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* 弹幕管理 */}
      <div className="bg-black/30 backdrop-blur-xl rounded-xl border border-white/10 p-6">
        <h3 className="text-white text-lg mb-4">🎯 弹幕管理</h3>
        <div className="space-y-3">
          {danmakuList.map((text, idx) => (
            <div key={idx} className="flex gap-2 items-center">
              <span className="text-gray-500 text-xs w-6">{idx + 1}</span>
              <input
                type="text"
                value={text}
                onChange={(e) => {
                  const newList = [...danmakuList];
                  newList[idx] = e.target.value;
                  updateDanmaku(newList);
                }}
                className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
              />
              <button
                onClick={() => updateDanmaku(danmakuList.filter((_, i) => i !== idx))}
                className="px-2 py-2 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30 text-xs"
              >
                ✕
              </button>
            </div>
          ))}
          <button
            onClick={() => updateDanmaku([...danmakuList, '新弹幕内容'])}
            className="px-4 py-2 bg-purple-500/20 text-purple-300 rounded-lg hover:bg-purple-500/30 text-sm"
          >
            ＋ 添加弹幕
          </button>
        </div>
      </div>
    </div>
  );
}
