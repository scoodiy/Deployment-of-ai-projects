import Link from 'next/link';
import type { ReactNode } from 'react';

type Tone = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'muted';

const toneClasses: Record<Tone, string> = {
  default: 'border-slate-200 bg-slate-100 text-slate-700',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  warning: 'border-amber-200 bg-amber-50 text-amber-700',
  danger: 'border-rose-200 bg-rose-50 text-rose-700',
  info: 'border-indigo-200 bg-indigo-50 text-indigo-700',
  muted: 'border-slate-200 bg-slate-50 text-slate-500',
};

export function AdminPageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white px-5 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-xl font-bold text-slate-950">{title}</h1>
        {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function AdminCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-lg border border-slate-200 bg-white shadow-sm ${className}`}>{children}</section>;
}

export function AdminToolbar({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
      {children}
    </div>
  );
}

export function StatusBadge({ children, tone = 'default' }: { children: ReactNode; tone?: Tone }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${toneClasses[tone]}`}>
      {children}
    </span>
  );
}

export function ActionButton({
  children,
  tone = 'default',
  onClick,
  href,
  type = 'button',
  disabled = false,
}: {
  children: ReactNode;
  tone?: Tone;
  onClick?: () => void;
  href?: string;
  type?: 'button' | 'submit';
  disabled?: boolean;
}) {
  const className = `inline-flex min-h-9 items-center justify-center rounded-md border px-3 py-1.5 text-sm font-semibold transition-colors ${toneClasses[tone]} hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50`;

  if (href) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} onClick={onClick} disabled={disabled} className={className}>
      {children}
    </button>
  );
}
