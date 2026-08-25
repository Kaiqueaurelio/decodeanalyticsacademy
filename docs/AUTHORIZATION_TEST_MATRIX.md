# Matriz de testes de autorização

| Perfil | Conteúdo publicado no escopo | Conteúdo publicado fora do escopo | Conteúdo não publicado | Ferramentas administrativas |
|---|---|---|---|---|
| Aluno autenticado | Deve visualizar | Deve ser recusado | Deve ser recusado | Deve ser recusado |
| Aluno `enem_only` | Deve visualizar conteúdo ENEM e Simulados ENEM | Deve ser recusado | Deve ser recusado | Deve ser recusado |
| Administrador | Deve visualizar | Deve visualizar | Deve visualizar | Deve executar após autorização |
| Usuário anônimo | Não deve acessar a API autenticada | Não deve acessar | Não deve acessar | Não deve acessar |

## Casos críticos

O acesso deve ser validado tanto por consultas diretas ao banco quanto pelas ferramentas `search_app` e `get_apostila` da `ella-chat`, porque essas ferramentas usam service-role e precisam reaplicar os filtros de RLS manualmente. Também devem ser testadas chamadas sem token, chamadas com token de aluno para `gemini-direct` e `extract-announcement`, e tentativas de invocar RPCs SECURITY DEFINER revogados.

Os testes unitários existentes de segurança cobrem prompt injection e o gate de autorização da Ella. Os testes com três identidades reais devem ser executados em ambiente de staging com contas de teste separadas, sem usar dados pessoais ou contas de produção.
