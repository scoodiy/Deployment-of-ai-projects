"use client";

import { useState, useEffect, useCallback } from 'react';
import { useUser } from './UserProvider';
import Link from 'next/link';

interface Comment {
  id: number;
  user_id: number;
  target_type: string;
  target_id: number;
  content: string;
  parent_id: number | null;
  status: string;
  created_at: string;
  updated_at: string;
  nickname: string | null;
  avatar: string | null;
  username: string | null;
}

interface SiteCommentsProps {
  targetType: string;
  targetId: number | string;
}

export default function SiteComments({ targetType, targetId }: SiteCommentsProps) {
  const { user } = useUser();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchComments = useCallback(async () => {
    try {
      const res = await fetch(`/api/comments?target_type=${targetType}&target_id=${targetId}`);
      const data = await res.json();
      setComments(data.comments || []);
    } catch (err) {
      console.error('Failed to load comments:', err);
    } finally {
      setLoading(false);
    }
  }, [targetType, targetId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleSubmit = async () => {
    if (!content.trim() || submitting) return;
    setSubmitting(true);

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('user_token') : null;
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          target_type: targetType,
          target_id: Number(targetId),
          content: content.trim(),
        }),
      });

      if (res.ok) {
        setContent('');
        fetchComments();
      } else {
        const data = await res.json();
        alert(data.error || '评论失败');
      }
    } catch {
      alert('网络错误');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定删除这条评论？')) return;
    setDeletingId(id);

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('user_token') : null;
      const res = await fetch(`/api/comments/${id}`, {
        method: 'DELETE',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (res.ok) {
        fetchComments();
      } else {
        const data = await res.json();
        alert(data.error || '删除失败');
      }
    } catch {
      alert('网络错误');
    } finally {
      setDeletingId(null);
    }
  };

  const getDisplayName = (comment: Comment) => {
    return comment.nickname || comment.username || '匿名用户';
  };

  const getAvatar = (comment: Comment) => {
    if (comment.avatar) return comment.avatar;
    const name = getDisplayName(comment);
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6366f1&color=fff&size=80`;
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr + (dateStr.includes('Z') ? '' : 'Z'));
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 30) return `${days}天前`;
    return date.toLocaleDateString('zh-CN');
  };

  // 获取当前用户ID（从 user_token 解析或匹配 user_id）
  const getCurrentUserId = (): number | null => {
    if (typeof window === 'undefined') return null;
    const token = localStorage.getItem('user_token');
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.userId as number;
    } catch {
      return null;
    }
  };

  const currentUserId = getCurrentUserId();

  return (
    <div className="w-full">
      {/* 评论列表 */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="w-5 h-5 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
          <span className="ml-2 text-sm text-slate-500">加载中...</span>
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-8 text-slate-400 text-sm font-serif">
          暂无评论，来抢沙发吧 ✨
        </div>
      ) : (
        <div className="space-y-4 mb-6">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className="flex gap-3 p-3 md:p-4 rounded-xl bg-white/30 dark:bg-slate-800/30 backdrop-blur-sm border border-white/20 dark:border-white/5 transition-all hover:bg-white/50 dark:hover:bg-slate-800/50"
            >
              <img
                src={getAvatar(comment)}
                alt={getDisplayName(comment)}
                className="w-8 h-8 md:w-10 md:h-10 rounded-full object-cover flex-shrink-0 border border-white/30"
                referrerPolicy="no-referrer"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">
                    {getDisplayName(comment)}
                  </span>
                  <span className="text-[10px] md:text-xs text-slate-400 flex-shrink-0">
                    {formatTime(comment.created_at)}
                  </span>
                </div>
                <p className="text-sm text-slate-700 dark:text-slate-300 mt-1 leading-relaxed whitespace-pre-wrap break-words">
                  {comment.content}
                </p>
                {currentUserId && currentUserId === comment.user_id && (
                  <button
                    onClick={() => handleDelete(comment.id)}
                    disabled={deletingId === comment.id}
                    className="mt-1.5 text-[10px] md:text-xs text-red-400 hover:text-red-500 transition-colors disabled:opacity-50"
                  >
                    {deletingId === comment.id ? '删除中...' : '删除'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 评论输入区 */}
      {user ? (
        <div className="flex gap-3 items-start">
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
            {(user.username || '?')[0].toUpperCase()}
          </div>
          <div className="flex-1">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="写下你的想法..."
              rows={3}
              maxLength={2000}
              className="w-full bg-white/30 dark:bg-slate-900/40 backdrop-blur-md border border-white/30 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all resize-none"
            />
            <div className="flex items-center justify-between mt-2">
              <span className="text-[10px] text-slate-400">{content.length}/2000</span>
              <button
                onClick={handleSubmit}
                disabled={!content.trim() || submitting}
                className="px-5 py-1.5 bg-indigo-500 text-white text-sm font-bold rounded-lg hover:bg-indigo-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-indigo-500/30 hover:shadow-lg hover:shadow-indigo-500/40"
              >
                {submitting ? '发送中...' : '发送'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-4 px-6 rounded-xl bg-white/20 dark:bg-slate-800/20 backdrop-blur-sm border border-white/20 dark:border-white/5">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            <Link href="/login" className="text-indigo-500 hover:text-indigo-600 font-bold transition-colors">
              请先登录
            </Link>
            {' '}后参与评论
          </p>
        </div>
      )}
    </div>
  );
}
