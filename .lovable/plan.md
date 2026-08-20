# Plano de Implementação - Sistema Avançado de Integridade Cronológica (v6.7.0)

Este plano detalha a implementação do sistema de prévia de separação, automação de importação e controle de visibilidade para garantir a integridade das apostilas.

## Objetivos
- **Prévia Híbrida**: Visualizar tanto a lista de tópicos quanto o conteúdo detalhado antes de confirmar a separação.
- **Automação Híbrida**: Detectar datas automaticamente durante o "Smart Paste" e oferecer a separação imediata, com opção manual.
- **Controle de Acesso Adaptativo**: Bloquear acesso total quando crítico, ou exibir alerta persistente quando em revisão, dependendo da severidade da inconsistência.
- **Filtro Temporal**: Melhorar a navegação do aluno com seleção de datas no cabeçalho.

## Etapas Técnicas

### 1. Backend & RPCs
- Refinar a RPC `split_apostila_by_date` para suportar um modo `dry_run` que retorna a prévia sem salvar.
- Adicionar campo `validation_severity` na tabela `apostila_validation_runs` para distinguir entre avisos e bloqueios.

### 2. Painel Administrativo (`AdminApostilaWorkbench.tsx`)
- **Smart Detection**: Ao colar conteúdo, rodar um scanner de Regex. Se detectar mais de uma data, abrir o modal de prévia.
- **Interface de Prévia**: Criar `ApostilaSplitPreview.tsx` com tabs (Lista / Conteúdo).
- **Ações de Separação**: Botão de confirmação na prévia que dispara o processamento real.

### 3. Experiência do Aluno (`ApostilaReaderPage.tsx`)
- **Banner de Status**: Implementar banner dinâmico no topo que muda de cor/mensagem baseado no `status` (em_manutencao vs bloqueado).
- **Navegação por Data**: Seletor de data persistente no header que filtra o sumário lateral e as páginas visíveis.

### 4. Diagnóstico e Auditoria
- **Exportação CSV**: Incluir metadados de quem aprovou a separação e quando.
- **Alertas de Inconsistência**: Toast informativo quando o admin entra em uma apostila que o sistema detectou como "misturada".

## Detalhes Técnicos
- **Regex**: `###\s*\*\*Dia:\s*(\d{2}/\d{2}/\d{4})` como padrão primário.
- **Estado**: Utilizar TanStack Query para invalidar o cache das páginas após a separação.
- **UI**: Componentes Shadcn (Tabs, Dialog, ScrollArea) para a prévia.

---
Você aprova esta abordagem para seguirmos com a implementação?