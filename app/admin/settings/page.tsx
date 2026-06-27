'use client';

import { useState } from "react";
import { ActionButton, AdminCard, AdminPageHeader, StatusBadge } from "../../../components/admin/AdminUI";

export default function SettingsPage() {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState({ type: "", text: "" });
  const [saving, setSaving] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });

    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "两次输入的密码不一致" });
      return;
    }

    if (newPassword.length < 6) {
      setMessage({ type: "error", text: "新密码至少6位" });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldPassword, newPassword }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: "success", text: "密码修改成功" });
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setMessage({ type: "error", text: data.error || "修改失败" });
      }
    } catch {
      setMessage({ type: "error", text: "网络错误" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="系统设置"
        description="修改管理员密码和查看系统基本信息。"
      />

      <AdminCard className="p-6">
        <h3 className="text-lg font-semibold text-slate-950 mb-4">修改密码</h3>

        <form onSubmit={handleChangePassword} className="max-w-md space-y-4">
          <div>
            <label className="block text-slate-700 text-sm mb-2">旧密码</label>
            <input
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-400"
              required
            />
          </div>

          <div>
            <label className="block text-slate-700 text-sm mb-2">新密码</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-400"
              required
              minLength={6}
            />
          </div>

          <div>
            <label className="block text-slate-700 text-sm mb-2">确认新密码</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-400"
              required
              minLength={6}
            />
          </div>

          {message.text && (
            <StatusBadge tone={message.type === "success" ? "success" : "danger"}>
              {message.text}
            </StatusBadge>
          )}

          <ActionButton tone="info" type="submit" disabled={saving}>
            {saving ? "修改中..." : "修改密码"}
          </ActionButton>
        </form>
      </AdminCard>

      <AdminCard className="p-6">
        <h3 className="text-lg font-semibold text-slate-950 mb-4">系统信息</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-slate-700">框架</span>
            <span className="text-indigo-600 font-medium">Next.js 16.2.1</span>
          </div>
          <div className="flex justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-slate-700">数据库</span>
            <span className="text-indigo-600 font-medium">SQLite</span>
          </div>
          <div className="flex justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-slate-700">域名</span>
            <span className="text-indigo-600 font-medium">ayuu.fun</span>
          </div>
          <div className="flex justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-slate-700">HTTPS</span>
            <StatusBadge tone="success">已启用</StatusBadge>
          </div>
        </div>
      </AdminCard>
    </div>
  );
}
