# Evidência do provedor da Ella

Fonte oficial de compatibilidade OpenAI do Google: https://ai.google.dev/gemini-api/docs/openai

A documentação consultada em 19/08/2026 confirma o endpoint OpenAI-compatível `https://generativelanguage.googleapis.com/v1beta/openai/chat/completions`, autenticação por `Authorization: Bearer GEMINI_API_KEY`, suporte a chat completions, streaming e function calling. O exemplo atual usa `gemini-3.7-flash`.

Catálogo oficial de modelos: https://ai.google.dev/gemini-api/docs/models

O catálogo consultado lista `gemini-2.5-flash` e `gemini-2.5-flash-lite` como modelos disponíveis; também identifica `gemini-2.0-flash` como modelo anterior e `gemini-2.0-flash-lite` como encerrado. A correção local da Edge Function `ella-chat` trocou o principal para `gemini-2.5-flash` e o fallback para `gemini-2.5-flash-lite`, removendo a dependência de `gemini-1.5-flash`, que estava gerando 404/429 na produção.
