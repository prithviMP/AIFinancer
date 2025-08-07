import { useEffect, useRef, useState } from 'react';

export interface WebSocketMessage {
  type: 'message' | 'error' | 'status';
  content: string;
  timestamp: string;
  isFromBot?: boolean;
}

export function useWebSocket() {
  const [messages, setMessages] = useState<WebSocketMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      setIsConnected(true);
    };

    ws.current.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        setMessages(prev => [...prev, message]);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    ws.current.onclose = () => {
      setIsConnected(false);
    };

    ws.current.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
    };

    return () => {
      if (ws.current?.readyState === WebSocket.OPEN) {
        ws.current.close();
      }
    };
  }, []);

  const sendMessage = (content: string) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({
        type: 'chat',
        content,
        timestamp: new Date().toISOString(),
      }));
    }
  };

  return {
    messages,
    isConnected,
    sendMessage,
  };
}
