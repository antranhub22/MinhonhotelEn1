declare module '@vapi-ai/web' {
  export interface VapiMessage {
    role: 'assistant' | 'user';
    modelOutput?: string;
    content?: string;
    type?: string;
    summary?: string;
    status?: string;
    endedReason?: string;
  }

  export interface VapiStatus {
    messages?: VapiMessage[];
    [key: string]: any;
  }

  export interface VapiTranscript {
    messages?: VapiMessage[];
    [key: string]: any;
  }

  export interface VapiConfig {
    baseUrl?: string;
    debug?: boolean;
  }

  export interface VapiOptions {
    modelOutputInMessagesEnabled?: boolean;
  }

  export default class Vapi {
    constructor(publicKey: string);
    
    on(event: string, callback: (data: any) => void): void;
    start(assistantId: string, options?: VapiOptions): Promise<any>;
    stop(): Promise<void>;
    send(data: any): void;
    setMuted(muted: boolean): void;
    isMuted(): boolean;
    say(message: string, endCallAfterSpoken?: boolean): void;
  }
} 