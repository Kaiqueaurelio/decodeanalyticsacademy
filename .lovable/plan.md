## Objetivo

Transformar a Ella em uma assistente tipo ChatGPT focada no app, com poder de **criar, editar e excluir** conteúdo via chat (apenas para admins).

## Escopo confirmado
- **Permissão:** somente admins (`has_role(uid, 'admin')`). Alunos continuam usando os chats existentes.
- **Ações:** Apostilas, Exercícios/Flashcards, Calendário/Avisos, Navegação/Materiais.
- **Interface:** página dedicada `/ella` + painel lateral global (FAB que abre Sheet em qualquer tela).

## Arquitetura

```text
[UI Ella]  ──► [edge fn: ella-chat]  ──► [Lovable AI Gateway]
   ▲                  │                    (gemini-3-flash-preview)
   │                  │
   │                  ├─ valida admin (has_role)
   │                  ├─ streamText + tools (AI SDK)
   │                  └─ executa tools via supabase service_role
   │
   └─ renderiza markdown + cards de tool result
```

### Edge function `ella-chat`
- Recebe `{ messages: UIMessage[] }`.
- Valida JWT, busca user_id, verifica `has_role(uid,'admin')`. Se não admin → 403.
- `streamText` com `stopWhen: stepCountIs(50)` e tools:
  - **Apostilas:** `list_apostilas`, `get_apostila`, `create_apostila`, `update_apostila`, `delete_apostila`, `publish_apostila`, `generate_cover` (chama fn existente).
  - **Exercícios:** `list_exercises`, `create_exercise`, `update_exercise`, `delete_exercise`, `bulk_generate_exercises` (chama fn existente `generate-exercises`).
  - **Flashcards:** `create_flashcard`, `delete_flashcard`.
  - **Calendário/Avisos:** `create_calendar_event`, `update_calendar_event`, `delete_calendar_event`, `create_announcement`, `delete_announcement`.
  - **Materiais:** `add_material_link`, `delete_material`.
  - **Navegação/busca:** `search_app` (apostilas/exerc), `navigate_to` (devolve intent que cliente executa).
- Tools que mutam dados retornam `{ ok, id, summary }` curto.
- Resposta `toUIMessageStreamResponse`.

### Frontend
- **`src/pages/EllaPage.tsx`** (rota `/ella`, admin-only): chat fullscreen com AI Elements (Conversation, Message, MessageResponse, PromptInput, Tool).
- **`src/components/ella/EllaSidebar.tsx`**: FAB (canto inferior direito, oculto em landing/login) que abre um Sheet com o mesmo chat; injeta contexto da rota atual no system prompt.
- **`src/components/ella/EllaChat.tsx`**: componente compartilhado (useChat com `DefaultChatTransport` apontando para `ella-chat`).
- Mensagens persistidas em `localStorage` por sessão (sem threads).
- Tool calls renderizadas com `<Tool defaultOpen={false}>`; navegação executada via `useNavigate`.

### Rota & rede
- Add `/ella` em `App.tsx` com `<ProtectedRoute adminOnly>`.
- `EllaSidebar` montado em `App.tsx` ao lado do `MobileBottomNav`; oculto em `['/', '/login', '/reset-password', '/termos']` e quando user não é admin.

## Segurança
- Toda mutação roda no edge fn com `service_role` **depois** de validar admin.
- Tools destrutivas (delete) exigem confirmação textual no payload (ex.: `confirm: true`) e a Ella só passa `confirm: true` após o usuário confirmar no chat.
- Rate limit simples (10 tool calls/min por user) via memória de função.

## Fluidez landing page
- Bottom nav já corrigido (não aparece mais em `/`).
- Pequenos ajustes: garantir que `AdFooterMobile`, `PersistentAdSpot`, `AdPopup` também respeitem rotas públicas (apenas verificação rápida).

## Out of scope
- Threads/histórico em DB (usar localStorage por enquanto).
- Voz/áudio.
- Permissões granulares para alunos.

## Entregáveis
1. `supabase/functions/ella-chat/index.ts` + deploy.
2. `src/components/ella/EllaChat.tsx`, `EllaSidebar.tsx`.
3. `src/pages/EllaPage.tsx` + rota.
4. Fix bottom nav (já aplicado) + checagem nos demais overlays.
5. Memória atualizada com o novo padrão da Ella.