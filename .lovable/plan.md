

User reports the Google Gemini API key isn't being used — Lovable AI is being used instead. Let me investigate.
<lov-tool-use id="toolu_vrtx_01KtSWFEwG7dV4CRRtsoQC2F" name="code--exec" integration-id="code" data="{\"command\": \"psql -c \\\"SELECT key, value FROM app_settings WHERE key='ai_provider';\\\"\", \"user_facing_description\": \"Verificando configuração do provedor de IA no banco\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_01RAvSaiNnLM3UCpd6xmBdcz" name="code--view" integration-id="code" data="{\"file_path\": \"supabase/functions/gemini-direct/index.ts\", \"lines\": \"1-80\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_01DQ5MV8orWgRh6BXxdDT4Uc" name="code--exec" integration-id="code" data="{\"command\": \"psql -c \\\"SELECT key, value FROM app_settings WHERE key='ai_provider';\\\"\", \"user_facing_description\": \"Verificando configuração do provedor de IA no banco\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_01GX2UL3JtcZm9BixXdDHRaM" name="code--view" integration-id="code" data="{\"file_path\": \"supabase/functions/gemini-direct/index.ts\", \"lines\": \"1-100\"}">
</lov-tool-use>
Configuração no banco está correta: `preferGoogle: true`. Vamos verificar quais funções AI ainda estão chamando Lovable AI direto sem respeitar esse toggle.
<lov-tool-use id="toolu_vrtx_01TW2CT579ZNYTSopq76kQRH" name="code--search_files" integration-id="code" data="{\"query\": \"ai.gateway.lovable.dev\", \"search_dir\": \"supabase/functions\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_01Do4ZN3GbddhQoXqxCPFc2y" name="code--search_files" integration-id="code" data="{\"query\": \"LOVABLE_API_KEY\", \"search_dir\": \"supabase/functions\"}">
</lov-tool-use>
Confirmado. Tenho todo o panorama necessário.

<lov-plan>

## Diagnóstico

Você tem `preferGoogle: true` salvo no banco e `GOOGLE_AI_API_KEY` configurada. Mas só **3 funções** respeitam o toggle hoje:
- ✅ `gemini-direct` (chat da apostila — streaming)
- ✅ `tira-duvida-foto`
- ✅ `embed-apostilas`

Todas as outras **7 funções** ignoram o toggle e batem direto no Lovable AI Gateway, gastando crédito Lovable mesmo com sua chave Google ativa:

| Função | O que faz |
|---|---|
| `apostila-chat` | Chat dentro da apostila (não-streaming/fallback) |
| `apostila-summary` | Resumo + mapa mental |
| `generate-exercises` | Gerar exercícios via IA |
| `extract-content` | Extrair apostila de URL/texto |
| `extract-announcement` | Extrair info de comunicados |
| `extract-calendar-events` | Extrair eventos do calendário |
| `pre-exam-review` | Revisão pré-prova (resumo IA) |

Por isso, sempre que você usa qualquer dessas features, ainda vai pro Lovable AI e estoura o 402 quando o crédito acaba.

## Solução

Aplicar o **mesmo padrão dual provider** já implementado em `tira-duvida-foto`/`embed-apostilas`/`gemini-direct` em todas as 7 funções restantes:

1. **Helper compartilhado** — criar `supabase/functions/_shared/ai-provider.ts` com:
   - `getProviderPreference(admin)` → lê `app_settings.ai_provider` e retorna `preferGoogle`
   - `callGemini(apiKey, model, messages, opts)` → chamada Google direta (texto + JSON mode)
   - `callLovable(apiKey, model, messages, opts)` → chamada Lovable (atual)
   - `callAI(...)` → tenta Google se `preferGoogle`, faz fallback automático pra Lovable em erro/credito esgotado, retorna `{ result, providerUsed }`
   - Suporta `response_format: json_object` (Google: `generationConfig.responseMimeType: "application/json"`).

2. **Refatorar cada função** para usar `callAI()`:
   - `apostila-chat` (não-streaming branch)
   - `apostila-summary`
   - `generate-exercises` (com tool/function calling: Google usa `tools.functionDeclarations`)
   - `extract-content`
   - `extract-announcement`
   - `extract-calendar-events`
   - `pre-exam-review`

3. **Header `X-AI-Provider`** em todas as respostas pra você confirmar via DevTools qual provedor atendeu.

4. **Modelos equivalentes**:
   - Lovable `google/gemini-2.5-flash` → Google `gemini-2.5-flash`
   - Lovable `google/gemini-2.5-pro` → Google `gemini-2.5-pro`

## Diagrama
```text
Qualquer edge function de IA
        ↓
   callAI(messages)
        ↓
preferGoogle && GOOGLE_AI_API_KEY?
   ├─ sim → Google Direct → ok? retorna (X-AI-Provider: google-direct)
   │                       └─ falha → fallback Lovable
   └─ não → Lovable AI direto (X-AI-Provider: lovable-ai)
```

## Não muda
- UI de nenhuma página/componente.
- Formato de resposta JSON de nenhuma função.
- RLS, tabelas, storage, limites diários.
- Funções sem IA (`firecrawl-scrape`, `gemini-direct` já tá ok).

## Resultado esperado
Com toggle ligado: **100% das chamadas de IA do app** vão pra sua chave Google. Lovable AI vira só fallback automático se sua chave falhar. No DevTools → Network, todas as functions vão mostrar `X-AI-Provider: google-direct`.

