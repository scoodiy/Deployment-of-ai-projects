import React from 'react';
import clsx from 'clsx';

interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  className?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (item: T) => void;
}

export function Table<T extends Record<string, any>>({ columns, data, onRowClick }: TableProps<T>) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-dark-border">
            {columns.map((col) => (
              <th key={col.key} className={clsx('px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider', col.className)}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-dark-border">
          {data.map((item, i) => (
            <tr
              key={i}
              onClick={() => onRowClick?.(item)}
              className={clsx('hover:bg-dark-surface/50 transition-colors', onRowClick && 'cursor-pointer')}
            >
              {columns.map((col) => (
                <td key={col.key} className={clsx('px-4 py-3 whitespace-nowrap', col.className)}>
                  {col.render ? col.render(item) : item[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {data.length === 0 && (
        <div className="py-8 text-center text-gray-500">暂无数据</div>
      )}
    </div>
  );
}
