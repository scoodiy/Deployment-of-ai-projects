'use client';

import { useState } from "react";

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
      <h2 className="text-2xl font-bold text-white">系统设置</h2>

      <div className="bg-black/30 backdrop-blur-xl rounded-xl border border-white/10 p-6">
        <h3 className="text-white text-lg mb-4">🔐 修改密码</h3>
        
        <form onSubmit={handleChangePassword} className="max-w-md space-y-4">
          <div>
            <label className="block text-gray-300 text-sm mb-2">旧密码</label>
            <input
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500"
              required
            />
          </div>

          <div>
            <label className="block text-gray-300 text-sm mb-2">新密码</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500"
              required
              minLength={6}
            />
          </div>

          <div>
            <label className="block text-gray-300 text-sm mb-2">确认新密码</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500"
              required
              minLength={6}
            />
          </div>

          {message.text && (
            <div className={`p-3 rounded-lg text-sm ${
              message.type === "success" 
                ? "bg-green-500/10 border border-green-500/20 text-green-300" 
                : "bg-red-500/10 border border-red-500/20 text-red-300"
            }`}>
              {message.text}
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 disabled:opacity-50"
          >
            {saving ? "修改中..." : "修改密码"}
          </button>
        </form>
      </div>

      <div className="bg-black/30 backdrop-blur-xl rounded-xl border border-white/10 p-6">
        <h3 className="text-white text-lg mb-4">ℹ️ 系统信息</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-300">
          <div className="flex justify-between p-3 bg-white/5 rounded-lg">
            <span>框架</span>
            <span className="text-purple-300">Next.js 16.2.1</span>
          </div>
          <div className="flex justify-between p-3 bg-white/5 rounded-lg">
            <span>数据库</span>
            <span className="text-purple-300">SQLite</span>
          </div>
          <div className="flex justify-between p-3 bg-white/5 rounded-lg">
            <span>域名</span>
            <span className="text-purple-300">ayuu.fun</span>
          </div>
          <div className="flex justify-between p-3 bg-white/5 rounded-lg">
            <span>HTTPS</span>
            <span className="text-green-300">✓ 已启用</span>
          </div>
        </div>
      </div>
    </div>
  );
}
