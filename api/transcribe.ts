
export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file');

    if (!file) {
      return new Response(JSON.stringify({ error: { message: 'No audio file provided', type: 'invalid_request' } }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // Prioritize key from header (client provided), fallback to server environment
    const apiKey = req.headers.get('x-groq-api-key') || process.env.GROQ_API_KEY;

    if (!apiKey) {
      return new Response(JSON.stringify({ error: { message: 'Groq API Key is missing on server', type: 'server_configuration_error' } }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    const groqFormData = new FormData();
    groqFormData.append('file', file);
    groqFormData.append('model', 'whisper-large-v3-turbo');
    groqFormData.append('response_format', 'json');

    const groqResponse = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
      },
      body: groqFormData,
    });

    if (!groqResponse.ok) {
      const errorData = await groqResponse.json();
      return new Response(JSON.stringify(errorData), { status: groqResponse.status, headers: { 'Content-Type': 'application/json' } });
    }

    const data = await groqResponse.json();
    return new Response(JSON.stringify(data), { 
      status: 200, 
      headers: { 'Content-Type': 'application/json' } 
    });

  } catch (error: any) {
    console.error('API Route Error:', error);
    return new Response(JSON.stringify({ error: { message: error.message || 'Internal Server Error', type: 'internal_error' } }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
