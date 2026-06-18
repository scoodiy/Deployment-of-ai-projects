'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
  const router = useRouter();

  useEffect(() => {
    fetch('/api/admin/profile')
      .then(res => {
        if (res.ok) {
          router.replace('/admin/dashboard');
        } else {
          router.replace('/admin/login');
        }
      })
      .catch(() => router.replace('/admin/login'));
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
      <div className="text-white">加载中...</div>
    </div>
  );
}
