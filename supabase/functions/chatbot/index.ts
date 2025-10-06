import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');

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
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        {
          status: 401,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

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

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: creditResult, error: creditError } = await supabaseAdmin.rpc(
      'consume_credit',
      { p_user_id: user.id }
    );

    if (creditError) {
      return new Response(
        JSON.stringify({ error: 'Error checking credits' }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    if (!creditResult.success) {
      return new Response(
        JSON.stringify({ 
          error: creditResult.message,
          credits: creditResult.credits 
        }),
        {
          status: 429,
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

    if (!GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({
          response: 'Gracias por tu pregunta. En este momento el servicio de IA no está configurado. Te recomendaría explorar nuestro foro donde la comunidad comparte excelentes recomendaciones sobre cómics, manga y arte. ¡También puedes publicar tu pregunta allí!',
          credits: creditResult.credits
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

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: systemPrompt },
                { text: message }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 500,
          },
        }),
      }
    );

    if (!geminiResponse.ok) {
      throw new Error('Error calling Gemini API');
    }

    const data = await geminiResponse.json();
    const botResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Lo siento, no pude generar una respuesta.';

    return new Response(
      JSON.stringify({ 
        response: botResponse,
        credits: creditResult.credits 
      }),
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