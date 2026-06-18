'use client';

import { useState, useEffect } from "react";

export default function AboutPage() {
  const [configs, setConfigs] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const aboutKeys = ["about_title", "about_content", "avatar_url", "github_url", "email", "bilibili_url", "custom_links"];

  useEffect(() => {
    fetch("/api/admin/site-config")
      .then((res) => res.json())
      .then((data) => {
        const map: Record<string, string> = {};
        data.configs.forEach((c: { config_key: string; config_value: string }) => {
          if (aboutKeys.includes(c.config_key)) {
            map[c.config_key] = c.config_value;
          }
        });
        setConfigs(map);
      });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch("/api/admin/site-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(configs),
      });
      alert("保存成功");
    } catch {
      alert("保存失败");
    } finally {
      setSaving(false);
    }
  };

  const updateValue = (key: string, value: string) => {
    setConfigs({ ...configs, [key]: value });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">关于页面配置</h2>
        <button onClick={handleSave} disabled={saving} className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg disabled:opacity-50">
          {saving ? "保存中..." : "💾 保存"}
        </button>
      </div>

      <div className="bg-black/30 backdrop-blur-xl rounded-xl border border-white/10 p-6 space-y-6">
        <div>
          <label className="block text-gray-300 text-sm mb-2">页面标题</label>
          <input
            type="text"
            value={configs.about_title || ""}
            onChange={(e) => updateValue("about_title", e.target.value)}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500"
          />
        </div>

        <div>
          <label className="block text-gray-300 text-sm mb-2">个人介绍（支持 Markdown）</label>
          <textarea
            value={configs.about_content || ""}
            onChange={(e) => updateValue("about_content", e.target.value)}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500 font-mono text-sm h-64"
          />
        </div>

        <div>
          <label className="block text-gray-300 text-sm mb-2">头像 URL</label>
          <input
            type="text"
            value={configs.avatar_url || ""}
            onChange={(e) => updateValue("avatar_url", e.target.value)}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500"
            placeholder="https://..."
          />
          {configs.avatar_url && (
            <img src={configs.avatar_url} alt="avatar" className="w-20 h-20 rounded-full mt-2 object-cover border-2 border-purple-500/50" />
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-300 text-sm mb-2">GitHub 链接</label>
            <input
              type="text"
              value={configs.github_url || ""}
              onChange={(e) => updateValue("github_url", e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500"
              placeholder="https://github.com/..."
            />
          </div>
          <div>
            <label className="block text-gray-300 text-sm mb-2">B站链接</label>
            <input
              type="text"
              value={configs.bilibili_url || ""}
              onChange={(e) => updateValue("bilibili_url", e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500"
              placeholder="https://space.bilibili.com/..."
            />
          </div>
          <div>
            <label className="block text-gray-300 text-sm mb-2">邮箱</label>
            <input
              type="email"
              value={configs.email || ""}
              onChange={(e) => updateValue("email", e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500"
              placeholder="your@email.com"
            />
          </div>
          <div>
            <label className="block text-gray-300 text-sm mb-2">自定义链接（JSON 数组）</label>
            <input
              type="text"
              value={configs.custom_links || ""}
              onChange={(e) => updateValue("custom_links", e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500"
              placeholder='[{"name":"链接名","url":"https://..."}]'
            />
          </div>
        </div>
      </div>
    </div>
  );
}
