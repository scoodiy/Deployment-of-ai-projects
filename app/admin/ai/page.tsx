"use client";

import { useEffect, useMemo, useState } from "react";
import { useToast } from "../../../components/admin/Toast";
import { ActionButton, AdminCard, AdminPageHeader, StatusBadge } from "../../../components/admin/AdminUI";

type Config = {
  id: number;
  config_key: string;
  config_value: string;
  description: string;
};

const aiDefaults: Config[] = [
  { id: -1, config_key: "show_ai_assistant", config_value: "true", description: "显示AI助手" },
  { id: -2, config_key: "ai_api_url", config_value: "https://text.pollinations.ai/openai", description: "AI接口地址（OpenAI兼容）" },
  { id: -3, config_key: "ai_api_key", config_value: "", description: "AI接口Key（免费匿名接口可留空）" },
  { id: -4, config_key: "ai_model_id", config_value: "openai", description: "AI模型ID" },
  {
    id: -5,
    config_key: "ai_system_prompt",
    config_value: "你现在是一只傲娇、聪明、有点毒舌但很可爱的暹罗猫。你的名字叫“煤球”。你的主人是一个喜欢折腾代码的极客。你说话必须简短，每次最多一两句话。喜欢在句尾加上“喵~”或者“喵呜~”。经常抱怨肚子饿，喜欢要小鱼干。回复字数最多不能超过100字。绝对不要承认自己是一个AI模型，你就是一只真实的猫。",
    description: "AI猫猫系统提示词",
  },
  { id: -6, config_key: "ai_max_output_tokens", config_value: "150", description: "AI最大输出Token" },
  { id: -7, config_key: "ai_temperature", config_value: "0.85", description: "AI温度" },
];

const labels: Record<string, string> = {
  show_ai_assistant: "启用前台猫猫助理",
  ai_api_url: "接口地址",
  ai_api_key: "API Key",
  ai_model_id: "模型 ID",
  ai_system_prompt: "猫猫人设提示词",
  ai_max_output_tokens: "最大输出 Token",
  ai_temperature: "温度",
};

const help: Record<string, string> = {
  ai_api_url: "支持 OpenAI 兼容接口。填根地址或 /chat/completions 均可。",
  ai_api_key: "免费匿名接口可以留空；私有接口会以 Bearer Token 发送。",
  ai_model_id: "Pollinations 免费接口默认可用 openai。",
  ai_temperature: "0 更稳定，数值越高越活泼，建议 0.7-0.9。",
};

function mergeConfigs(configs: Config[]) {
  const map = new Map(configs.map((item) => [item.config_key, item]));
  return aiDefaults.map((fallback) => map.get(fallback.config_key) || fallback);
}

export default function AdminAiPage() {
  const [configs, setConfigs] = useState<Config[]>(aiDefaults);
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testResult, setTestResult] = useState<string>("");

  const configMap = useMemo(() => {
    return Object.fromEntries(configs.map((config) => [config.config_key, config.config_value]));
  }, [configs]);

  useEffect(() => {
    fetch("/api/admin/site-config")
      .then((res) => res.json())
      .then((data) => setConfigs(mergeConfigs(data?.data?.configs || [])))
      .catch(() => setConfigs(aiDefaults))
      .finally(() => setLoading(false));
  }, []);

  const updateValue = (key: string, value: string) => {
    setConfigs((previous) => previous.map((config) => (
      config.config_key === key ? { ...config, config_value: value } : config
    )));
  };

  const save = async () => {
    setSaving(true);
    const body = Object.fromEntries(configs.map((config) => [config.config_key, config.config_value]));

    try {
      const res = await fetch("/api/admin/site-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("save failed");
      toast("AI猫猫配置已保存", "success");
    } catch {
      toast("保存失败", "error");
    } finally {
      setSaving(false);
    }
  };

  const checkRuntimeConfig = async () => {
    setTestResult("检测中...");
    try {
      const res = await fetch("/api/chat");
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "检测失败");
      setTestResult(`接口已读取配置：${data.model} -> ${data.endpoint}`);
    } catch (error) {
      setTestResult(error instanceof Error ? error.message : "检测失败");
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="AI猫猫助理"
        description="管理前台猫猫的显示状态、模型接口和回复人设。"
        actions={
          <>
            <ActionButton tone="muted" onClick={checkRuntimeConfig} disabled={loading}>检测当前接口</ActionButton>
            <ActionButton tone="info" onClick={save} disabled={saving || loading}>
              {saving ? "保存中..." : "保存配置"}
            </ActionButton>
          </>
        }
      />

      <AdminCard className="p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-950">运行状态</h3>
            <p className="mt-1 text-sm text-slate-500">
              前台猫猫调用 /api/chat；当前站点要求普通用户登录后才能发起模型对话。
            </p>
          </div>
          <StatusBadge tone={configMap.show_ai_assistant === "true" ? "success" : "muted"}>
            {configMap.show_ai_assistant === "true" ? "已启用" : "已关闭"}
          </StatusBadge>
        </div>

        {testResult ? (
          <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
            {testResult}
          </div>
        ) : null}
      </AdminCard>

      <AdminCard className="p-6">
        <h3 className="text-lg font-semibold text-slate-950">模型配置</h3>
        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-4 md:col-span-2">
            <span>
              <span className="block text-sm font-semibold text-slate-800">{labels.show_ai_assistant}</span>
              <span className="mt-1 block text-xs text-slate-500">关闭后前台不显示悬浮猫猫。</span>
            </span>
            <input
              type="checkbox"
              checked={configMap.show_ai_assistant === "true"}
              onChange={(event) => updateValue("show_ai_assistant", event.target.checked ? "true" : "false")}
              className="h-5 w-5 accent-indigo-500"
            />
          </label>

          {configs.filter((config) => config.config_key !== "show_ai_assistant" && config.config_key !== "ai_system_prompt").map((config) => (
            <div key={config.config_key}>
              <label className="block text-sm font-semibold text-slate-700">{labels[config.config_key] || config.description}</label>
              <input
                type={config.config_key === "ai_api_key" ? "password" : config.config_key === "ai_max_output_tokens" || config.config_key === "ai_temperature" ? "number" : "text"}
                min={config.config_key === "ai_temperature" ? "0" : config.config_key === "ai_max_output_tokens" ? "16" : undefined}
                max={config.config_key === "ai_temperature" ? "2" : config.config_key === "ai_max_output_tokens" ? "1000" : undefined}
                step={config.config_key === "ai_temperature" ? "0.05" : undefined}
                value={config.config_value}
                onChange={(event) => updateValue(config.config_key, event.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-indigo-400"
              />
              {help[config.config_key] ? <p className="mt-1 text-xs text-slate-500">{help[config.config_key]}</p> : null}
            </div>
          ))}

          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-slate-700">{labels.ai_system_prompt}</label>
            <textarea
              value={configMap.ai_system_prompt || ""}
              onChange={(event) => updateValue("ai_system_prompt", event.target.value)}
              className="mt-1 h-44 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-indigo-400"
              placeholder="设置猫猫的性格、人设、回复风格..."
            />
          </div>
        </div>
      </AdminCard>
    </div>
  );
}
