---
name: Ella Copiloto Admin
description: Chat tipo ChatGPT com poder de criar/editar/excluir conteúdo via tools (admin-only)
type: feature
---
# Ella — Copiloto Admin

## Acesso
- **Apenas admins** (`has_role(uid, 'admin')`). Validado server-side em `ella-chat`.
- Rota dedicada: `/ella` (admin-only).
- FAB global `EllaSidebar` (canto inferior direito) em todas as telas internas, oculto em `/`, `/login`, `/reset-password`, `/termos` e `/ella`.

## Arquitetura
- Edge function `supabase/functions/ella-chat/index.ts`: agentic loop (até 8 passos) via Lovable AI Gateway (`google/gemini-3-flash-preview`) com OpenAI tool calling.
- Tools executadas com `SUPABASE_SERVICE_ROLE_KEY` após validar admin.
- Cliente: `src/components/ella/EllaChat.tsx` (UI compartilhada), `EllaSidebar.tsx` (sheet), `pages/EllaPage.tsx` (fullscreen).
- Histórico em `localStorage` (`ella.chat.v1`), últimos 40 turnos.

## Tools disponíveis
- Apostilas: `search_app`, `get_apostila`, `create_apostila`, `update_apostila`, `delete_apostila` (confirm), `generate_cover`.
- Exercícios: `create_exercise`, `delete_exercise` (confirm), `bulk_generate_exercises`.
- Calendário/Avisos: `create_calendar_event`, `delete_calendar_event` (confirm), `create_announcement`, `delete_announcement` (confirm).
- Materiais: `add_material_link` (cria em `materials` + linka em `apostila_materials`).
- Navegação: `navigate_to` (devolve path; cliente executa via `useNavigate`).

## Regras
- Toda tool destrutiva exige `confirm=true`; o modelo é instruído a pedir confirmação textual antes.
- `navigate_to` triggera redirect após 400ms.
- Schemas reais validados: `announcements.category` + `created_by`, `calendar_events.event_type` + `subject` + `created_by`, `materials` separado de `apostila_materials`.
