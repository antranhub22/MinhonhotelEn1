import React, { useRef, useEffect, useState } from 'react';
import { useAssistant } from '@/context/AssistantContext';
import courtyardImage from '../assets/courtyard.jpeg';

interface Interface2Props {
  isActive: boolean;
}

const Interface2: React.FC<Interface2Props> = ({ isActive }) => {
  const { 
    transcripts, 
    callDetails,
    callDuration,
    endCall: contextEndCall,
    isMuted,
    toggleMute,
    setCurrentInterface
  } = useAssistant();
  
  // Wrapper for endCall to include local duration if needed
  const endCall = () => {
    // Capture the current duration for the email
    const finalDuration = callDuration > 0 ? callDuration : localDuration;
    console.log('Ending call with duration:', finalDuration);
    
    // Pass the final duration to context's endCall
    contextEndCall();
  };
  
  // Local duration state for backup timer functionality
  const [localDuration, setLocalDuration] = useState(0);
  
  const conversationRef = useRef<HTMLDivElement>(null);
  
  // Format duration for display
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${minutes}:${secs}`;
  };
  
  // Local timer as a backup to ensure we always have a working timer
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    
    // Only start the timer when this interface is active
    if (isActive) {
      console.log('Interface2 is active, starting local timer');
      // Initialize with the current duration from context
      setLocalDuration(callDuration || 0);
      
      // Start the local timer
      timer = setInterval(() => {
        setLocalDuration(prev => {
          const newDuration = prev + 1;
          console.log('Local call duration updated:', newDuration);
          return newDuration;
        });
      }, 1000);
    }
    
    return () => {
      if (timer) {
        console.log('Cleaning up local timer in Interface2');
        clearInterval(timer);
      }
    };
  }, [isActive, callDuration]);
  
  // Scroll to bottom of conversation when new messages arrive
  useEffect(() => {
    if (conversationRef.current && isActive) {
      conversationRef.current.scrollTop = conversationRef.current.scrollHeight;
    }
  }, [transcripts, isActive]);
  
  return (
    <div 
      className={`absolute w-full h-full transition-opacity duration-500 ${
        isActive ? 'opacity-100' : 'opacity-0 pointer-events-none'
      } z-20`} id="interface2"
      style={{
        backgroundImage: `linear-gradient(rgba(26, 35, 126, 0.8), rgba(63, 81, 181, 0.8)), url(${courtyardImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      <div className="container mx-auto h-full flex flex-col p-5">
        <div className="bg-white rounded-lg shadow-md p-5 mb-5 flex-grow overflow-hidden flex flex-col">
          <div className="mb-4 pb-3 border-b border-gray-200 flex justify-between items-center">
            <h2 className="font-poppins font-semibold text-xl text-primary">RealTime Conversation</h2>
            <div className="flex items-center space-x-3">
              <button
                className="text-red-500 hover:text-red-600 text-sm"
                onClick={() => setCurrentInterface('interface1')}
              >
                Cancel
              </button>
              <span id="callStatus" className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500 text-white">
                <span className="dot w-2 h-2 rounded-full bg-white mr-1.5 inline-block"></span>
                Active Call
              </span>
            </div>
          </div>
          
          {/* Realtime Conversation Container */}
          <div 
            id="realTimeConversation" 
            ref={conversationRef}
            className="flex-grow overflow-y-auto mb-4 p-2"
          >
            {transcripts.map((transcript) => (
              <div className="mb-4 last:mb-0" key={transcript.id}>
                <div className="flex items-start mb-1">
                  <div className={`w-8 h-8 rounded-full ${
                    transcript.role === 'assistant' ? 'bg-primary text-white' : 'bg-amber-400 text-primary-dark'
                  } flex items-center justify-center mr-2 flex-shrink-0`}>
                    <span className="material-icons text-sm">
                      {transcript.role === 'assistant' ? 'support_agent' : 'person'}
                    </span>
                  </div>
                  <div className="flex-grow">
                    <p className="text-sm text-gray-500 mb-1">
                      {transcript.role === 'assistant' ? 'Assistant' : 'You'}
                    </p>
                    <p className="text-gray-800">{transcript.content}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Call Controls with Duration */}
          <div className="flex justify-between items-center pt-3 border-t border-gray-200">
            <div className="flex-1 flex justify-start items-center">
              <button 
                id="muteButton" 
                className={`mx-2 w-12 h-12 rounded-full ${isMuted ? 'bg-gray-400' : 'bg-gray-200'} flex items-center justify-center text-gray-700`}
                onClick={toggleMute}
              >
                <span className="material-icons">{isMuted ? 'mic_off' : 'mic'}</span>
              </button>
              <button 
                id="speakerButton" 
                className="mx-2 w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-700"
              >
                <span className="material-icons">volume_up</span>
              </button>
            </div>
            
            <div className="flex-1 flex justify-center">
              <button 
                id="endCallButton" 
                className="mx-2 w-16 h-16 rounded-full bg-red-500 flex items-center justify-center text-white shadow-md"
                onClick={endCall}
              >
                <span className="material-icons">call_end</span>
              </button>
            </div>
            
            {/* Duration directly in controls bar */}
            <div className="flex-1 flex justify-end items-center">
              <div className="px-3 py-2 bg-gray-100 rounded-lg">
                <p className="text-xs font-semibold text-gray-500 text-center mb-0">Duration</p>
                <p className="font-medium text-center text-xl text-primary" id="callDuration">
                  {formatDuration(callDuration > 0 ? callDuration : localDuration)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Interface2;
