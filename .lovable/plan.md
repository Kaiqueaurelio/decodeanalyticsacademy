

## Objetivo
Fazer o **Tira-dúvida com foto** e a **indexação de apostilas (embeddings)** respeitarem o toggle "Usar minha chave Google AI Studio" do Admin, exatamente como o `gemini-direct` já faz no chat.

## Como funciona hoje (problema)
- `tira-duvida-foto` → chama `https://ai.gateway.lovable.dev/...` direto com `LOVABLE_API_KEY`
- `embed-apostilas` → mesma coisa
- Resultado: quando o Lovable AI fica sem crédito (402), a feature quebra mesmo com sua chave Google válida configurada.

## Solução
Replicar o padrão do `gemini-direct`:

1. **Ler o setting `ai_provider`** da tabela `app_settings` no início de cada função.
2. **Se `preferGoogle = true`** e `GOOGLE_AI_API_KEY` existir → chamar a API direta do Google:
   - **Vision (Tira-dúvida):** `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent` com `inlineData` (base64) + function calling nativo do Gemini.
   - **Embeddings:** `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent`.
3. **Senão (ou se Google falhar)** → fallback para Lovable AI Gateway (comportamento atual).
4. **Adicionar header `X-AI-Provider`** (`google-direct` | `lovable-ai`) na resposta, igual ao `gemini-direct`, pra debug.

## Arquivos a editar
- `supabase/functions/tira-duvida-foto/index.ts` — vision + embeddings com dual provider
- `supabase/functions/embed-apostilas/index.ts` — embeddings com dual provider

## Diagrama do fluxo
```text
Request → check app_settings.ai_provider
            ├─ preferGoogle=true + GOOGLE_AI_API_KEY?
            │     └─ tenta Google Direct API
            │          ├─ sucesso → retorna (X-AI-Provider: google-direct)
            │          └─ falha   → fallback Lovable AI
            └─ preferGoogle=false → Lovable AI direto
```

## Detalhes técnicos relevantes
- Gemini Vision aceita imagem via `contents[].parts[].inlineData = { mimeType, data }` (base64 sem o prefixo `data:image/...;base64,`).
- Function calling no Gemini direto usa `tools: [{ functionDeclarations: [...] }]` + `toolConfig: { functionCallingConfig: { mode: "ANY", allowedFunctionNames: [...] } }`.
- Resposta vem em `candidates[0].content.parts[].functionCall.args` (já é objeto, não precisa `JSON.parse`).
- Embeddings do Google retornam `embedding.values` (array de 768 floats), enquanto Lovable AI retorna `data[0].embedding`. Normalizar ambos.
- Manter o limite diário de 10/dia e o erro 402 amigável (caso ambos provedores falhem).

## Não muda
- UI do `TiraDuvidaDialog` e `TiraDuvidaPage` (a resposta JSON tem o mesmo formato).
- Tabela `tira_duvidas`, RLS, storage bucket.
- Limite diário de 10 dúvidas/aluno.

## Resultado esperado
Com o toggle ligado no Admin → Tira-dúvida e indexação rodam **na sua chave Google**, sem consumir créditos do Lovable AI. Se você desligar, volta ao Lovable AI automaticamente.

