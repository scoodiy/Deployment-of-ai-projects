'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a' }}>
          <div style={{ textAlign: 'center', maxWidth: 500, padding: 20 }}>
            <h2 style={{ fontSize: 24, fontWeight: 'bold', color: 'white', marginBottom: 16 }}>页面加载出错</h2>
            <p style={{ color: '#94a3b8', marginBottom: 8 }}>{error.message}</p>
            <p style={{ color: '#64748b', fontSize: 12, marginBottom: 24, fontFamily: 'monospace', wordBreak: 'break-all' }}>{error.stack?.slice(0, 500)}</p>
            <button onClick={reset} style={{ padding: '8px 24px', background: '#7c3aed', color: 'white', borderRadius: 8, border: 'none', cursor: 'pointer' }}>重试</button>
          </div>
        </div>
      </body>
    </html>
  );
}
