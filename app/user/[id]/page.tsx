'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';

interface UserProfile {
  id: number;
  username: string;
  nickname: string;
  avatar: string;
  bio: string;
  signature: string;
  status: string;
  created_at: string;
  comment_count: number;
}

export default function UserProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchProfile = () => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    fetch(`/api/user/${id}`, { signal: controller.signal })
      .then(res => {
        if (!res.ok) throw new Error('User not found');
        return res.json();
      })
      .then(data => setProfile(data.user))
      .catch(err => {
        if (err.name === 'AbortError') return;
        setError('用户不存在或已注销');
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  };

  useEffect(() => {
    return fetchProfile();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-400"></div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error || '用户不存在'}</p>
          <button onClick={fetchProfile} className="text-indigo-400 hover:text-indigo-300 text-sm mr-4">重试</button>
          <Link href="/" className="text-indigo-400 hover:text-indigo-300 text-sm">← 返回首页</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 py-20 px-4">
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="text-gray-400 hover:text-white transition-colors text-sm">← 返回首页</Link>

        <div className="mt-8 bg-black/30 backdrop-blur-xl rounded-2xl border border-white/10 p-8">
          {/* 头像和基本信息 */}
          <div className="flex items-center gap-6 mb-8">
            <div className="w-24 h-24 rounded-full bg-indigo-500/20 border-2 border-indigo-500/50 flex items-center justify-center overflow-hidden shrink-0">
              {profile.avatar ? (
                <img src={profile.avatar} alt={profile.username} className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl text-indigo-300">{(profile.nickname || profile.username).charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-white truncate">
                {profile.nickname || profile.username}
              </h1>
              {profile.nickname && (
                <p className="text-gray-400 text-sm mt-0.5">@{profile.username}</p>
              )}
              <div className="flex items-center gap-3 mt-2">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  profile.status === 'active' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
                }`}>
                  {profile.status === 'active' ? '正常' : '已封禁'}
                </span>
                <span className="text-xs text-gray-500">
                  {new Date(profile.created_at).toLocaleDateString('zh-CN')} 加入
                </span>
              </div>
            </div>
          </div>

          {/* 个性签名 */}
          {profile.signature && (
            <div className="mb-6 p-4 bg-white/5 rounded-lg border border-white/5">
              <p className="text-gray-300 italic">&ldquo;{profile.signature}&rdquo;</p>
            </div>
          )}

          {/* 个人简介 */}
          {profile.bio && (
            <div className="mb-6">
              <h2 className="text-sm font-semibold text-gray-400 mb-2 uppercase tracking-wide">个人简介</h2>
              <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{profile.bio}</p>
            </div>
          )}

          {/* 统计信息 */}
          <div className="grid grid-cols-3 gap-4 pt-6 border-t border-white/10">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{profile.comment_count}</div>
              <div className="text-xs text-gray-400 mt-1">评论</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{profile.id}</div>
              <div className="text-xs text-gray-400 mt-1">UID</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">
                {new Date(profile.created_at).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
              </div>
              <div className="text-xs text-gray-400 mt-1">注册日期</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
