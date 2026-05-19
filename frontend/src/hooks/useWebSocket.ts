import { useEffect, useRef, useCallback } from 'react';
import { WS_URL } from '../utils/constants';

export function useWebSocket(onMessage?: (data: any) => void) {
  const wsRef = useRef<WebSocket | null>(null);

  const connect = useCallback(() => {
    try {
      const ws = new WebSocket(WS_URL);
      ws.onmessage = (e) => onMessage?.(JSON.parse(e.data));
      ws.onclose = () => setTimeout(connect, 3000);
      ws.onerror = () => ws.close();
      wsRef.current = ws;
    } catch (err) {
      console.error('WebSocket connection failed:', err);
      setTimeout(connect, 3000);
    }
  }, [onMessage]);

  useEffect(() => {
    connect();
    return () => wsRef.current?.close();
  }, [connect]);

  return wsRef;
}
