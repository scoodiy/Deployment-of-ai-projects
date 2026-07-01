'use client';

import { useEffect, useState } from 'react';

interface ConfirmDialogProps {
  open: boolean;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

interface InputDialogProps {
  open: boolean;
  title?: string;
  message: string;
  placeholder?: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  onConfirm: (value: string) => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open, title = '确认操作', message, confirmText = '确认', cancelText = '取消', danger = false, onConfirm, onCancel
}: ConfirmDialogProps) {
  useEffect(() => {
    if (open) {
      const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
      window.addEventListener('keydown', handler);
      return () => window.removeEventListener('keydown', handler);
    }
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4 border border-white/20">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{title}</h3>
        <p className="text-sm text-slate-600 dark:text-slate-300 mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="px-4 py-2 text-sm rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">{cancelText}</button>
          <button onClick={onConfirm} className={`px-4 py-2 text-sm rounded-lg text-white transition-colors ${danger ? 'bg-red-500 hover:bg-red-600' : 'bg-indigo-500 hover:bg-indigo-600'}`}>{confirmText}</button>
        </div>
      </div>
    </div>
  );
}

export function InputDialog({
  open, title = '输入', message, placeholder = '', confirmText = '确认', cancelText = '取消', danger = false, onConfirm, onCancel
}: InputDialogProps) {
  const [value, setValue] = useState('');

  useEffect(() => {
    if (open) {
      const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
      window.addEventListener('keydown', handler);
      return () => window.removeEventListener('keydown', handler);
    }
  }, [open, onCancel]);

  // Reset input when dialog opens
  useEffect(() => { if (open) setValue(''); }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4 border border-white/20">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{title}</h3>
        <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">{message}</p>
        <input
          type="text"
          value={value}
          onChange={e => setValue(e.target.value)}
          placeholder={placeholder}
          className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 mb-4"
          autoFocus
          onKeyDown={e => { if (e.key === 'Enter' && value.trim()) onConfirm(value.trim()); }}
        />
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="px-4 py-2 text-sm rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">{cancelText}</button>
          <button
            onClick={() => value.trim() && onConfirm(value.trim())}
            disabled={!value.trim()}
            className={`px-4 py-2 text-sm rounded-lg text-white transition-colors ${
              !value.trim() ? 'bg-slate-300 dark:bg-slate-600 cursor-not-allowed' : danger ? 'bg-red-500 hover:bg-red-600' : 'bg-indigo-500 hover:bg-indigo-600'
            }`}
          >{confirmText}</button>
        </div>
      </div>
    </div>
  );
}
