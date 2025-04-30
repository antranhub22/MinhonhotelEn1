declare module '@vapi-ai/web' {
  interface StartOptions {
    assistantId?: string;
    model?: {
      provider: string;
      model: string;
      messages: Array<{
        role: string;
        content: string;
      }>;
    };
  }

  interface VapiMessage {
    type: 'end_of_call_report' | 'status-update' | string;
    status?: 'ended' | string;
    endedReason?: string;
    summary?: string;
  }

  interface ButtonState {
    color: string;
    type: 'round';
    title: string;
    subtitle: string;
    icon: string;
  }

  interface ButtonConfig {
    position: 'top' | 'bottom';
    offset: string;
    width: string;
    height: string;
    idle: ButtonState;
    loading: ButtonState;
    active: ButtonState;
  }

  type VapiEventMap = {
    'speech-start': () => void;
    'speech-end': () => void;
    'call-start': () => void;
    'call-end': () => void;
    'volume-level': (volume: number) => void;
    'message': (message: VapiMessage) => void;
    'error': (error: Error) => void;
  }

  export default class Vapi {
    constructor(publicKey: string);
    start(options: StartOptions): Promise<any>;
    on<K extends keyof VapiEventMap>(event: K, callback: VapiEventMap[K]): void;
    stop(): void;
    isMuted(): boolean;
    setMuted(muted: boolean): void;
    say(message: string, endCallAfterSpoken?: boolean): void;
  }

  export { VapiMessage, ButtonConfig, ButtonState };
} 