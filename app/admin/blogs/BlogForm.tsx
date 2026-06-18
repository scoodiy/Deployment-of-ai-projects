"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface BlogFormProps {
  blogId?: number;
}

export default function BlogForm({ blogId }: BlogFormProps) {
  const router = useRouter();
  const [form, setForm] = useState({
    title: "",
    slug: "",
    summary: "",
    content: "",
    cover_image: "",
    category: "",
    tags: "",
    status: "draft",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (blogId) {
      fetch(`/api/admin/blogs/${blogId}`)
        .then((res) => res.json())
        .then((data) => {
          const blog = data.blog;
          setForm({
            title: blog.title || "",
            slug: blog.slug || "",
            summary: blog.summary || "",
            content: blog.content || "",
            cover_image: blog.cover_image || "",
            category: blog.category || "",
            tags: blog.tags || "",
            status: blog.status || "draft",
          });
        });
    }
  }, [blogId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const url = blogId ? `/api/admin/blogs/${blogId}` : "/api/admin/blogs";
    const method = blogId ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          tags: form.tags ? form.tags.split(",").map((t) => t.trim()) : [],
        }),
      });

      if (res.ok) {
        router.push("/admin/blogs");
      } else {
        const data = await res.json();
        alert(data.error || "保存失败");
      }
    } catch {
      alert("保存失败");
    } finally {
      setSaving(false);
    }
  };

  const generateSlug = () => {
    const slug = form.title
      .toLowerCase()
      .replace(/[^\w\u4e00-\u9fa5]+/g, "-")
      .replace(/^-+|-+$/g, "");
    setForm({ ...form, slug });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div>
            <label className="block text-gray-300 text-sm mb-2">标题 *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500"
              required
            />
          </div>

          <div>
            <label className="block text-gray-300 text-sm mb-2">
              Slug *
              <button type="button" onClick={generateSlug} className="ml-2 text-purple-400 hover:text-purple-300 text-xs">自动生成</button>
            </label>
            <input
              type="text"
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500"
              required
            />
          </div>

          <div>
            <label className="block text-gray-300 text-sm mb-2">分类</label>
            <input
              type="text"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-gray-300 text-sm mb-2">标签（逗号分隔）</label>
            <input
              type="text"
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500"
              placeholder="标签1, 标签2, 标签3"
            />
          </div>

          <div>
            <label className="block text-gray-300 text-sm mb-2">封面图 URL</label>
            <input
              type="text"
              value={form.cover_image}
              onChange={(e) => setForm({ ...form, cover_image: e.target.value })}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500"
              placeholder="https://..."
            />
          </div>

          <div>
            <label className="block text-gray-300 text-sm mb-2">摘要</label>
            <textarea
              value={form.summary}
              onChange={(e) => setForm({ ...form, summary: e.target.value })}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500 h-24"
            />
          </div>
        </div>

        <div>
          <label className="block text-gray-300 text-sm mb-2">内容（支持 Markdown）</label>
          <textarea
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500 font-mono text-sm"
            style={{ minHeight: "500px" }}
          />
        </div>
      </div>

      <div className="flex gap-4">
        <button
          type="submit"
          disabled={saving}
          onClick={() => setForm({ ...form, status: "draft" })}
          className="px-6 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
        >
          {saving ? "保存中..." : "保存草稿"}
        </button>
        <button
          type="submit"
          disabled={saving}
          onClick={() => setForm({ ...form, status: "published" })}
          className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-colors"
        >
          {saving ? "发布中..." : "发布"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/blogs")}
          className="px-6 py-3 text-gray-400 hover:text-white transition-colors"
        >
          取消
        </button>
      </div>
    </form>
  );
}
