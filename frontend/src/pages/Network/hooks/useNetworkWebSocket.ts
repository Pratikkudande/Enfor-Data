import { useState, useEffect, useRef, useCallback } from 'react';
import { ENV } from '../../../config/env';
import { WsOutbound } from '../types';

export function useNetworkWebSocket(
  token: string | null,
  onMessage: (msg: WsOutbound) => void,
) {
  const wsRef = useRef<WebSocket | null>(null);
  const [online, setOnline] = useState(false);
  const [reconnectCount, setReconnectCount] = useState(0);
  const mountedRef = useRef(true);
  const delayRef = useRef(1000); // ms, doubles on each failure (capped 30 s)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onMsgRef = useRef(onMessage);

  useEffect(() => {
    onMsgRef.current = onMessage;
  }, [onMessage]);

  const connect = useCallback(() => {
    if (!token || !mountedRef.current) return;
    if (wsRef.current && wsRef.current.readyState <= WebSocket.OPEN) return;

    const wsBase = ENV.API_URL.replace(/^http/, 'ws');
    const ws = new WebSocket(`${wsBase}/network/ws?token=${token}`);
    wsRef.current = ws;

    ws.onopen = () => {
      if (!mountedRef.current) return;
      setOnline(true);
      delayRef.current = 1000;
      setReconnectCount(c => c + 1);
    };

    ws.onclose = (e) => {
      if (!mountedRef.current) return;
      setOnline(false);
      if (e.code !== 1000 && e.code !== 1001) {
        timerRef.current = setTimeout(() => {
          delayRef.current = Math.min(delayRef.current * 2, 30_000);
          connect();
        }, delayRef.current);
      }
    };

    ws.onerror = () => {
      ws.close();
    };

    ws.onmessage = (e) => {
      try {
        onMsgRef.current(JSON.parse(e.data) as WsOutbound);
      } catch {
        // ignore parse errors
      }
    };
  }, [token]);

  useEffect(() => {
    mountedRef.current = true;
    connect();
    return () => {
      mountedRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
      wsRef.current?.close(1000, 'unmount');
    };
  }, [connect]);

  const send = useCallback((data: object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  return { online, send, reconnectCount };
}
