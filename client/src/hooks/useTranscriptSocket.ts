import { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';

interface UseTranscriptSocketProps {
  socketUrl: string;
}

interface TranscriptState {
  text: string;
  isAssistantSpeaking: boolean;
}

export const useTranscriptSocket = ({ socketUrl }: UseTranscriptSocketProps) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [state, setState] = useState<TranscriptState>({
    text: '',
    isAssistantSpeaking: false,
  });

  // Khởi tạo WebSocket connection
  useEffect(() => {
    const newSocket = io(socketUrl);
    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [socketUrl]);

  // Xử lý các events
  useEffect(() => {
    if (!socket) return;

    // Lắng nghe transcript realtime từ server (cả user và assistant)
    const handleTranscript = (data: { role: string; content: string }) => {
      if (data.role === 'assistant' && state.isAssistantSpeaking) {
        setState(prev => ({ ...prev, text: data.content }));
      } else if (data.role === 'user' && !state.isAssistantSpeaking) {
        setState(prev => ({ ...prev, text: data.content }));
      }
    };

    const handleAssistantStartSpeaking = () => {
      setState(prev => ({ ...prev, isAssistantSpeaking: true }));
    };

    const handleAssistantEndSpeaking = () => {
      setState(prev => ({ ...prev, isAssistantSpeaking: false }));
    };

    socket.on('transcript', handleTranscript);
    socket.on('assistantStartSpeaking', handleAssistantStartSpeaking);
    socket.on('assistantEndSpeaking', handleAssistantEndSpeaking);

    // Cleanup
    return () => {
      socket.off('transcript', handleTranscript);
      socket.off('assistantStartSpeaking', handleAssistantStartSpeaking);
      socket.off('assistantEndSpeaking', handleAssistantEndSpeaking);
    };
  }, [socket, state.isAssistantSpeaking]);

  return {
    transcript: state.text,
    isAssistantSpeaking: state.isAssistantSpeaking,
  };
}; 