
import { ASSISTANT_SYSTEM_PROMPT } from '../constants/prompts';

export const config = {
  runtime: 'edge',
};

// Fallback del prompt si la importación falla o para asegurar consistencia en el entorno Edge
const SYSTEM_PROMPT = `
Eres un asistente experto en gestión de proyectos técnicos, desarrollo de software y negocios. Tu objetivo es procesar transcripciones de audio, corregir errores terminológicos basados en el contexto y generar una lista de tareas estructurada.

INSTRUCCIONES DE CONTEXTO Y CORRECCIÓN:
1. El texto de entrada proviene de una transcripción de audio automática (Whisper). Puede contener errores fonéticos o muletillas.
2. Analiza el contexto global. Si el usuario habla de un proyecto de Blockchain, asume que palabras ambiguas son términos técnicos (ej: "nodos", "merkle tree", "smart contracts", "gas fees", "ethereum", "web3").
3. Corrige silenciosamente cualquier error tipográfico en la terminología técnica antes de generar la lista.

ESTRUCTURA OBLIGATORIA DEL OUTPUT:
Debes responder ÚNICAMENTE con el siguiente formato, sin saludos iniciales ni textos adicionales fuera de esta estructura:

He dividido tu proyecto en [XX] tareas
esta es tu lista:
- [Tarea 1: Acción concreta y breve]
- [Tarea 2: Acción concreta y breve]
- [Tarea 3: Acción concreta y breve]
...

Recomendación:
[Un párrafo breve (máximo 2 líneas) con una sugerencia estratégica o técnica clave para el proyecto mencionado]

REGLAS DE FORMATO:
- No uses markdown negrita (**texto**) en los títulos, mantén el texto plano y limpio.
- Usa guiones (-) para la lista.
- Mantén un tono profesional, directo y ejecutivo.
`;

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    const { transcriptionText } = await req.json();

    if (!transcriptionText) {
      return new Response(JSON.stringify({ error: { message: "Transcription text is required" } }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // Prioritize key from header (client provided), fallback to server environment
    // Note: Variable name is KEYWORDS_API_KEY (without VITE_ prefix)
    const apiKey = req.headers.get('x-keywords-api-key') || process.env.KEYWORDS_API_KEY;

    if (!apiKey) {
      return new Response(JSON.stringify({ error: { message: 'Keywords AI API Key is missing on server configuration', type: 'server_configuration_error' } }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    const payload = {
      model: "groq/llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT // Using local constant to ensure availability in Edge
        },
        {
          role: "user",
          content: transcriptionText
        }
      ],
      temperature: 0.5,
      max_tokens: 1024
    };

    const response = await fetch("https://api.keywordsai.co/api/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json();
      return new Response(JSON.stringify(errorData), { status: response.status, headers: { 'Content-Type': 'application/json' } });
    }

    const data = await response.json();
    return new Response(JSON.stringify(data), { 
      status: 200, 
      headers: { 'Content-Type': 'application/json' } 
    });

  } catch (error: any) {
    console.error('API Action Plan Error:', error);
    return new Response(JSON.stringify({ error: { message: error.message || 'Internal Server Error' } }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
