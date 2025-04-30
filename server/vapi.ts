import VapiClient from '@vapi-ai/web';

interface VapiMessage {
  role: 'assistant' | 'user';
  modelOutput?: string;
  content?: string;
}

interface VapiStatus {
  messages?: VapiMessage[];
  [key: string]: any;
}

interface VapiTranscript {
  messages?: VapiMessage[];
  [key: string]: any;
}

if (!process.env.VITE_VAPI_PUBLIC_KEY) {
  throw new Error('VITE_VAPI_PUBLIC_KEY is not set in environment variables');
}

if (!process.env.VITE_VAPI_ASSISTANT_ID) {
  throw new Error('VITE_VAPI_ASSISTANT_ID is not set in environment variables');
}

export const vapi = new VapiClient(process.env.VITE_VAPI_PUBLIC_KEY);

// Set up event listeners
vapi.on('speech-start', () => {
  console.log('Assistant started speaking');
});

vapi.on('speech-end', () => {
  console.log('Assistant finished speaking');
});

vapi.on('call-start', () => {
  console.log('Call started');
});

vapi.on('call-end', () => {
  console.log('Call ended');
});

vapi.on('volume-level', (volume) => {
  console.log(`Assistant volume level: ${volume}`);
});

vapi.on('message', (message) => {
  console.log('Received message:', message);
  if (message?.role === 'assistant' && message?.modelOutput) {
    console.log('Model output:', message.modelOutput);
  }
});

vapi.on('error', (error) => {
  console.error('VAPI error:', error);
});

// Function to start a call
export async function startCall() {
  try {
    console.log('Starting call with assistant:', process.env.VITE_VAPI_ASSISTANT_ID);
    const call = await vapi.start(process.env.VITE_VAPI_ASSISTANT_ID!, {
      modelOutputInMessagesEnabled: true,
      variableValues: {}
    });
    console.log('Call started successfully:', call);
    return call;
  } catch (error) {
    console.error('Error starting call:', error);
    throw error;
  }
}

// Function to end a call
export async function endCall() {
  try {
    console.log('Ending call');
    await vapi.stop();
    console.log('Call ended successfully');
  } catch (error) {
    console.error('Error ending call:', error);
    throw error;
  }
}

// Function to send a message during the call
export async function sendMessage(content: string, role: 'system' | 'user' = 'user') {
  try {
    console.log('Sending message:', { content, role });
    vapi.send({
      type: 'add-message',
      message: {
        role,
        content
      }
    });
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
}

// Function to handle model output from messages
export function setupModelOutputListener(callback: (modelOutput: string) => void) {
  vapi.on('message', (message) => {
    console.log('Received message:', message);
    if (message?.role === 'assistant' && message?.modelOutput) {
      console.log('Model output:', message.modelOutput);
      callback(message.modelOutput);
    }
  });
}

// Function to mute/unmute the microphone
export function setMuted(muted: boolean) {
  console.log('Setting mute state:', muted);
  vapi.setMuted(muted);
}

// Function to check if microphone is muted
export function isMuted(): boolean {
  return vapi.isMuted();
}

// Function to make the assistant say something
export function say(message: string, endCallAfterSpoken: boolean = false) {
  console.log('Making assistant say:', message);
  vapi.say(message, endCallAfterSpoken);
}

// Function to get call status
export async function getCallStatus(): Promise<VapiStatus> {
  try {
    const status = await vapi.getCallStatus();
    return status as VapiStatus;
  } catch (error) {
    console.error('Error getting call status:', error);
    throw error;
  }
}

// Function to get call transcript
export async function getCallTranscript(): Promise<VapiTranscript> {
  try {
    const transcript = await vapi.getCallTranscript();
    return transcript as VapiTranscript;
  } catch (error) {
    console.error('Error getting call transcript:', error);
    throw error;
  }
}

// Function to get real-time model outputs from messages
export function getRealtimeModelOutput(callback: (modelOutput: string) => void) {
  vapi.on('message', (message) => {
    if (message?.role === 'assistant' && message?.modelOutput) {
      callback(message.modelOutput);
    }
  });
} 