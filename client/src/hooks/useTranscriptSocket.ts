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

  useEffect(() => {
    if (!socket) return;

    // Chỉ realtime transcript cho user
    const handleTranscript = (data: { role: string; content: string }) => {
      if (data.role === 'user' && !state.isAssistantSpeaking) {
        setState(prev => ({ ...prev, text: data.content }));
      }
    };

    // Khi assistant nói, chỉ hiển thị text trả về từ API
    const handleAssistantResponse = (data: { assistant_reply_text: string }) => {
      if (state.isAssistantSpeaking) {
        setState(prev => ({ ...prev, text: data.assistant_reply_text }));
      }
    };

    const handleAssistantStartSpeaking = () => {
      setState(prev => ({ ...prev, isAssistantSpeaking: true }));
    };

    const handleAssistantEndSpeaking = () => {
      setState(prev => ({ ...prev, isAssistantSpeaking: false }));
    };

    socket.on('transcript', handleTranscript);
    socket.on('assistantResponse', handleAssistantResponse);
    socket.on('assistantStartSpeaking', handleAssistantStartSpeaking);
    socket.on('assistantEndSpeaking', handleAssistantEndSpeaking);

    return () => {
      socket.off('transcript', handleTranscript);
      socket.off('assistantResponse', handleAssistantResponse);
      socket.off('assistantStartSpeaking', handleAssistantStartSpeaking);
      socket.off('assistantEndSpeaking', handleAssistantEndSpeaking);
    };
  }, [socket, state.isAssistantSpeaking]);

  return {
    transcript: state.text,
    isAssistantSpeaking: state.isAssistantSpeaking,
  };
}; 