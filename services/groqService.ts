import { TranscriptionResponse, GroqErrorResponse } from '../types';
import { ASSISTANT_SYSTEM_PROMPT } from '../constants/prompts';

// ==================================================================================
// 🔑 API KEY CONFIGURATION
// ==================================================================================
const GROQ_API_KEY = ""; 

// ==================================================================================

const TRANSCRIPTION_ENDPOINT = "https://api.groq.com/openai/v1/audio/transcriptions";
const CHAT_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";

// Usamos llama-3.3-70b-versatile ya que es el modelo de razonamiento más capaz disponible en Groq
// y coincide con el ejemplo curl proporcionado.
const WHISPER_MODEL_ID = "whisper-large-v3-turbo";
const LLM_MODEL_ID = "llama-3.3-70b-versatile";

export const transcribeAudio = async (audioBlob: Blob): Promise<string> => {
  if (!GROQ_API_KEY) {
    throw new Error("API Key is missing. Please add your Groq API Key in services/groqService.ts");
  }

  const formData = new FormData();
  
  // Groq requires a file with a name/extension
  const file = new File([audioBlob], "recording.webm", { type: audioBlob.type || 'audio/webm' });
  
  formData.append("file", file);
  formData.append("model", WHISPER_MODEL_ID);
  formData.append("response_format", "json");

  try {
    const response = await fetch(TRANSCRIPTION_ENDPOINT, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
      },
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

export const generateActionPlan = async (transcriptionText: string): Promise<string> => {
  if (!GROQ_API_KEY) {
    throw new Error("API Key is missing.");
  }

  const payload = {
    model: LLM_MODEL_ID,
    messages: [
      {
        role: "system",
        content: ASSISTANT_SYSTEM_PROMPT
      },
      {
        role: "user",
        content: transcriptionText
      }
    ],
    temperature: 0.5, // Balance entre creatividad y estructura
    max_tokens: 1024
  };

  try {
    const response = await fetch(CHAT_ENDPOINT, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || `Chat API Error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || "No se pudo generar el plan de acción.";

  } catch (error) {
    console.error("Groq Chat Error:", error);
    throw error;
  }
};