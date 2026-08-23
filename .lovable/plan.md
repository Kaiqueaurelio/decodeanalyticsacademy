# Plan: Versão 7.3.0 - Estabilidade de Anúncios, Telemetria & Dual-Theme

Este plano foca em resolver o erro 401 recorrente na tela de login, implementar um sistema de telemetria robusto e introduzir a opção de um tema minimalista puro, mantendo a identidade industrial.

## Mudanças Técnicas

### Backend (Supabase)
- **Edge Function `list-ads`**: 
    - Remover obrigatoriedade de autenticação via `requireUser`.
    - Implementar lógica que retorna `[]` (sucesso) se nenhum token for enviado.
    - Manter validação de token caso ele seja fornecido, retornando erro apenas se o token for inválido/expirado.
- **Telemetria & Logs**:
    - Criar tabela `public.system_telemetry` para logs técnicos de performance e erros de rede.
    - Integrar registros de falhas de autenticação tanto na nova tabela quanto em `public.audit_logs` (como solicitado).

### Frontend
- **Hook `useAds`**:
    - Adicionar tratamento para expiração de sessão.
    - Garantir que o estado `loading` e `empty` seja consistente entre mudanças de rota.
    - Adicionar logs de depuração no console para facilitar rastreio de tokens ausentes.
- **Sistema de Temas**:
    - Criar variante `minimalist` no sistema de cores (Tailwind/CSS Vars).
    - Implementar botão de alternância (Toggle) entre Industrial Cyberpunk e Minimalista no Dashboard.
- **Auditoria Visual (De-AI)**:
    - Varredura em componentes para remover sombras suaves, gradientes genéricos e arredondamentos excessivos.
    - Padronizar uso de bordas neon, cyber-grids e fontes mono em tabelas e cards.

### Documentação
- Atualizar `src/data/changelog.ts` para a versão 7.3.0.

## Detalhes Técnicos
- A tabela `system_telemetry` terá colunas: `id`, `event_type`, `payload` (jsonb), `user_id` (opcional), `created_at`.
- O tema minimalista usará uma paleta monocromática (cinza/branco/preto) com tipografia limpa, removendo as linhas de grade e brilhos neon.
