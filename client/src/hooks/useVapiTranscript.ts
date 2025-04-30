import { useEffect, useRef, useState } from 'react';

export interface Transcript {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface UseVapiTranscriptOptions {
  callId: string;
  publicKey: string;
}

export function useVapiTranscript({ callId, publicKey }: UseVapiTranscriptOptions) {
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!callId || !publicKey) return;
    const wsUrl = `wss://api.vapi.ai/calls/${callId}/websocket?public_key=${publicKey}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('Connected to Vapi WebSocket');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'transcript' && data.transcriptType === 'final') {
          setTranscripts(prev => [
            ...prev,
            {
              role: data.role,
              content: data.transcript,
              timestamp: new Date().toISOString(),
            },
          ]);
        }
      } catch (err) {
        console.error('Error parsing Vapi WS message:', err);
      }
    };

    ws.onerror = (err) => {
      console.error('Vapi WebSocket error:', err);
    };

    ws.onclose = () => {
      console.log('Vapi WebSocket closed');
    };

    return () => {
      ws.close();
    };
  }, [callId, publicKey]);

  return transcripts;
} 