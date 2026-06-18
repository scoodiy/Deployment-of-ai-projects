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
      .then((data) => setConfigs(data.configs));
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

  const toggleConfigs = configs.filter((c) => c.config_key.startsWith("show_"));
  const otherConfigs = configs.filter((c) => !c.config_key.startsWith("show_"));

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
              {config.config_value.length > 100 ? (
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
    </div>
  );
}
