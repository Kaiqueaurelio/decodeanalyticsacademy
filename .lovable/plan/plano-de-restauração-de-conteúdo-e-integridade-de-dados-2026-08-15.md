# Plano de Restauração de Conteúdo e Integridade de Dados

Este plano visa recuperar o conteúdo perdido da apostila "Theoretical Aspects of Computing", verificar a integridade de todas as apostilas no banco de dados e implementar um sistema robusto de backup e monitoramento para evitar perdas futuras.

## Ações imediatas

1. **Restauração de Conteúdo**:
   - Reconstrução total da apostila "Theoretical Aspects of Computing" com 6 capítulos e 24 exercícios.
   - Vinculação correta de metadados de disciplina (Computer Science).

2. **Integridade de Dados**:
   - Criação de scripts para verificar campos ausentes (como `subject`) em todas as apostilas.
   - Reparação automática de metadados corrompidos baseada nos títulos das apostilas.

3. **Sistema de Backup e Monitoramento**:
   - Implementação do `BackupManager` para gerar backups diários automáticos em JSON.
   - Criação de tabelas de monitoramento de integridade para alertas proativos.

## Detalhes técnicos

### Arquivos a serem criados/modificados:

- `src/lib/content-recovery/recovery.ts`: Lógica principal de restauração e verificação.
- `src/lib/content-recovery/backup-manager.ts`: Gerenciador de backups e retenção.
- `scripts/restore-apostilas.ts`: Script de execução via CLI.
- `supabase/migrations/20260815_content_integrity.sql`: Migração de banco de dados para novas tabelas de monitoramento.

### Mudanças no Banco de Dados:
- Nova tabela `workbook_content_integrity`: Acompanha a saúde de cada apostila.
- Nova tabela `content_backups`: Histórico de backups realizados.
- Adição de restrições (constraints) na tabela `workbooks` para garantir dados consistentes.
