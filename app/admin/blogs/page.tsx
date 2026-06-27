"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import LoadingState from "../../../components/LoadingState";
import ErrorState from "../../../components/ErrorState";
import EmptyState from "../../../components/EmptyState";
import ConfirmDialog from "../../../components/admin/ConfirmDialog";
import Pagination from "../../../components/admin/Pagination";
import { ActionButton, AdminCard, AdminPageHeader, AdminToolbar, StatusBadge } from "../../../components/admin/AdminUI";

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

function getBlogStatus(blog: Blog) {
  if (blog.status === "published") return { label: "已发布", tone: "success" as const };
  if (blog.status === "hidden") return { label: "已隐藏", tone: "muted" as const };
  return { label: "草稿", tone: "warning" as const };
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
    } catch (_e) {
      console.error("Error:", _e);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [page, status, keyword]);

  useEffect(() => {
    loadBlogs();
  }, [loadBlogs]);

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      const res = await fetch(`/api/admin/blogs/${confirmDelete.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("删除失败");
      setConfirmDelete(null);
      loadBlogs();
    } catch (_e) {
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
    } catch (_e) {
      alert("状态更新失败，请重试");
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="博客管理"
        description="管理文章发布、草稿状态、分类和阅读数据。"
        actions={<ActionButton href="/admin/blogs/create" tone="info">+ 新建博客</ActionButton>}
      />

      <AdminToolbar>
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="min-h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-indigo-400"
          >
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
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                setPage(1);
                loadBlogs();
              }
            }}
            className="min-h-10 flex-1 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-indigo-400"
          />
        </div>
        <ActionButton
          tone="default"
          onClick={() => {
            setPage(1);
            loadBlogs();
          }}
        >
          搜索
        </ActionButton>
      </AdminToolbar>

      {loading ? (
        <LoadingState text="加载博客列表..." />
      ) : error ? (
        <ErrorState onRetry={loadBlogs} />
      ) : blogs.length === 0 ? (
        <EmptyState message="暂无博客文章" />
      ) : (
        <>
          <AdminCard className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left">
                <thead className="bg-slate-50 text-sm text-slate-500">
                  <tr>
                    <th className="px-5 py-3 font-semibold">标题</th>
                    <th className="px-5 py-3 font-semibold">状态</th>
                    <th className="px-5 py-3 font-semibold">分类</th>
                    <th className="px-5 py-3 font-semibold">浏览</th>
                    <th className="px-5 py-3 font-semibold">创建时间</th>
                    <th className="px-5 py-3 font-semibold">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                  {blogs.map((blog) => {
                    const statusView = getBlogStatus(blog);
                    return (
                      <tr key={blog.id} className="hover:bg-slate-50">
                        <td className="px-5 py-3 font-medium text-slate-950">{blog.title}</td>
                        <td className="px-5 py-3">
                          <button type="button" onClick={() => handleToggleStatus(blog)}>
                            <StatusBadge tone={statusView.tone}>{statusView.label}</StatusBadge>
                          </button>
                        </td>
                        <td className="px-5 py-3">{blog.category || "-"}</td>
                        <td className="px-5 py-3">{blog.view_count}</td>
                        <td className="px-5 py-3 text-slate-500">{new Date(blog.created_at).toLocaleDateString("zh-CN")}</td>
                        <td className="px-5 py-3">
                          <div className="flex flex-wrap gap-2">
                            <ActionButton tone="info" onClick={() => router.push(`/admin/blogs/edit/${blog.id}`)}>编辑</ActionButton>
                            <ActionButton tone="danger" onClick={() => setConfirmDelete({ id: blog.id, title: blog.title })}>删除</ActionButton>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </AdminCard>
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
