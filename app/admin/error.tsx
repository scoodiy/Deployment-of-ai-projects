'use client';

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center max-w-md">
        <h2 className="text-2xl font-bold text-white mb-4">后台加载出错</h2>
        <p className="text-gray-400 mb-2">{error.message}</p>
        {error.digest && <p className="text-gray-500 text-xs mb-4">Digest: {error.digest}</p>}
        <p className="text-gray-500 text-xs mb-6 font-mono">{error.stack?.slice(0, 300)}</p>
        <button
          onClick={reset}
          className="px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
        >
          重试
        </button>
      </div>
    </div>
  );
}
