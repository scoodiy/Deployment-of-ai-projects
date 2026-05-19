import { useEffect } from 'react';
import { useUIStore } from '../../stores/uiStore';
import { X, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import clsx from 'clsx';

export function ToastContainer() {
  const { notifications, removeNotification } = useUIStore();

  return (
    <div className="fixed top-4 right-4 z-[100] space-y-2">
      {notifications.map((n) => (
        <Toast key={n.id} message={n.message} type={n.type} onClose={() => removeNotification(n.id)} />
      ))}
    </div>
  );
}

function Toast({ message, type, onClose }: { message: string; type: string; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={clsx(
      'glass-card p-4 pr-10 animate-fade-in flex items-center gap-3 min-w-[300px]',
      type === 'success' && 'border-profit/50',
      type === 'error' && 'border-loss/50',
      type === 'warning' && 'border-yellow-500/50',
    )}>
      {type === 'success' && <CheckCircle className="h-5 w-5 text-profit shrink-0" />}
      {type === 'error' && <AlertTriangle className="h-5 w-5 text-loss shrink-0" />}
      {type === 'warning' && <AlertTriangle className="h-5 w-5 text-yellow-400 shrink-0" />}
      {type === 'info' && <Info className="h-5 w-5 text-primary-400 shrink-0" />}
      <span className="text-sm text-gray-200">{message}</span>
      <button onClick={onClose} className="absolute top-3 right-3 p-1 hover:bg-dark-surface rounded">
        <X className="h-4 w-4 text-gray-500" />
      </button>
    </div>
  );
}
