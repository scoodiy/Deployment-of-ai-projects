"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Blog {
  id: number;
  title: string;
  slug: string;
  status: string;
  category: string;
  view_count: number;
  created_at: string;
  published_at: string | null;
}

export default function BlogsPage() {
  const router = useRouter();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [status, setStatus] = useState("");

  const loadBlogs = async () => {
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (status) params.set("status", status);
    const res = await fetch(`/api/admin/blogs?${params}`);
    const data = await res.json();
    setBlogs(data.blogs);
    setTotalPages(data.pagination.totalPages);
  };

  useEffect(() => { loadBlogs(); }, [page, status]);

  const handleDelete = async (id: number, title: string) => {
    if (!confirm(`确定删除博客「${title}」？`)) return;
    await fetch(`/api/admin/blogs/${id}`, { method: "DELETE" });
    loadBlogs();
  };

  const handleToggleStatus = async (blog: Blog) => {
    const newStatus = blog.status === "published" ? "draft" : "published";
    await fetch(`/api/admin/blogs/${blog.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    loadBlogs();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex gap-4">
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="bg-white/5 border border-white/10 text-white rounded-lg px-4 py-2">
            <option value="">全部状态</option>
            <option value="published">已发布</option>
            <option value="draft">草稿</option>
          </select>
        </div>
        <Link href="/admin/blogs/create" className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600">
          + 新建博客
        </Link>
      </div>

      <div className="bg-black/30 backdrop-blur-xl rounded-xl border border-white/10 overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="text-gray-400 border-b border-white/10 bg-white/5">
              <th className="p-4">标题</th>
              <th className="p-4">状态</th>
              <th className="p-4">分类</th>
              <th className="p-4">浏览</th>
              <th className="p-4">创建时间</th>
              <th className="p-4">操作</th>
            </tr>
          </thead>
          <tbody>
            {blogs.map((blog) => (
              <tr key={blog.id} className="border-b border-white/5 text-gray-300 hover:bg-white/5">
                <td className="p-4">{blog.title}</td>
                <td className="p-4">
                  <button onClick={() => handleToggleStatus(blog)} className={`px-3 py-1 rounded-full text-sm ${blog.status === "published" ? "bg-green-500/20 text-green-300" : "bg-yellow-500/20 text-yellow-300"}`}>
                    {blog.status === "published" ? "已发布" : "草稿"}
                  </button>
                </td>
                <td className="p-4">{blog.category || "-"}</td>
                <td className="p-4">{blog.view_count}</td>
                <td className="p-4">{new Date(blog.created_at).toLocaleDateString("zh-CN")}</td>
                <td className="p-4 space-x-2">
                  <button onClick={() => router.push(`/admin/blogs/edit/${blog.id}`)} className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded hover:bg-blue-500/30">编辑</button>
                  <button onClick={() => handleDelete(blog.id, blog.title)} className="px-3 py-1 bg-red-500/20 text-red-300 rounded hover:bg-red-500/30">删除</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-4 py-2 bg-white/10 text-white rounded-lg disabled:opacity-50">上一页</button>
          <span className="px-4 py-2 text-gray-400">{page} / {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-4 py-2 bg-white/10 text-white rounded-lg disabled:opacity-50">下一页</button>
        </div>
      )}
    </div>
  );
}
