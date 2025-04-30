declare module '@vapi-ai/web' {
  export interface VapiMessage {
    role: 'assistant' | 'user';
    modelOutput?: string;
    content?: string;
  }

  export interface VapiStatus {
    messages?: VapiMessage[];
    [key: string]: any;
  }

  export interface VapiTranscript {
    messages?: VapiMessage[];
    [key: string]: any;
  }

  export interface AssistantOverrides {
    modelOutputInMessagesEnabled?: boolean;
    variableValues?: Record<string, any>;
  }

  export default class Vapi {
    constructor(publicKey: string);
    
    on(event: string, callback: (data: any) => void): void;
    start(assistantId: string, overrides?: AssistantOverrides): Promise<any>;
    stop(): Promise<void>;
    send(data: any): void;
    setMuted(muted: boolean): void;
    isMuted(): boolean;
    say(message: string, endCallAfterSpoken?: boolean): void;
    getCallStatus(): Promise<VapiStatus>;
    getCallTranscript(): Promise<VapiTranscript>;
  }
} 