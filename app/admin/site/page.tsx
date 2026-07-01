"use client";

import { useState, useEffect } from "react";
import { useToast } from "../../../components/admin/Toast";
import { ActionButton, AdminCard, AdminPageHeader } from "../../../components/admin/AdminUI";

interface Config {
  id: number;
  config_key: string;
  config_value: string;
  description: string;
}

export default function SiteConfigPage() {
  const [configs, setConfigs] = useState<Config[]>([]);
  const { toast } = useToast();
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
      const res = await fetch("/api/admin/site-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(configMap),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `保存失败 (${res.status})`);
      }
      toast("保存成功", "success");
    } catch {
      toast("保存失败", "error");
    } finally {
      setSaving(false);
    }
  };

  const updateValue = (key: string, value: string) => {
    setConfigs(configs.map((c) => c.config_key === key ? { ...c, config_value: value } : c));
  };

  const handleImageUpload = async (key: string, file: File) => {
    if (file.size > 10 * 1024 * 1024) { toast('文件超过10MB', 'error'); return; }
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await fetch('/api/admin/media/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (res.ok && data.url) {
        updateValue(key, data.url);
      } else {
        toast(data.error?.message || data.error || '上传失败', 'error');
      }
    } catch { toast('上传失败', 'error'); }
  };

  const isImageField = (key: string) => /image|avatar|background|bg|logo|cover|icon|photo/i.test(key);

  const aiConfigKeys = new Set([
    "ai_api_url",
    "ai_api_key",
    "ai_model_id",
    "ai_system_prompt",
    "ai_max_output_tokens",
    "ai_temperature",
  ]);
  const aiConfigs = configs.filter((c) => aiConfigKeys.has(c.config_key));
  const toggleConfigs = configs.filter((c) => c.config_key.startsWith("show_"));
  const otherConfigs = configs.filter((c) => !c.config_key.startsWith("show_") && c.config_key !== "danmaku_list" && !aiConfigKeys.has(c.config_key));

  const danmakuRaw = configs.find(c => c.config_key === "danmaku_list")?.config_value || "[]";
  let danmakuList: string[] = [];
  try { danmakuList = JSON.parse(danmakuRaw); } catch {}

  const updateDanmaku = (newList: string[]) => {
    updateValue("danmaku_list", JSON.stringify(newList));
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="网站配置"
        description="全局设置站点基本信息、功能开关和弹幕内容。"
        actions={
          <ActionButton tone="info" onClick={handleSave} disabled={saving}>
            {saving ? "保存中..." : "保存配置"}
          </ActionButton>
        }
      />

      <AdminCard className="p-6">
        <h3 className="text-lg font-semibold text-slate-950 mb-4">基本配置</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {otherConfigs.map((config) => (
            <div key={config.config_key}>
              <label className="block text-slate-500 text-sm mb-1">{config.description || config.config_key}</label>
              {isImageField(config.config_key) ? (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={config.config_value}
                      onChange={(e) => updateValue(config.config_key, e.target.value)}
                      className="flex-1 px-4 py-3 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-400"
                      placeholder="https://... 或上传本地图片"
                    />
                    <label className="inline-flex min-h-12 items-center justify-center rounded-md border border-slate-200 bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 cursor-pointer transition-colors hover:brightness-95 whitespace-nowrap">
                      上传
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
                    <img src={config.config_value} alt="" className="w-24 h-24 object-cover rounded-lg border border-slate-200" onError={(e) => (e.target as HTMLImageElement).style.display = 'none'} />
                  )}
                </div>
              ) : config.config_value.length > 100 ? (
                <textarea
                  value={config.config_value}
                  onChange={(e) => updateValue(config.config_key, e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-400 h-24"
                />
              ) : (
                <input
                  type="text"
                  value={config.config_value}
                  onChange={(e) => updateValue(config.config_key, e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-400"
                />
              )}
            </div>
          ))}
        </div>
      </AdminCard>

      <AdminCard className="p-6">
        <h3 className="text-lg font-semibold text-slate-950 mb-4">功能开关</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {toggleConfigs.map((config) => (
            <label key={config.config_key} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 border border-slate-200">
              <span className="text-slate-700">{config.description || config.config_key}</span>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={config.config_value === "true"}
                  onChange={(e) => updateValue(config.config_key, e.target.checked ? "true" : "false")}
                  className="sr-only"
                />
                <div className={`w-12 h-6 rounded-full transition-colors ${config.config_value === "true" ? "bg-indigo-500" : "bg-slate-300"}`}>
                  <div className={`w-5 h-5 bg-white rounded-full transition-transform transform ${config.config_value === "true" ? "translate-x-6" : "translate-x-0.5"} mt-0.5 shadow-sm`} />
                </div>
              </div>
            </label>
          ))}
        </div>
      </AdminCard>

      <AdminCard className="p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-slate-950">AI 猫猫助理设置</h3>
          <p className="mt-1 text-sm text-slate-500">
            默认使用 Pollinations 免费匿名接口。后续可改为任意 OpenAI 兼容接口，Key 留空则不发送 Authorization。
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {aiConfigs.map((config) => (
            <div key={config.config_key} className={config.config_key === "ai_system_prompt" ? "md:col-span-2" : ""}>
              <label className="block text-slate-500 text-sm mb-1">{config.description || config.config_key}</label>
              {config.config_key === "ai_system_prompt" ? (
                <textarea
                  value={config.config_value}
                  onChange={(e) => updateValue(config.config_key, e.target.value)}
                  className="h-36 w-full px-4 py-3 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-400"
                  placeholder="设置猫猫的性格、人设、回复风格..."
                />
              ) : (
                <input
                  type={config.config_key === "ai_api_key" ? "password" : config.config_key === "ai_max_output_tokens" || config.config_key === "ai_temperature" ? "number" : "text"}
                  step={config.config_key === "ai_temperature" ? "0.05" : undefined}
                  min={config.config_key === "ai_temperature" ? "0" : config.config_key === "ai_max_output_tokens" ? "16" : undefined}
                  max={config.config_key === "ai_temperature" ? "2" : config.config_key === "ai_max_output_tokens" ? "1000" : undefined}
                  value={config.config_value}
                  onChange={(e) => updateValue(config.config_key, e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-400"
                  placeholder={config.config_key === "ai_api_url" ? "https://text.pollinations.ai/openai" : ""}
                />
              )}
            </div>
          ))}
        </div>
      </AdminCard>

      <AdminCard className="p-6">
        <h3 className="text-lg font-semibold text-slate-950 mb-4">弹幕管理</h3>
        <div className="space-y-3">
          {danmakuList.map((text, idx) => (
            <div key={idx} className="flex gap-2 items-center">
              <span className="text-slate-400 text-xs w-6">{idx + 1}</span>
              <input
                type="text"
                value={text}
                onChange={(e) => {
                  const newList = [...danmakuList];
                  newList[idx] = e.target.value;
                  updateDanmaku(newList);
                }}
                className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:border-indigo-400"
              />
              <ActionButton
                tone="danger"
                onClick={() => updateDanmaku(danmakuList.filter((_, i) => i !== idx))}
              >
                删除
              </ActionButton>
            </div>
          ))}
          <ActionButton
            tone="info"
            onClick={() => updateDanmaku([...danmakuList, '新弹幕内容'])}
          >
            + 添加弹幕
          </ActionButton>
        </div>
      </AdminCard>
    </div>
  );
}
