import Vapi, { VapiMessage } from '@vapi-ai/web';
import type { ButtonConfig } from '@vapi-ai/web';

// Initialize with environment variables
const PUBLIC_KEY = import.meta.env.VITE_VAPI_PUBLIC_KEY;
const ASSISTANT_ID = import.meta.env.VITE_VAPI_ASSISTANT_ID;

// Debug log
console.log('Environment variables:');
console.log('VITE_VAPI_PUBLIC_KEY:', import.meta.env.VITE_VAPI_PUBLIC_KEY);
console.log('VITE_VAPI_ASSISTANT_ID:', import.meta.env.VITE_VAPI_ASSISTANT_ID);

if (!PUBLIC_KEY) {
  console.error('VITE_VAPI_PUBLIC_KEY is not set in environment variables');
}

if (!ASSISTANT_ID) {
  console.error('VITE_VAPI_ASSISTANT_ID is not set in environment variables');
}

// Option to force basic summary generation (for testing fallback)
export const FORCE_BASIC_SUMMARY = false; // Set to true to always use basic summary

export let vapiInstance: Vapi | null = null;

export const initVapi = () => {
  if (!PUBLIC_KEY) {
    console.error('Cannot initialize Vapi: PUBLIC_KEY is not set');
    throw new Error('Cannot initialize Vapi: PUBLIC_KEY is not set');
  }

  try {
    console.log('Initializing Vapi with PUBLIC_KEY:', PUBLIC_KEY);
    console.log('ASSISTANT_ID:', ASSISTANT_ID);
    
    vapiInstance = new Vapi(PUBLIC_KEY);
    console.log('Vapi instance created successfully');

    vapiInstance.on('speech-start', () => {
      console.log('Speech has started');
    });

    setupVapiEventListeners();
    return vapiInstance;
  } catch (error) {
    console.error('Failed to initialize Vapi:', error);
    throw error;
  }
};

// Event handling will be delegated to the AssistantContext
function setupVapiEventListeners() {
  if (!vapiInstance) {
    console.error('Cannot setup event listeners: vapiInstance is null');
    return;
  }
  
  console.log('Setting up Vapi event listeners');
  
  // Speech start event
  vapiInstance.on('speech-start', () => {
    console.log('Speech has started');
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
  vapiInstance.on('volume-level', (volume: number) => {
    console.log(`Assistant volume level: ${volume}`);
  });
  
  // Message event (function calls and transcripts)
  vapiInstance.on('message', (message: VapiMessage) => {
    console.log('Message received in AssistantContext:', message);
    console.log(`Message type: ${message.type}`);
    console.log(`Transcript type: ${message.transcriptType}`);
    console.log(`Message role: ${message.role}`);
    console.log(`Message content: ${message.transcript || message.content}`);
    
    if (message.type === 'end_of_call_report') {
      const endOfCallReport = message as VapiMessage;
      if (endOfCallReport.summary) {
        console.log('End of call report received with summary:', endOfCallReport.summary);
        
        // Display the summary in the container if it exists
        const summaryContainer = document.getElementById('summary-container');
        if (summaryContainer) {
          const summaryContent = `
            <div class="p-4 bg-blue-50 rounded-lg shadow-sm">
              <h3 class="font-medium text-lg mb-2 text-blue-800">Call Summary</h3>
              <p class="text-gray-700">${endOfCallReport.summary}</p>
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
            summary: endOfCallReport.summary,
            timestamp: new Date().toISOString()
          }),
        })
        .then(response => {
          if (!response.ok) {
            throw new Error(`Network response was not ok: ${response.status}`);
          }
          console.log('Summary successfully sent to server');
        })
        .catch((error: Error) => {
          console.error('Error sending summary to server:', error);
        });
      }
    }
    
    if (message.type === 'status-update') {
      const statusUpdate = message as VapiMessage;
      if (statusUpdate.status === 'ended') {
        console.log('Call ended with reason:', statusUpdate.endedReason);
      }
    }

    if (message.type === 'transcript' && message.transcriptType === 'final') {
      const newTranscript: Transcript = {
        id: Date.now() as unknown as number,
        callId: callDetails?.id || `call-${Date.now()}`,
        role: message.role,
        content: message.transcript,
        timestamp: new Date()
      };
      setTranscripts(prev => [...prev, newTranscript]);
    }
  });
  
  // Error event
  vapiInstance.on('error', (error: Error) => {
    console.error('Vapi error:', error);
  });
}

export const buttonConfig: ButtonConfig = {
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

export const startCall = async () => {
  try {
    if (!PUBLIC_KEY) {
      throw new Error('Cannot start call: PUBLIC_KEY is not set');
    }

    if (!ASSISTANT_ID) {
      throw new Error('Cannot start call: ASSISTANT_ID is not set');
    }

    if (!vapiInstance) {
      initVapi();
    }
    
    if (!vapiInstance) {
      throw new Error('Failed to initialize Vapi client');
    }

    // Log giá trị thực tế để debug
    console.log('DEBUG VAPI PUBLIC_KEY:', PUBLIC_KEY);
    console.log('DEBUG VAPI ASSISTANT_ID:', ASSISTANT_ID);

    await vapiInstance.start(ASSISTANT_ID);

    return vapiInstance;
  } catch (error: unknown) {
    console.error('Failed to start call:', error);
    throw error;
  }
};

export const handleVolumeChange = (volume: number) => {
  console.log('Volume changed:', volume);
};

export const handleMessage = (message: VapiMessage) => {
  console.log('Message received:', message);
  
  if (message.type === 'end_of_call_report') {
    const endOfCallReport = message as VapiMessage;
    if (endOfCallReport.summary) {
      console.log('End of call report received with summary:', endOfCallReport.summary);
    }
  }
  
  if (message.type === 'status-update') {
    const statusUpdate = message as VapiMessage;
    if (statusUpdate.status === 'ended') {
      console.log('Call ended with reason:', statusUpdate.endedReason);
    }
  }
};

// Lấy tất cả checkpoint đã lưu
const checkpoints = JSON.parse(localStorage.getItem('checkpoints') || '[]');
console.log('Tất cả checkpoints:', checkpoints);

// Lọc các checkpoint theo ngày 29/04/2024
const filtered = checkpoints.filter(cp => {
  const d = new Date(cp.timestamp);
  return d.getFullYear() === 2024 && d.getMonth() === 3 && d.getDate() === 29; // getMonth() = 3 là tháng 4
});
console.log('Checkpoints ngày 29/04/2024:', filtered);
