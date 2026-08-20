# Plano de Auditoria e Separação de Conteúdo Acadêmico

O objetivo deste plano é garantir a integridade cronológica das apostilas da **Decode Analytics Academy**, identificando conteúdos misturados e aplicando a separação híbrida (automática com supervisão administrativa) conforme solicitado.

## Ações Propostas

### 1. Auditoria Geral (360º)
- Executar a varredura completa em todas as apostilas cadastradas utilizando a lógica `run_apostila_chronology_validation_internal`.
- Identificar apostilas que possuem mais de uma data detectada no mesmo bloco de conteúdo (`main_content_multiple_dates`) ou páginas fora de ordem.

### 2. Separação Híbrida de Conteúdo
Para a apostila de **Gestão de Projetos Operacionais** (e outras identificadas):
- **Identificação**: O sistema detectará automaticamente os marcadores de data (ex: "Dia: 19/08/2026").
- **Criação de Páginas**: Criar novas páginas na apostila para cada data subsequente encontrada.
- **Migração de Conteúdo**: Mover o texto correspondente a cada data para sua respectiva página, mantendo a estrutura e formatação original.
- **Validação de Cronologia**: Ajustar a posição (`position`) das páginas para garantir a ordem cronológica correta.

### 3. Fortalecimento da Integridade
- **Status Acadêmico**: Marcar as apostilas afetadas como "EM VALIDAÇÃO" durante o processo.
- **Logs de Auditoria**: Registrar cada movimentação de conteúdo no log de auditoria para rastreabilidade administrativa.

## Detalhes Técnicos

- **Mecanismo de Detecção**: Uso de expressões regulares (`regexp_matches`) no banco de dados para extração precisa de datas em formato brasileiro (DD/MM/AAAA).
- **Procedimento Híbrido**: O script realiza a separação lógica, e o painel de diagnóstico (`AcademicAuditPanel`) apresenta os resultados para validação final do administrador.
- **Estabilidade**: Utilização do `ApostilaValidationDashboard` para monitorar erros críticos e alertas preventivos em tempo real.

O aplicativo agora conta com um sistema de proteção contra misturas acidentais de aulas, garantindo que os alunos recebam o conteúdo organizado por data.
