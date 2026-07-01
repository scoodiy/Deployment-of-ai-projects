"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import LoadingState from "../../../components/LoadingState";
import ErrorState from "../../../components/ErrorState";
import EmptyState from "../../../components/EmptyState";
import ConfirmDialog from "../../../components/admin/ConfirmDialog";
import Pagination from "../../../components/admin/Pagination";
import { ActionButton, AdminCard, AdminPageHeader, AdminToolbar } from "../../../components/admin/AdminUI";
import { useToast } from "../../../components/admin/Toast";

interface MediaFile {
  id: number;
  filename: string;
  original_name: string;
  url: string;
  size: number;
  file_type: string;
  usage_type: string;
  created_at: string;
}

const TYPE_OPTIONS = [
  { label: "全部", value: "" },
  { label: "图片", value: "image" },
  { label: "音频", value: "audio" },
  { label: "视频", value: "video" },
  { label: "文档", value: "document" },
];

const TYPE_ICONS: Record<string, string> = {
  audio: "🎵",
  video: "🎬",
  document: "📄",
};

export default function MediaPage() {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [fileType, setFileType] = useState("");
  const [keyword, setKeyword] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<{ id: number; name: string } | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const loadFiles = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "24" });
      if (fileType) params.set("type", fileType);
      if (keyword) params.set("keyword", keyword);
      const res = await fetch(`/api/admin/media?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.success) {
        setFiles(data.data.files || []);
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
  }, [page, fileType, keyword]);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      toast("文件大小超过50MB限制", "error");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/admin/media/upload", { method: "POST", body: formData });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message || "上传失败");
      }
      toast("上传成功", "success");
      loadFiles();
    } catch (e: unknown) {
      toast(e instanceof Error ? e.message : "上传失败", "error");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete || deletingId) return;
    setDeletingId(String(confirmDelete.id));
    try {
      const res = await fetch(`/api/admin/media/${confirmDelete.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("删除失败");
      setConfirmDelete(null);
      toast("已删除", "success");
      loadFiles();
    } catch (_e) {
      toast("删除失败，请重试", "error");
    } finally {
      setDeletingId(null);
    }
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(window.location.origin + url);
    toast("已复制链接", "success");
  };

  const handleSearch = () => {
    setPage(1);
    loadFiles();
  };

  return (
    <div className="space-y-6">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleUpload}
        className="hidden"
        accept="image/*,audio/*,video/*,.pdf"
      />
      <AdminPageHeader
        title="图片管理"
        description="管理上传到站点的图片、音频和可复用媒体资源。"
        actions={
          <ActionButton tone="info" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
            {uploading ? "上传中..." : "上传文件"}
          </ActionButton>
        }
      />

      <AdminToolbar>
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <select
            value={fileType}
            onChange={(e) => {
              setFileType(e.target.value);
              setPage(1);
            }}
            className="min-h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-indigo-400"
          >
            {TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="搜索文件名..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSearch();
            }}
            className="min-h-10 flex-1 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-indigo-400"
          />
        </div>
        <ActionButton tone="default" onClick={handleSearch}>
          搜索
        </ActionButton>
      </AdminToolbar>

      {loading ? (
        <LoadingState text="加载媒体文件..." />
      ) : error ? (
        <ErrorState onRetry={loadFiles} />
      ) : files.length === 0 ? (
        <EmptyState message={keyword || fileType ? "没有匹配的文件" : "暂无文件，点击上方按钮上传"} />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {files.map((file) => (
              <AdminCard key={file.id} className="overflow-hidden">
                {file.file_type === "image" ? (
                  <div
                    className="relative h-36 w-full cursor-pointer overflow-hidden bg-slate-100"
                    onClick={() => setPreviewUrl(file.url)}
                  >
                    <img
                      src={file.url}
                      alt={file.original_name}
                      className="h-full w-full object-cover transition-transform hover:scale-105"
                      loading="lazy"
                      onError={(event) => {
                        event.currentTarget.classList.add("hidden");
                        event.currentTarget.nextElementSibling?.classList.remove("hidden");
                      }}
                    />
                    <div className="hidden absolute inset-0 flex items-center justify-center bg-slate-200 text-sm text-slate-500">
                      图片加载失败
                    </div>
                  </div>
                ) : (
                  <div className="flex h-36 w-full items-center justify-center bg-slate-100 text-4xl select-none">
                    {TYPE_ICONS[file.file_type] || "📎"}
                  </div>
                )}
                <div className="space-y-3 p-3">
                  <div>
                    <p className="truncate text-sm font-semibold text-slate-950" title={file.original_name}>
                      {file.original_name}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <div className="flex gap-2">
                    <ActionButton tone="info" onClick={() => copyUrl(file.url)}>
                      复制链接
                    </ActionButton>
                    <ActionButton
                      tone="danger"
                      onClick={() => setConfirmDelete({ id: file.id, name: file.original_name })}
                      disabled={deletingId === String(file.id)}
                    >
                      删除
                    </ActionButton>
                  </div>
                </div>
              </AdminCard>
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}

      <ConfirmDialog
        open={!!confirmDelete}
        title="删除文件"
        message={`确定删除「${confirmDelete?.name}」？此操作不可恢复。`}
        confirmText="删除"
        danger
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />

      {previewUrl && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setPreviewUrl(null)}
        >
          <button
            type="button"
            onClick={() => setPreviewUrl(null)}
            className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-2xl text-white hover:bg-white/20"
          >
            ✕
          </button>
          <img
            src={previewUrl}
            alt="预览"
            className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            onError={() => {
              setPreviewUrl(null);
              toast("图片加载失败", "error");
            }}
          />
        </div>
      )}
    </div>
  );
}
