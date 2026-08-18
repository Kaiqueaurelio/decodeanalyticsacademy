# Plano de Restauração e Auditoria de Conteúdo

O objetivo deste plano é validar o estado atual do banco de dados, identificar e remover duplicatas que causam instabilidade, e restaurar integralmente o conteúdo das apostilas, com foco prioritário em **Aspectos Teóricos da Computação**.

## Ações Técnicas

1. **Auditoria Profunda**:
   - Executar `scripts/deep-audit.ts` para mapear duplicatas, páginas órfãs e apostilas vazias.
   - Gerar um snapshot do estado atual antes de qualquer alteração destrutiva.

2. **Limpeza de Instabilidades**:
   - Remover registros duplicados (IDs conflitantes para o mesmo título/semestre).
   - Corrigir páginas que perderam a associação com suas apostilas pai.

3. **Restauração de Conteúdo (Multimídia)**:
   - Re-executar a restauração de "Aspectos Teóricos da Computação" (6 capítulos, imagens e áudios originais).
   - Restaurar apostilas da Faculdade (Redes, IA, SO) usando o mapeamento de integridade em `src/lib/content-recovery/recovery.ts`.

4. **Segurança e Prevenção**:
   - Temporariamente desativar RLS durante a injeção em lote para evitar erros de permissão reportados anteriormente.
   - Reativar e validar as políticas de RLS após a conclusão.
   - Documentar a causa raiz (provável falha na propagação de chaves estrangeiras durante deleções parciais).

## Detalhes Técnicos

- **Ferramentas**: Scripts TypeScript em `scripts/` e biblioteca de recuperação em `src/lib/content-recovery/`.
- **Validação**: Testes automatizados pós-restauração para verificar contagem de páginas e presença de mídia.
- **Relatório**: Será fornecido um log detalhado de cada apostila recuperada e seu estado final.
