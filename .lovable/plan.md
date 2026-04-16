
O usuário quer uma voz mais humana. A Web Speech API nativa do iOS tem vozes robóticas. A solução é usar **ElevenLabs TTS** via edge function (chave server-side).

## Plano

### 1. Edge function `elevenlabs-tts`
- Recebe `{ text, voiceId? }`
- Chama ElevenLabs API com `eleven_multilingual_v2` (PT-BR de qualidade)
- Voz padrão: **Sarah (EXAVITQu4vr4xnSDxMaL)** — feminina natural, ou **Brian (nPczCjzI2devNBz1zQrb)** masculina
- Retorna MP3 binário
- Limita texto a 4500 chars por chamada

### 2. Atualizar `SpeakButton.tsx`
- Tentar ElevenLabs primeiro (chama edge function, toca como `<audio>`)
- Suporta longos textos: divide em chunks de ~4000 chars e toca em fila
- Fallback para Web Speech API se edge function falhar
- Mantém botões Pausar/Continuar/Parar

### 3. Secret `ELEVENLABS_API_KEY`
- Pedir ao usuário via `add_secret`

### 4. Config edge function
- `verify_jwt = false` em supabase/config.toml (TTS é leitura, não precisa auth obrigatória)

## Custo & limite
- ElevenLabs free tier: 10k chars/mês
- Apostilas grandes (~50k chars) consomem rápido — alertar usuário
- Sugerir cache no futuro (storage do áudio gerado por apostila)

## Arquivos
- `supabase/functions/elevenlabs-tts/index.ts` (novo)
- `supabase/config.toml` (adicionar bloco da função)
- `src/components/SpeakButton.tsx` (refatorar para usar ElevenLabs com fallback)

## O que NÃO mudo
- Web Speech API permanece como fallback automático
- Botão e UX visuais ficam iguais
