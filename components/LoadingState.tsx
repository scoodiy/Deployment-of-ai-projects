"use client";

interface LoadingStateProps {
  text?: string;
}

/** 可复用的加载状态组件：旋转指示器 + 提示文字 */
export default function LoadingState({ text = "加载中..." }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="relative w-10 h-10">
        <div className="absolute inset-0 border-2 border-indigo-500/20 rounded-full"></div>
        <div className="absolute inset-0 border-2 border-transparent border-t-indigo-500 rounded-full animate-spin"></div>
      </div>
      <span className="text-sm text-slate-500 dark:text-slate-400 font-serif tracking-wider">{text}</span>
    </div>
  );
}
