import Vapi from '@vapi-ai/web';

// Initialize with environment variables
const PUBLIC_KEY = import.meta.env.VITE_VAPI_PUBLIC_KEY;
const ASSISTANT_ID = import.meta.env.VITE_VAPI_ASSISTANT_ID;

if (!PUBLIC_KEY) {
  throw new Error('VITE_VAPI_PUBLIC_KEY is not set in environment variables');
}

if (!ASSISTANT_ID) {
  throw new Error('VITE_VAPI_ASSISTANT_ID is not set in environment variables');
}

// Option to force basic summary generation (for testing fallback)
export const FORCE_BASIC_SUMMARY = false; // Set to true to always use basic summary

export let vapiInstance: Vapi | null = null;

export function initVapi() {
  if (!vapiInstance) {
    try {
      // Check environment variables first
      if (!PUBLIC_KEY || !ASSISTANT_ID) {
        console.error('Missing required environment variables:', {
          PUBLIC_KEY: !!PUBLIC_KEY,
          ASSISTANT_ID: !!ASSISTANT_ID
        });
        throw new Error('Missing required VAPI configuration');
      }

      // Initialize VAPI instance
      vapiInstance = new Vapi(PUBLIC_KEY);
      
      if (!vapiInstance) {
        throw new Error('Failed to create VAPI instance');
      }

      // Setup event listeners
      setupVapiEventListeners();
      
      console.log('Vapi initialized successfully with config:', {
        publicKey: PUBLIC_KEY?.substring(0, 8) + '...', // Only log part of the key for security
        assistantId: ASSISTANT_ID
      });

      return vapiInstance;
    } catch (error) {
      console.error('Failed to initialize Vapi:', error);
      vapiInstance = null;
      throw error;
    }
  }
  
  return vapiInstance;
}

// Event handling will be delegated to the AssistantContext
function setupVapiEventListeners() {
  if (!vapiInstance) return;
  
  // Speech start event
  vapiInstance.on('speech-start', () => {
    console.log('Assistant started speaking');
  });
  
  // Speech end event
  vapiInstance.on('speech-end', () => {
    console.log('Assistant stopped speaking');
  });
  
  // Call start event
  vapiInstance.on('call-start', () => {
    console.log('Call has started');
  });
  
  // Call end event
  vapiInstance.on('call-end', () => {
    console.log('Call has ended');
  });
  
  // Volume level event
  vapiInstance.on('volume-level', (volume) => {
    console.log(`Assistant volume level: ${volume}`);
  });
  
  // Message event (function calls and transcripts)
  vapiInstance.on('message', (message) => {
    console.log('Received message:', message);
    
    // Handle end of call report with summary
    if (message.type === 'end_of_call_report' && message.summary) {
      console.log('End of call report received with summary:', message.summary);
      
      // Display the summary in the container if it exists
      const summaryContainer = document.getElementById('summary-container');
      if (summaryContainer) {
        const summaryContent = `
          <div class="p-4 bg-blue-50 rounded-lg shadow-sm">
            <h3 class="font-medium text-lg mb-2 text-blue-800">Call Summary</h3>
            <p class="text-gray-700">${message.summary}</p>
          </div>
        `;
        summaryContainer.innerHTML = summaryContent;
      }
      
      // Send the summary to the server
      fetch('/api/store-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          summary: message.summary,
          timestamp: new Date().toISOString()
        }),
      })
      .then(response => {
        if (!response.ok) {
          throw new Error(`Network response was not ok: ${response.status}`);
        }
        console.log('Summary successfully sent to server');
      })
      .catch(error => {
        console.error('Error sending summary to server:', error);
      });
    }
    
    // Special handling for status updates to detect end of call
    if (message.type === 'status-update' && message.status === 'ended') {
      console.log('Call ended with reason:', message.endedReason);
    }
  });
  
  // Error event
  vapiInstance.on('error', (error) => {
    console.error('Vapi error:', error);
  });
}

// Function to start a call
export async function startCall() {
  if (!vapiInstance) {
    console.error('Vapi not initialized');
    throw new Error('VAPI not initialized. Please check your configuration.');
  }

  try {
    // Check microphone permissions first
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
    } catch (micError) {
      console.error('Microphone access error:', micError);
      if (micError instanceof Error) {
        if (micError.name === 'NotAllowedError') {
          throw new Error('Microphone access is required for VAPI calls');
        }
        if (micError.name === 'NotFoundError') {
          throw new Error('No microphone found on this device');
        }
      }
      throw micError;
    }

    console.log('Starting call with config:', {
      assistantId: ASSISTANT_ID,
      modelOutputInMessagesEnabled: true
    });
    
    const call = await vapiInstance.start(ASSISTANT_ID);

    if (!call) {
      throw new Error('Call object is null after starting');
    }

    console.log('Call started successfully:', {
      callId: call.id,
      status: call.status,
      webCallUrl: call.webCallUrl
    });
    
    return call;
  } catch (error) {
    console.error('Error starting call:', error);
    throw error;
  }
}

// Function to end a call
export async function endCall() {
  if (!vapiInstance) {
    console.error('Vapi not initialized');
    return;
  }

  try {
    await vapiInstance.stop();
    console.log('Call ended successfully');
  } catch (error) {
    console.error('Error ending call:', error);
    throw error;
  }
}

// Function to mute/unmute the microphone
export function setMuted(muted: boolean) {
  if (!vapiInstance) {
    console.error('Vapi not initialized');
    return;
  }

  vapiInstance.setMuted(muted);
}

// Function to check if microphone is muted
export function isMuted(): boolean {
  if (!vapiInstance) {
    console.error('Vapi not initialized');
    return false;
  }

  return vapiInstance.isMuted();
}

// Function to make the assistant say something
export function say(message: string, endCallAfterSpoken: boolean = false) {
  if (!vapiInstance) {
    console.error('Vapi not initialized');
    return;
  }

  vapiInstance.say(message, endCallAfterSpoken);
}

export const buttonConfig = {
  position: "top",
  offset: "240px",
  width: "120px",
  height: "120px",
  idle: {
    color: `rgb(93, 254, 202)`,
    type: "round",
    title: "Have a quick question?",
    subtitle: "Talk with our AI assistant",
    icon: `https://unpkg.com/lucide-static@0.321.0/icons/phone.svg`,
  },
  loading: {
    color: `rgb(93, 124, 202)`,
    type: "round",
    title: "Connecting...",
    subtitle: "Please wait",
    icon: `https://unpkg.com/lucide-static@0.321.0/icons/loader-2.svg`,
  },
  active: {
    color: `rgb(255, 0, 0)`,
    type: "round",
    title: "Call is in progress...",
    subtitle: "End the call.",
    icon: `https://unpkg.com/lucide-static@0.321.0/icons/phone-off.svg`,
  },
};
