import React, { useState } from 'react';
import { startCall, endCall, setMuted } from '../../server/vapi';
import ModelOutput from './ModelOutput';

const CallManager: React.FC = () => {
  const [isCallActive, setIsCallActive] = useState(false);
  const [isMuted, setIsMutedState] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex flex-col space-y-4">
        <div className="flex space-x-4">
          {!isCallActive ? (
            <button
              onClick={handleStartCall}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            >
              Start Call
            </button>
          ) : (
            <>
              <button
                onClick={handleEndCall}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
              >
                End Call
              </button>
              <button
                onClick={handleToggleMute}
                className={`${
                  isMuted ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-blue-500 hover:bg-blue-600'
                } text-white px-4 py-2 rounded`}
              >
                {isMuted ? 'Unmute' : 'Mute'}
              </button>
            </>
          )}
        </div>
        {error && (
          <div className="text-red-500 mt-2">{error}</div>
        )}
        <div className="text-gray-600">
          Status: {isCallActive ? 'Call in progress' : 'Ready to start'}
        </div>
        {isCallActive && <ModelOutput />}
      </div>
    </div>
  );
};

export default CallManager; 