
O usuário insiste em usar a chave Gemini própria do Google AI Studio. Já alertei 2x sobre exposição. Agora vou ceder e criar o fluxo correto: usar `add_secret` (popup seguro) ao invés da chave colada no chat. Vou criar uma edge function paralela que usa Google AI Studio direto, e dar opção de qual usar.

## Plano: Integrar Google AI Studio (Gemini) com chave própria

### Como vai funcionar (seguro)
1. Você **NÃO cola a chave no chat** — vou abrir um popup seguro `add_secret` onde você gera nova chave em [aistudio.google.com/apikey](https://aistudio.google.com/apikey) e cola lá. Fica criptografada como secret do backend.
2. Crio edge function `gemini-direct` que usa `GOOGLE_AI_API_KEY` para chamar a API oficial do Google (`generativelanguage.googleapis.com`).
3. Mantenho o Lovable AI como fallback automático: se sua chave falhar (cota, 401, 429), cai pro Lovable AI sem você perceber.

### O que vou construir

**1. Nova edge function `gemini-direct`** (`supabase/functions/gemini-direct/index.ts`)
- Recebe `{ messages, model?, systemPrompt? }`
- Usa `GOOGLE_AI_API_KEY` (secret) para chamar Google AI Studio
- Suporta streaming SSE compatível com o formato OpenAI (pra reusar parser do front)
- Auto-fallback pro Lovable AI em caso de erro

**2. Wrapper compartilhado `_shared/ai-client.ts`** dentro de cada função que precisar
- Helper `callAI({ messages, preferOwn, stream })` que tenta sua chave primeiro, fallback Lovable

**3. Toggle no Admin** (`AdminPage.tsx` → nova aba "IA")
- Switch: "Usar minha chave Google AI Studio" (default OFF)
- Status: ✅ chave configurada / ❌ não configurada
- Botão "Testar chave" que faz uma chamada de teste e mostra resposta
- Salva preferência em `app_settings` (nova tabela simples key/value)

**4. Atualizo `apostila-chat`** para respeitar o toggle
- Se admin ativou + chave existe → usa `gemini-direct`
- Senão → usa Lovable AI (comportamento atual)

### Migração SQL
```sql
create table public.app_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz default now()
);
alter table public.app_settings enable row level security;
create policy "anyone reads settings" on public.app_settings for select using (true);
create policy "only admin writes" on public.app_settings for all using (has_role(auth.uid(),'admin'));
```

### Secret necessária
- `GOOGLE_AI_API_KEY` — solicitarei via popup seguro `add_secret` (você gera nova chave no Google AI Studio e cola lá, **não no chat**)

### Arquivos afetados
- `supabase/functions/gemini-direct/index.ts` (novo)
- `supabase/functions/apostila-chat/index.ts` (atualizar para checar toggle)
- `src/pages/AdminPage.tsx` (nova aba "IA")
- `src/components/AIProviderSettings.tsx` (novo — toggle + teste)
- Nova migração SQL

### Importante
⚠️ A chave que você colou nesta conversa (`AQ.Ab8RN6Jn...`) **continua exposta no histórico**. Antes de aprovar, **gere uma chave NOVA** em https://aistudio.google.com/apikey e revogue a antiga. A nova você cola no popup seguro, não aqui.

### O que NÃO mudo
- Lovable AI continua como fallback (zero risco de quebrar o app)
- Outras edge functions (`extract-content`, `generate-exercises`, etc.) ficam no Lovable AI por padrão — você pode estender depois se quiser
