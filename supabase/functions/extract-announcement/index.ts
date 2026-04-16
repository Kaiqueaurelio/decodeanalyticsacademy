const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { markdown, metadata, url } = await req.json();

    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'AI key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const truncatedContent = (markdown || '').slice(0, 4000);

    const prompt = `Analise o conteúdo a seguir extraído de uma página web e extraia as informações para criar um aviso/anúncio acadêmico.

URL: ${url}
Título da página: ${metadata?.title || 'N/A'}
Descrição: ${metadata?.description || 'N/A'}

Conteúdo:
${truncatedContent}

Retorne APENAS um JSON válido (sem markdown, sem backticks) com os campos:
{
  "title": "título conciso do curso/vaga/evento (máx 80 chars)",
  "content": "descrição resumida e atrativa em português (150-300 chars)",
  "category": "uma das opções: cursos, empregos, eventos, provas, geral",
  "image_url": "URL da imagem principal se encontrada no conteúdo, ou null"
}`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'Você é um assistente que extrai informações de páginas web para criar anúncios acadêmicos. Responda APENAS com JSON válido.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      console.error('AI API error:', response.status);
      return new Response(
        JSON.stringify({ error: 'AI extraction failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiData = await response.json();
    const rawContent = aiData.choices?.[0]?.message?.content || '';
    
    // Clean potential markdown wrapping
    const cleaned = rawContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    const parsed = JSON.parse(cleaned);

    return new Response(
      JSON.stringify(parsed),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Extract announcement error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to extract announcement data' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
