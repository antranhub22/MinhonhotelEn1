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
vapi.on('call-start', () => {
  console.log('Call started');
});

vapi.on('call-end', () => {
  console.log('Call ended');
});

vapi.on('speech-start', () => {
  console.log('Assistant started speaking');
});

vapi.on('speech-end', () => {
  console.log('Assistant finished speaking');
});

vapi.on('error', (error) => {
  console.error('VAPI error:', error);
});

// Function to start a call
export async function startCall() {
  try {
    console.log('Starting call with assistant:', process.env.VITE_VAPI_ASSISTANT_ID);
    const call = await vapi.start(process.env.VITE_VAPI_ASSISTANT_ID!);
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

// Function to get call status and model output
export async function getCallStatus(callId: string): Promise<VapiStatus> {
  try {
    const status = await vapi.getCallStatus(callId) as VapiStatus;
    return status;
  } catch (error) {
    console.error('Error getting call status:', error);
    throw error;
  }
}

// Function to get call transcript with model outputs
export async function getCallTranscript(callId: string): Promise<VapiTranscript> {
  try {
    const transcript = await vapi.getCallTranscript(callId) as VapiTranscript;
    return transcript;
  } catch (error) {
    console.error('Error getting call transcript:', error);
    throw error;
  }
}

// Function to get real-time model outputs
export async function getRealtimeModelOutput(callId: string): Promise<string | null> {
  try {
    const status = await vapi.getCallStatus(callId) as VapiStatus;
    const messages = status.messages || [];
    // Get the latest assistant message with model output
    const latestModelOutput = messages
      .filter((msg: VapiMessage) => msg.role === 'assistant' && msg.modelOutput)
      .pop()?.modelOutput;
    return latestModelOutput || null;
  } catch (error) {
    console.error('Error getting realtime model output:', error);
    throw error;
  }
} 