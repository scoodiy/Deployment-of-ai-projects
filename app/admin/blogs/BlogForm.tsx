"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

interface MediaFile {
  id: number;
  filename: string;
  original_name: string;
  url: string;
  size: number;
}

interface BlogFormProps {
  blogId?: number;
}

const DRAFT_KEY_PREFIX = "blog_draft_";

export default function BlogForm({ blogId }: BlogFormProps) {
  const router = useRouter();
  const [form, setForm] = useState({
    title: "",
    slug: "",
    summary: "",
    content: "",
    cover_image: "",
    category: "",
    tags: "" as string | string[],
    status: "draft",
    seo_title: "",
    seo_description: "",
    og_image: "",
  });
  const [tagsList, setTagsList] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [mediaOpen, setMediaOpen] = useState(false);
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [mediaPage, setMediaPage] = useState(1);
  const [mediaTotalPages, setMediaTotalPages] = useState(1);
  const [autoSaveLabel, setAutoSaveLabel] = useState("");
  const [seoOpen, setSeoOpen] = useState(false);
  const autoSaveTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastSaved = useRef("");
  const formRef = useRef(form);
  formRef.current = form;

  const draftKey = blogId ? `${DRAFT_KEY_PREFIX}edit_${blogId}` : `${DRAFT_KEY_PREFIX}new`;

  // Load blog data
  useEffect(() => {
    if (blogId) {
      fetch(`/api/admin/blogs/${blogId}`)
        .then((res) => res.json())
        .then((data) => {
          const blog = data.blog;
          let tags: string[] = [];
          try {
            tags = typeof blog.tags === "string" ? JSON.parse(blog.tags) : (blog.tags || []);
          } catch {
            tags = [];
          }
          setTagsList(tags);
          setForm({
            title: blog.title || "",
            slug: blog.slug || "",
            summary: blog.summary || "",
            content: blog.content || "",
            cover_image: blog.cover_image || "",
            category: blog.category || "",
            tags: blog.tags || "",
            status: blog.status || "draft",
            seo_title: blog.seo_title || "",
            seo_description: blog.seo_description || "",
            og_image: blog.og_image || "",
          });
        });
    }
  }, [blogId]);

  // Restore draft from localStorage (only for new blog)
  useEffect(() => {
    if (!blogId) {
      try {
        const saved = localStorage.getItem(draftKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          setForm((prev) => ({ ...prev, ...parsed }));
          if (parsed.tags && Array.isArray(parsed.tags)) {
            setTagsList(parsed.tags);
          }
        }
      } catch {
        // ignore
      }
    }
  }, [blogId, draftKey]);

  // Auto-save to localStorage every 30 seconds
  const doSave = useCallback(() => {
    const current = JSON.stringify({ ...formRef.current, tags: tagsList });
    if (current === lastSaved.current) return;
    try {
      localStorage.setItem(draftKey, JSON.stringify({ ...formRef.current, tags: tagsList }));
      lastSaved.current = current;
      setAutoSaveLabel(`自动保存 ${new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`);
      setTimeout(() => setAutoSaveLabel(""), 3000);
    } catch {
      // localStorage full or unavailable
    }
  }, [draftKey, tagsList]);

  useEffect(() => {
    autoSaveTimer.current = setInterval(doSave, 30000);
    return () => {
      if (autoSaveTimer.current) clearInterval(autoSaveTimer.current);
    };
  }, [doSave]);

  // Remove draft on successful save
  const clearDraft = () => {
    try {
      localStorage.removeItem(draftKey);
    } catch {
      // ignore
    }
  };

  const handleSubmit = async (e: React.FormEvent, submitStatus: string) => {
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
          status: submitStatus,
          tags: tagsList,
          seo_title: form.seo_title,
          seo_description: form.seo_description,
          og_image: form.og_image,
        }),
      });

      if (res.ok) {
        clearDraft();
        router.push("/admin/blogs");
      } else {
        const data = await res.json();
        alert(data.error?.message || data.error || "保存失败");
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

  const handleTitleChange = (title: string) => {
    setForm((prev) => {
      if (
        !prev.slug ||
        prev.slug ===
          prev.title
            .toLowerCase()
            .replace(/[^\w\u4e00-\u9fa5]+/g, "-")
            .replace(/^-+|-+$/g, "")
      ) {
        const autoSlug = title
          .toLowerCase()
          .replace(/[^\w\u4e00-\u9fa5]+/g, "-")
          .replace(/^-+|-+$/g, "");
        return { ...prev, title, slug: autoSlug };
      }
      return { ...prev, title };
    });
  };

  // Tag management
  const addTag = () => {
    const trimmed = tagInput.trim();
    if (!trimmed || tagsList.includes(trimmed)) {
      setTagInput("");
      return;
    }
    setTagsList([...tagsList, trimmed]);
    setTagInput("");
  };

  const removeTag = (index: number) => {
    setTagsList(tagsList.filter((_, i) => i !== index));
  };

  // Media picker
  const loadMedia = useCallback(
    async (page = 1) => {
      setMediaLoading(true);
      try {
        const res = await fetch(`/api/admin/media?page=${page}&limit=12&type=image`);
        const data = await res.json();
        if (data.success) {
          setMediaFiles(data.data.files || []);
          setMediaTotalPages(data.data.pagination?.totalPages || 1);
          setMediaPage(page);
        }
      } catch {
        // ignore
      } finally {
        setMediaLoading(false);
      }
    },
    []
  );

  const openMediaPicker = () => {
    setMediaOpen(true);
    loadMedia(1);
  };

  const selectMedia = (url: string) => {
    setForm({ ...form, cover_image: url });
    setMediaOpen(false);
  };

  // Upload
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      alert("文件超过10MB");
      return;
    }
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/admin/media/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok && data.url) {
        setForm((prev) => ({ ...prev, cover_image: data.url }));
      } else {
        alert(data.error?.message || data.error || "上传失败");
      }
    } catch {
      alert("上传失败");
    }
    e.target.value = "";
  };

  // Preview
  const handlePreview = () => {
    if (!form.slug) {
      alert("请先填写 Slug 后再预览");
      return;
    }
    window.open(`/posts/${form.slug}`, "_blank");
  };

  return (
    <form onSubmit={(e) => handleSubmit(e, form.status)} className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-5 py-3 shadow-sm">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          {autoSaveLabel && (
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
              {autoSaveLabel}
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handlePreview}
            className="inline-flex min-h-9 items-center justify-center rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            预览
          </button>
          <button
            type="button"
            onClick={() => doSave()}
            className="inline-flex min-h-9 items-center justify-center rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            手动保存草稿
          </button>
          <button
            type="submit"
            disabled={saving}
            onClick={(e) => {
              setForm({ ...form, status: "draft" });
              handleSubmit(e, "draft");
            }}
            className="inline-flex min-h-9 items-center justify-center rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            {saving ? "保存中..." : "保存草稿"}
          </button>
          <button
            type="submit"
            disabled={saving}
            onClick={(e) => {
              setForm({ ...form, status: "published" });
              handleSubmit(e, "published");
            }}
            className="inline-flex min-h-9 items-center justify-center rounded-md border border-indigo-200 bg-indigo-50 px-4 py-1.5 text-sm font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors"
          >
            {saving ? "发布中..." : "发布"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/admin/blogs")}
            className="inline-flex min-h-9 items-center justify-center rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-400 hover:text-slate-600 transition-colors"
          >
            取消
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column */}
        <div className="space-y-6">
          <div>
            <label className="block text-slate-700 text-sm font-semibold mb-2">标题 *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="w-full min-h-10 rounded-md border border-slate-200 px-3 text-sm text-slate-900 outline-none focus:border-indigo-400"
              required
            />
          </div>

          <div>
            <label className="block text-slate-700 text-sm font-semibold mb-2">
              Slug *
              <button type="button" onClick={generateSlug} className="ml-2 text-indigo-500 hover:text-indigo-600 text-xs font-normal">
                自动生成
              </button>
            </label>
            <input
              type="text"
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              className="w-full min-h-10 rounded-md border border-slate-200 px-3 text-sm text-slate-900 outline-none focus:border-indigo-400"
              required
            />
          </div>

          <div>
            <label className="block text-slate-700 text-sm font-semibold mb-2">分类</label>
            <input
              type="text"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full min-h-10 rounded-md border border-slate-200 px-3 text-sm text-slate-900 outline-none focus:border-indigo-400"
            />
          </div>

          {/* Tag management */}
          <div>
            <label className="block text-slate-700 text-sm font-semibold mb-2">标签</label>
            <div className="flex flex-wrap gap-2 min-h-[40px] p-2 rounded-md border border-slate-200 bg-white">
              {tagsList.map((tag, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(i)}
                    className="ml-0.5 text-indigo-400 hover:text-rose-500 text-sm leading-none"
                  >
                    ×
                  </button>
                </span>
              ))}
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag();
                  }
                }}
                placeholder="输入标签后回车添加..."
                className="flex-1 min-w-[120px] border-none outline-none text-sm text-slate-700 bg-transparent py-1"
              />
            </div>
          </div>

          {/* Cover image */}
          <div>
            <label className="block text-slate-700 text-sm font-semibold mb-2">封面图</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={form.cover_image}
                onChange={(e) => setForm({ ...form, cover_image: e.target.value })}
                className="flex-1 min-h-10 rounded-md border border-slate-200 px-3 text-sm text-slate-900 outline-none focus:border-indigo-400"
                placeholder="https://... 或选择/上传图片"
              />
              <button
                type="button"
                onClick={openMediaPicker}
                className="inline-flex min-h-10 items-center justify-center rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors whitespace-nowrap"
              >
                从媒体库选择
              </button>
              <label className="inline-flex min-h-10 items-center justify-center rounded-md border border-indigo-200 bg-indigo-50 px-3 text-sm font-semibold text-indigo-700 hover:bg-indigo-100 cursor-pointer transition-colors whitespace-nowrap">
                上传
                <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
              </label>
            </div>
            {form.cover_image && (
              <div className="mt-2 relative w-full max-w-xs">
                <img
                  src={form.cover_image}
                  alt="封面预览"
                  className="w-full h-32 object-cover rounded-lg border border-slate-200"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-slate-700 text-sm font-semibold mb-2">摘要</label>
            <textarea
              value={form.summary}
              onChange={(e) => setForm({ ...form, summary: e.target.value })}
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-400 h-24 resize-y"
            />
          </div>

          {/* SEO settings */}
          <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
            <button
              type="button"
              onClick={() => setSeoOpen(!seoOpen)}
              className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <span>SEO 设置</span>
              <span className="text-slate-400 transition-transform" style={{ transform: seoOpen ? "rotate(180deg)" : "rotate(0deg)" }}>
                ▼
              </span>
            </button>
            {seoOpen && (
              <div className="px-4 pb-4 space-y-4 border-t border-slate-100 pt-4">
                <div>
                  <label className="block text-slate-600 text-xs font-semibold mb-1">
                    SEO 标题
                    <span className="text-slate-400 font-normal ml-1">留空则使用文章标题</span>
                  </label>
                  <input
                    type="text"
                    value={form.seo_title}
                    onChange={(e) => setForm({ ...form, seo_title: e.target.value })}
                    className="w-full min-h-10 rounded-md border border-slate-200 px-3 text-sm text-slate-900 outline-none focus:border-indigo-400"
                    placeholder="自定义 SEO 标题..."
                  />
                </div>
                <div>
                  <label className="block text-slate-600 text-xs font-semibold mb-1">
                    SEO 描述
                    <span className="text-slate-400 font-normal ml-1">留空则使用文章摘要</span>
                  </label>
                  <textarea
                    value={form.seo_description}
                    onChange={(e) => setForm({ ...form, seo_description: e.target.value })}
                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-400 h-20 resize-y"
                    placeholder="用于搜索引擎和社交分享的描述..."
                  />
                </div>
                <div>
                  <label className="block text-slate-600 text-xs font-semibold mb-1">
                    OG 图片
                    <span className="text-slate-400 font-normal ml-1">社交分享时的展示图片，留空则使用封面图</span>
                  </label>
                  <input
                    type="text"
                    value={form.og_image}
                    onChange={(e) => setForm({ ...form, og_image: e.target.value })}
                    className="w-full min-h-10 rounded-md border border-slate-200 px-3 text-sm text-slate-900 outline-none focus:border-indigo-400"
                    placeholder="https://..."
                  />
                  {form.og_image && (
                    <img
                      src={form.og_image}
                      alt="OG 图片预览"
                      className="mt-2 w-full max-w-xs h-24 object-cover rounded-lg border border-slate-200"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right column - content editor */}
        <div>
          <label className="block text-slate-700 text-sm font-semibold mb-2">内容（支持 Markdown）</label>
          <textarea
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            className="w-full rounded-md border border-slate-200 px-3 py-3 text-sm text-slate-900 outline-none focus:border-indigo-400 font-mono min-h-[300px] lg:min-h-[500px] resize-y"
          />
        </div>
      </div>

      {/* Media picker modal */}
      {mediaOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setMediaOpen(false)}>
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-slate-200 px-5 py-4 flex items-center justify-between rounded-t-xl">
              <h3 className="text-lg font-bold text-slate-900">从媒体库选择封面图</h3>
              <button
                type="button"
                onClick={() => setMediaOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xl leading-none"
              >
                ×
              </button>
            </div>
            <div className="p-4">
              {mediaLoading ? (
                <div className="flex items-center justify-center py-12 text-slate-500 text-sm">加载中...</div>
              ) : mediaFiles.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400 text-sm">
                  <span className="text-4xl mb-2">🖼️</span>
                  <span>暂无图片，请先上传</span>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {mediaFiles.map((file) => (
                      <button
                        key={file.id}
                        type="button"
                        onClick={() => selectMedia(file.url)}
                        className={`relative group rounded-lg overflow-hidden border-2 transition-colors ${
                          form.cover_image === file.url
                            ? "border-indigo-500 ring-2 ring-indigo-200"
                            : "border-slate-200 hover:border-indigo-300"
                        }`}
                      >
                        <img
                          src={file.url}
                          alt={file.original_name}
                          className="w-full h-24 object-cover"
                          loading="lazy"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = "none";
                            target.nextElementSibling?.classList.remove("hidden");
                          }}
                        />
                        <div className="hidden w-full h-24 bg-slate-100 items-center justify-center text-xs text-slate-400">
                          加载失败
                        </div>
                        <div className="absolute inset-0 bg-indigo-500/0 group-hover:bg-indigo-500/10 transition-colors flex items-end">
                          <span className="w-full bg-black/50 text-white text-[10px] truncate px-1.5 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            {file.original_name}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                  {mediaTotalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-4">
                      <button
                        type="button"
                        disabled={mediaPage <= 1}
                        onClick={() => loadMedia(mediaPage - 1)}
                        className="min-h-8 rounded-md border border-slate-200 px-3 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                      >
                        上一页
                      </button>
                      <span className="text-xs text-slate-500">
                        {mediaPage} / {mediaTotalPages}
                      </span>
                      <button
                        type="button"
                        disabled={mediaPage >= mediaTotalPages}
                        onClick={() => loadMedia(mediaPage + 1)}
                        className="min-h-8 rounded-md border border-slate-200 px-3 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                      >
                        下一页
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
