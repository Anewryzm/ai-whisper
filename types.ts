export interface TranscriptionResponse {
  text: string;
  x_groq?: {
    id: string;
  };
}

export interface GroqErrorResponse {
  error: {
    message: string;
    type: string;
  };
}

export enum RecorderState {
  IDLE = 'IDLE',
  RECORDING = 'RECORDING',
  HAS_AUDIO = 'HAS_AUDIO',
  PROCESSING = 'PROCESSING',
}