import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

interface ChatRequest {
  message: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { message }: ChatRequest = await req.json();

    if (!message) {
      return new Response(
        JSON.stringify({ error: 'Message is required' }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const systemPrompt = `Eres un asistente virtual experto en cómics, manga y arte. Tu trabajo es ayudar a los usuarios con información relevante sobre estos temas.

Responde de manera amigable, concisa y útil. Si no tienes información específica, sugiere alternativas o recursos donde pueden encontrar más información.

Algunos temas que puedes abordar:
- Recomendaciones de cómics, manga o arte
- Información sobre lanzamientos recientes o próximos
- Historia y contexto de series populares
- Estilos artísticos y técnicas
- Comparaciones entre obras similares

Mantén tus respuestas en español y con un tono cercano y entusiasta.`;

    if (!OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({
          response: 'Gracias por tu pregunta. En este momento el servicio de IA no está configurado. Te recomendaría explorar nuestro foro donde la comunidad comparte excelentes recomendaciones sobre cómics, manga y arte. ¡También puedes publicar tu pregunta allí!'
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message },
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!openAIResponse.ok) {
      throw new Error('Error calling OpenAI API');
    }

    const data = await openAIResponse.json();
    const botResponse = data.choices[0]?.message?.content || 'Lo siento, no pude generar una respuesta.';

    return new Response(
      JSON.stringify({ response: botResponse }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error in chatbot function:', error);
    return new Response(
      JSON.stringify({
        response: 'Lo siento, ocurrió un error al procesar tu mensaje. Por favor, intenta de nuevo más tarde.'
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
