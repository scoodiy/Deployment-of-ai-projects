import React from 'react';
import clsx from 'clsx';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className, ...props }: InputProps) {
  return (
    <div className="space-y-1">
      {label && <label className="block text-sm font-medium text-gray-300">{label}</label>}
      <input
        className={clsx(
          'w-full rounded-lg bg-dark-surface border border-dark-border px-3 py-2 text-sm text-white',
          'placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
          'transition-all duration-200',
          error && 'border-loss focus:ring-loss',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-loss">{error}</p>}
    </div>
  );
}
