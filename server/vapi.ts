import Vapi from '@vapi-ai/web';

if (!process.env.VAPI_API_KEY) {
  throw new Error('VAPI_API_KEY is not set in environment variables');
}

if (!process.env.VAPI_ASSISTANT_ID) {
  throw new Error('VAPI_ASSISTANT_ID is not set in environment variables');
}

export const vapi = new Vapi({
  apiKey: process.env.VAPI_API_KEY,
  assistantId: process.env.VAPI_ASSISTANT_ID,
});

// Function to start a call
export async function startCall(phoneNumber: string) {
  try {
    const call = await vapi.startCall({
      phoneNumber,
      assistantId: process.env.VAPI_ASSISTANT_ID!,
    });
    return call;
  } catch (error) {
    console.error('Error starting call:', error);
    throw error;
  }
}

// Function to end a call
export async function endCall(callId: string) {
  try {
    await vapi.endCall(callId);
  } catch (error) {
    console.error('Error ending call:', error);
    throw error;
  }
}

// Function to get call status
export async function getCallStatus(callId: string) {
  try {
    const status = await vapi.getCallStatus(callId);
    return status;
  } catch (error) {
    console.error('Error getting call status:', error);
    throw error;
  }
}

// Function to get call transcript
export async function getCallTranscript(callId: string) {
  try {
    const transcript = await vapi.getCallTranscript(callId);
    return transcript;
  } catch (error) {
    console.error('Error getting call transcript:', error);
    throw error;
  }
} 