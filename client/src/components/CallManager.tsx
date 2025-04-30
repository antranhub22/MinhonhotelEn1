import React, { useState } from 'react';
import { useAssistant } from '@/context/AssistantContext';
import ModelOutput from './ModelOutput';

const CallManager: React.FC = () => {
  const [isCallActive, setIsCallActive] = useState(false);
  const [isMuted, setIsMutedState] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { startCall, endCall, setMuted } = useAssistant();

  const handleStartCall = async () => {
    try {
      setError(null);
      await startCall();
      setIsCallActive(true);
    } catch (err) {
      setError('Failed to start call');
      console.error(err);
    }
  };

  const handleEndCall = async () => {
    try {
      setError(null);
      await endCall();
      setIsCallActive(false);
    } catch (err) {
      setError('Failed to end call');
      console.error(err);
    }
  };

  const handleToggleMute = () => {
    try {
      setMuted(!isMuted);
      setIsMutedState(!isMuted);
    } catch (err) {
      setError('Failed to toggle mute');
      console.error(err);
    }
  };

  return (
    <div className="call-manager">
      {error && <div className="error-message">{error}</div>}
      <div className="call-controls">
        {!isCallActive ? (
          <button onClick={handleStartCall} className="start-call-button">
            Start Call
          </button>
        ) : (
          <>
            <button onClick={handleEndCall} className="end-call-button">
              End Call
            </button>
            <button onClick={handleToggleMute} className="mute-button">
              {isMuted ? 'Unmute' : 'Mute'}
            </button>
          </>
        )}
      </div>
      <ModelOutput />
    </div>
  );
};

export default CallManager; 