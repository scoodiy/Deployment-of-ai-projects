import React from 'react';
import clsx from 'clsx';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  glow?: 'green' | 'red' | 'blue';
  onClick?: () => void;
}

export function Card({ children, className, glow, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={clsx(
        'glass-card p-5 animate-fade-in transition-all duration-200 hover:border-gray-600',
        glow === 'green' && 'glow-green',
        glow === 'red' && 'glow-red',
        glow === 'blue' && 'glow-blue',
        onClick && 'cursor-pointer',
        className
      )}
    >
      {children}
    </div>
  );
}
