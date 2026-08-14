# Plano de Implementação: Performance & Auditoria Pro (v5.3.0)

Este plano detalha a implementação do sistema de auditoria Ella, métricas avançadas de desempenho do aluno e validação estrutural de apostilas.

## 1. Monitoramento e Auditoria (Admin)
- **Painel de Auditoria Ella:** Criar `src/components/admin/EllaAuditPanel.tsx` para visualizar logs da tabela `ella_audit_log`.
- **Exportação de Dados:** Garantir que o `src/lib/audit-export.ts` suporte a filtragem atual.
- **Registro de Navegação:** Registrar acessos administrativos e alterações críticas no banco para trilha de auditoria.

## 2. Desempenho do Aluno (Dashboard)
- **Tendências e KPIs:** Atualizar `src/pages/PerformancePage.tsx` para incluir análise de tendências (semana atual vs. anterior).
- **Detalhamento por Área:** Refinar o agrupamento por áreas acadêmicas (IA, Segurança, etc.) usando a lógica de `subjectGroups.ts`.
- **Metas Dinâmicas:** Ajustar o `WeeklyGoalWidget` para ser mais responsivo ao progresso real do aluno.

## 3. Qualidade de Conteúdo (Editor/Admin)
- **Validador Estrutural:** Criar `src/lib/validators/workbookValidator.ts` para verificar hierarquia H1-H3 e acessibilidade.
- **Ella Check:** Integrar o validador no editor de apostilas para dar feedback em tempo real ao administrador.
- **Correção Automática:** Implementar sugestões de correção para erros comuns de formatação (ex: tabelas sem cabeçalho).

## Detalhes Técnicos
- Utilização intensiva de **TanStack Query** para cache eficiente das métricas.
- **Framer Motion** para animações de entrada nos novos widgets de performance.
- **RLS Protegido:** Todas as novas tabelas de log e métricas seguirão o padrão de segurança v5.2.0.
