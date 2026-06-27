'use client';

import { useState, useEffect } from "react";
import { ActionButton, AdminCard, AdminPageHeader } from "../../../components/admin/AdminUI";

export default function AboutPage() {
  const [configs, setConfigs] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const aboutKeys = ["about_title", "about_content", "avatar_url", "github_url", "gitee_url", "email", "qq", "wechat", "bilibili_url", "custom_links"];

  useEffect(() => {
    fetch("/api/admin/site-config")
      .then((res) => res.json())
      .then((data) => {
        const map: Record<string, string> = {};
        (data.data?.configs || data.configs || []).forEach((c: { config_key: string; config_value: string }) => {
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
      <AdminPageHeader
        title="关于页面配置"
        description="编辑「关于」页面的个人介绍、链接和自定义内容。"
        actions={
          <ActionButton tone="info" onClick={handleSave} disabled={saving}>
            {saving ? "保存中..." : "保存"}
          </ActionButton>
        }
      />

      <AdminCard className="p-6 space-y-6">
        <div>
          <label className="block text-slate-700 text-sm mb-2">页面标题</label>
          <input
            type="text"
            value={configs.about_title || ""}
            onChange={(e) => updateValue("about_title", e.target.value)}
            className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-400"
          />
        </div>

        <div>
          <label className="block text-slate-700 text-sm mb-2">个人介绍（支持 Markdown）</label>
          <textarea
            value={configs.about_content || ""}
            onChange={(e) => updateValue("about_content", e.target.value)}
            className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-400 font-mono text-sm h-64"
          />
        </div>

        <div>
          <label className="block text-slate-700 text-sm mb-2">头像</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={configs.avatar_url || ""}
              onChange={(e) => updateValue("avatar_url", e.target.value)}
              className="flex-1 px-4 py-3 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-400"
              placeholder="https://... 或上传本地图片"
            />
            <label className="inline-flex min-h-12 items-center justify-center rounded-md border border-slate-200 bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 cursor-pointer transition-colors hover:brightness-95 whitespace-nowrap">
              上传
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (file.size > 10 * 1024 * 1024) { alert('文件超过10MB'); return; }
                  const fd = new FormData();
                  fd.append('file', file);
                  try {
                    const res = await fetch('/api/admin/media/upload', { method: 'POST', body: fd });
                    const data = await res.json();
                    if (res.ok && data.url) updateValue("avatar_url", data.url);
                    else alert(data.error?.message || '上传失败');
                  } catch { alert('上传失败'); }
                  e.target.value = '';
                }}
              />
            </label>
          </div>
          {configs.avatar_url && (
            <img src={configs.avatar_url} alt="avatar" className="w-20 h-20 rounded-full mt-2 object-cover border-2 border-indigo-200" />
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-slate-700 text-sm mb-2">GitHub 链接</label>
            <input
              type="text"
              value={configs.github_url || ""}
              onChange={(e) => updateValue("github_url", e.target.value)}
              className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-400"
              placeholder="https://github.com/..."
            />
          </div>
          <div>
            <label className="block text-slate-700 text-sm mb-2">B站链接</label>
            <input
              type="text"
              value={configs.bilibili_url || ""}
              onChange={(e) => updateValue("bilibili_url", e.target.value)}
              className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-400"
              placeholder="https://space.bilibili.com/..."
            />
          </div>
          <div>
            <label className="block text-slate-700 text-sm mb-2">Gitee 链接</label>
            <input
              type="text"
              value={configs.gitee_url || ""}
              onChange={(e) => updateValue("gitee_url", e.target.value)}
              className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-400"
              placeholder="https://gitee.com/..."
            />
          </div>
          <div>
            <label className="block text-slate-700 text-sm mb-2">QQ</label>
            <input
              type="text"
              value={configs.qq || ""}
              onChange={(e) => updateValue("qq", e.target.value)}
              className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-400"
              placeholder="QQ号"
            />
          </div>
          <div>
            <label className="block text-slate-700 text-sm mb-2">微信</label>
            <input
              type="text"
              value={configs.wechat || ""}
              onChange={(e) => updateValue("wechat", e.target.value)}
              className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-400"
              placeholder="微信号"
            />
          </div>
          <div>
            <label className="block text-slate-700 text-sm mb-2">邮箱</label>
            <input
              type="email"
              value={configs.email || ""}
              onChange={(e) => updateValue("email", e.target.value)}
              className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-400"
              placeholder="your@email.com"
            />
          </div>
          <div>
            <label className="block text-slate-700 text-sm mb-2">自定义链接（JSON 数组）</label>
            <input
              type="text"
              value={configs.custom_links || ""}
              onChange={(e) => updateValue("custom_links", e.target.value)}
              className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-400"
              placeholder='[{"name":"链接名","url":"https://..."}]'
            />
          </div>
        </div>
      </AdminCard>
    </div>
  );
}
