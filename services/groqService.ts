
import { TranscriptionResponse, GroqErrorResponse } from '../types';

// ==================================================================================
// CONSTANTS
// ==================================================================================

const TRANSCRIPTION_ENDPOINT = "/api/transcribe";
const ACTION_PLAN_ENDPOINT = "/api/action-plan";

export const transcribeAudio = async (groqApiKey: string, audioBlob: Blob): Promise<string> => {
  // Logic moved to /api/transcribe to prevent Key exposure.
  // We still accept groqApiKey to support "Bring Your Own Key" mode from the UI
  
  const formData = new FormData();
  
  // Groq requires a file with a name/extension
  const file = new File([audioBlob], "recording.webm", { type: audioBlob.type || 'audio/webm' });
  
  formData.append("file", file);

  try {
    const headers: Record<string, string> = {};
    if (groqApiKey) {
      headers["x-groq-api-key"] = groqApiKey;
    }

    const response = await fetch(TRANSCRIPTION_ENDPOINT, {
      method: "POST",
      headers: headers,
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json() as GroqErrorResponse;
      throw new Error(errorData.error?.message || `Whisper API Error: ${response.statusText}`);
    }

    const data = await response.json() as TranscriptionResponse;
    return data.text;

  } catch (error) {
    console.error("Groq Transcription Error:", error);
    throw error;
  }
};

export const generateActionPlan = async (keywordsAiApiKey: string, transcriptionText: string): Promise<string> => {
  // Logic moved to /api/action-plan to prevent Key exposure.
  
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json"
    };

    // If user provided a key in the UI, pass it. Otherwise, the server will use its env var.
    if (keywordsAiApiKey) {
      headers["x-keywords-api-key"] = keywordsAiApiKey;
    }

    const response = await fetch(ACTION_PLAN_ENDPOINT, {
      method: "POST",
      headers: headers,
      body: JSON.stringify({ transcriptionText })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || `Chat API Error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || "No se pudo generar el plan de acción.";

  } catch (error) {
    console.error("Keywords AI Chat Error:", error);
    throw error;
  }
};
