import { useState, useEffect, useCallback } from 'react';
import { useAssistant } from '@/context/AssistantContext';

export function useWebSocket() {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const { callDetails, addTranscript } = useAssistant();

  // Initialize WebSocket connection
  const initWebSocket = useCallback(() => {
    if (socket !== null) {
      socket.close();
    }

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const newSocket = new WebSocket(wsUrl);
    
    newSocket.onopen = () => {
      console.log('WebSocket connection established');
      setConnected(true);
      
      // Send initial message with call ID if available
      if (callDetails) {
        newSocket.send(JSON.stringify({
          type: 'init',
          callId: callDetails.id
        }));
      }
    };
    
    newSocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        // Handle transcript messages
        if (data.type === 'transcript') {
          addTranscript({
            role: data.role,
            content: data.content
          });
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
    
    newSocket.onclose = () => {
      console.log('WebSocket connection closed');
      setConnected(false);
    };
    
    newSocket.onerror = (error) => {
      console.error('WebSocket error:', error);
      setConnected(false);
    };
    
    setSocket(newSocket);
    
    return () => {
      newSocket.close();
    };
  }, [callDetails, addTranscript]);

  // Send message through WebSocket
  const sendMessage = useCallback((message: any) => {
    if (socket && connected) {
      socket.send(JSON.stringify(message));
    } else {
      console.error('Cannot send message, WebSocket not connected');
    }
  }, [socket, connected]);

  // Reconnect function
  const reconnect = useCallback(() => {
    if (!connected) {
      initWebSocket();
    }
  }, [connected, initWebSocket]);

  // Initialize WebSocket on mount
  useEffect(() => {
    initWebSocket();
    
    return () => {
      if (socket) {
        socket.close();
      }
    };
  }, []);

  return { connected, sendMessage, reconnect };
}
