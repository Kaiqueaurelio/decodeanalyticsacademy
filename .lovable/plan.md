
O usuário está confuso/frustrado: "se eu ativei minha chave Google AI Studio (externa), por que ainda dá erro 402 de créditos do Lovable AI?"

Resposta curta: porque o toggle no Admin **nunca foi ativado** OU a chave Google está falhando silenciosamente e caindo no fallback Lovable (que está sem créditos).

Preciso investigar: a função `apostila-chat` lê o setting `ai_provider.preferGoogle`. Se for false, vai direto pro Lovable (402). Se for true e Google falhar, também cai no Lovable.

## Diagnóstico

Pela leitura do `apostila-chat/index.ts`:
- Linha que importa: `const preferGoogle = !!(settingRow?.value as any)?.preferGoogle && !!GOOGLE_AI_API_KEY;`
- Se `preferGoogle = false` → vai DIRETO pro Lovable AI → 402
- Se `preferGoogle = true` mas Google falhar → cai no Lovable AI → 402

**Causa mais provável**: o toggle no Admin → IA não foi ativado, então o app continua usando Lovable AI (sem créditos).

Causa secundária: mesmo ativando, se o Google retornar erro (chave inválida, cota, modelo errado), o código atual faz fallback automático pro Lovable → 402.

## Plano de correção

### 1. Forçar uso da chave Google quando ativada (sem fallback silencioso pra Lovable sem créditos)
Em `apostila-chat/index.ts`: se `preferGoogle=true` e Google falhar, retornar erro claro do Google em vez de cair no Lovable. Só usar Lovable como fallback se ele tiver créditos.

### 2. Mostrar status real no Admin
No `AIProviderSettings.tsx`: badge claro indicando "ATIVO: respostas vêm da sua chave" vs "INATIVO: usando Lovable AI (pode falhar por créditos)".

### 3. Aviso no chat quando cair no Lovable
No `ApostilaChat.tsx`: se a resposta veio do Lovable AI mas o admin esperava Google, mostrar toast informando.

### 4. Resposta direta ao usuário no chat (esta mensagem)
Explicar que o toggle precisa estar ATIVO no Admin → IA, e que provavelmente está OFF.

## Arquivos a alterar
- `supabase/functions/apostila-chat/index.ts` — quando `preferGoogle=true`, não cair no Lovable se Google falhar; retornar erro do Google
- `src/components/AIProviderSettings.tsx` — banner de status mais claro + aviso quando OFF
- `src/components/ApostilaChat.tsx` — exibir provedor usado no rodapé da mensagem

## Ação imediata para o usuário
1. Vá em **Admin → aba IA**
2. Verifique se o switch **"Usar minha chave Google AI Studio"** está LIGADO (verde)
3. Clique em **"Testar chamada de IA"** — o badge deve mostrar `google-direct`
4. Se mostrar `lovable`, o toggle está OFF — ligue ele
5. Se já está ON e ainda dá 402, sua chave Google pode estar inválida/sem cota — gere uma nova em https://aistudio.google.com/apikey e adicione novamente
