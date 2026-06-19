"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import LoadingState from "../../../components/LoadingState";
import ErrorState from "../../../components/ErrorState";
import EmptyState from "../../../components/EmptyState";
import ConfirmDialog from "../../../components/admin/ConfirmDialog";
import Pagination from "../../../components/admin/Pagination";

interface MediaFile {
  id: number;
  filename: string;
  original_name: string;
  url: string;
  size: number;
  mime_type: string;
  usage_type: string;
  created_at: string;
}

export default function MediaPage() {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [confirmDelete, setConfirmDelete] = useState<{ id: number; name: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadFiles = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`/api/admin/media?page=${page}&limit=24`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.success) {
        setFiles(data.data.files || []);
        setTotalPages(data.data.pagination?.totalPages || 1);
      } else {
        throw new Error(data.error?.message || "加载失败");
      }
    } catch (e) {
      console.error("Load media error:", e);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { loadFiles(); }, [loadFiles]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side validation
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      alert("文件大小超过10MB限制");
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
      loadFiles();
    } catch (e: any) {
      alert(e.message || "上传失败");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      const res = await fetch(`/api/admin/media/${confirmDelete.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("删除失败");
      setConfirmDelete(null);
      loadFiles();
    } catch (e) {
      alert("删除失败，请重试");
    }
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(window.location.origin + url);
    alert("已复制URL");
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">图片管理</h2>
        <div>
          <input type="file" ref={fileInputRef} onChange={handleUpload} className="hidden" accept="image/*,audio/*" />
          <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 disabled:opacity-50">
            {uploading ? "上传中..." : "📤 上传文件"}
          </button>
        </div>
      </div>

      {loading ? (
        <LoadingState text="加载媒体文件..." />
      ) : error ? (
        <ErrorState onRetry={loadFiles} />
      ) : files.length === 0 ? (
        <EmptyState message="暂无文件，点击上方按钮上传" />
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {files.map((file) => (
              <div key={file.id} className="bg-black/30 backdrop-blur-xl rounded-xl border border-white/10 overflow-hidden group">
                {file.mime_type.startsWith("image/") ? (
                  <img src={file.url} alt={file.original_name} className="w-full h-32 object-cover" loading="lazy" />
                ) : (
                  <div className="w-full h-32 bg-white/5 flex items-center justify-center text-4xl">🎵</div>
                )}
                <div className="p-3">
                  <p className="text-white text-sm truncate">{file.original_name}</p>
                  <p className="text-gray-500 text-xs">{(file.size / 1024).toFixed(1)} KB</p>
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => copyUrl(file.url)} className="flex-1 px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-xs hover:bg-blue-500/30">复制URL</button>
                    <button onClick={() => setConfirmDelete({ id: file.id, name: file.original_name })} className="px-2 py-1 bg-red-500/20 text-red-300 rounded text-xs hover:bg-red-500/30">删除</button>
                  </div>
                </div>
              </div>
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
    </div>
  );
}
