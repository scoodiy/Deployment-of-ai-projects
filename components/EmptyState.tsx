"use client";

interface EmptyStateProps {
  message?: string;
  icon?: React.ReactNode;
}

/** 可复用的空状态组件：友好提示信息 */
export default function EmptyState({ message = "暂无数据", icon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="w-14 h-14 rounded-2xl bg-slate-500/10 flex items-center justify-center">
        {icon || (
          <svg className="w-7 h-7 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        )}
      </div>
      <p className="text-sm text-slate-500 dark:text-slate-400 font-serif">{message}</p>
    </div>
  );
}
