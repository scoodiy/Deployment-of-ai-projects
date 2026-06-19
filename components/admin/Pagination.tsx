'use client';

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages: (number | string)[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push('...');
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
    if (page < totalPages - 2) pages.push('...');
    pages.push(totalPages);
  }

  return (
    <div className="flex items-center justify-center gap-1 mt-6">
      <button onClick={() => onPageChange(page - 1)} disabled={page <= 1} className="px-3 py-1.5 text-sm rounded-lg bg-white/10 text-slate-300 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">上一页</button>
      {pages.map((p, i) => typeof p === 'number' ? (
        <button key={i} onClick={() => onPageChange(p)} className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${p === page ? 'bg-indigo-500 text-white' : 'bg-white/10 text-slate-300 hover:bg-white/20'}`}>{p}</button>
      ) : (
        <span key={i} className="px-2 text-slate-500">...</span>
      ))}
      <button onClick={() => onPageChange(page + 1)} disabled={page >= totalPages} className="px-3 py-1.5 text-sm rounded-lg bg-white/10 text-slate-300 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">下一页</button>
    </div>
  );
}
