"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import LoadingState from "../../../components/LoadingState";
import ErrorState from "../../../components/ErrorState";
import EmptyState from "../../../components/EmptyState";
import ConfirmDialog from "../../../components/admin/ConfirmDialog";
import Pagination from "../../../components/admin/Pagination";

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
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{ id: number; title: string } | null>(null);

  const loadBlogs = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (status) params.set("status", status);
      if (keyword) params.set("keyword", keyword);
      const res = await fetch(`/api/admin/blogs?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.success) {
        setBlogs(data.data.blogs || []);
        setTotalPages(data.data.pagination?.totalPages || 1);
      } else {
        throw new Error(data.error?.message || "加载失败");
      }
    } catch (e) {
      console.error("Load blogs error:", e);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [page, status, keyword]);

  useEffect(() => { loadBlogs(); }, [loadBlogs]);

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      const res = await fetch(`/api/admin/blogs/${confirmDelete.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("删除失败");
      setConfirmDelete(null);
      loadBlogs();
    } catch (e) {
      alert("删除失败，请重试");
    }
  };

  const handleToggleStatus = async (blog: Blog) => {
    const newStatus = blog.status === "published" ? "draft" : "published";
    try {
      const res = await fetch(`/api/admin/blogs/${blog.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("更新失败");
      loadBlogs();
    } catch (e) {
      alert("状态更新失败，请重试");
    }
  };

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div className="flex gap-3 items-center">
          <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="bg-white/5 border border-white/10 text-white rounded-lg px-4 py-2">
            <option value="">全部状态</option>
            <option value="published">已发布</option>
            <option value="draft">草稿</option>
            <option value="hidden">已隐藏</option>
          </select>
          <input
            type="text"
            placeholder="搜索标题..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { setPage(1); loadBlogs(); } }}
            className="bg-white/5 border border-white/10 text-white rounded-lg px-4 py-2 placeholder-gray-500"
          />
        </div>
        <Link href="/admin/blogs/create" className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600">
          + 新建博客
        </Link>
      </div>

      {/* Content */}
      {loading ? (
        <LoadingState text="加载博客列表..." />
      ) : error ? (
        <ErrorState onRetry={loadBlogs} />
      ) : blogs.length === 0 ? (
        <EmptyState message="暂无博客文章" />
      ) : (
        <>
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
                      <button onClick={() => handleToggleStatus(blog)} className={`px-3 py-1 rounded-full text-sm ${blog.status === "published" ? "bg-green-500/20 text-green-300" : blog.status === "hidden" ? "bg-gray-500/20 text-gray-300" : "bg-yellow-500/20 text-yellow-300"}`}>
                        {blog.status === "published" ? "已发布" : blog.status === "hidden" ? "已隐藏" : "草稿"}
                      </button>
                    </td>
                    <td className="p-4">{blog.category || "-"}</td>
                    <td className="p-4">{blog.view_count}</td>
                    <td className="p-4">{new Date(blog.created_at).toLocaleDateString("zh-CN")}</td>
                    <td className="p-4 space-x-2">
                      <button onClick={() => router.push(`/admin/blogs/edit/${blog.id}`)} className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded hover:bg-blue-500/30">编辑</button>
                      <button onClick={() => setConfirmDelete({ id: blog.id, title: blog.title })} className="px-3 py-1 bg-red-500/20 text-red-300 rounded hover:bg-red-500/30">删除</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}

      <ConfirmDialog
        open={!!confirmDelete}
        title="删除博客"
        message={`确定删除博客「${confirmDelete?.title}」？此操作不可恢复。`}
        confirmText="删除"
        danger
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}
