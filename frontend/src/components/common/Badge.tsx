import clsx from 'clsx';

interface BadgeProps {
  variant: 'profit' | 'loss' | 'info' | 'warning' | 'critical';
  children: React.ReactNode;
}

export function Badge({ variant, children }: BadgeProps) {
  return (
    <span className={clsx(
      'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
      variant === 'profit' && 'bg-profit/20 text-profit',
      variant === 'loss' && 'bg-loss/20 text-loss',
      variant === 'info' && 'bg-primary-500/20 text-primary-400',
      variant === 'warning' && 'bg-yellow-500/20 text-yellow-400',
      variant === 'critical' && 'bg-loss/30 text-loss animate-pulse',
    )}>
      {children}
    </span>
  );
}
