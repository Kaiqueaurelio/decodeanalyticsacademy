# Auditoria — Gestão de Projetos Operacionais

**Data:** 20/08/2026  
**Apostila auditada:** `b132f212-5ede-4522-92d3-b0ead2cd8ce2`  
**Título:** Introdução às Ferramentas de Análise de Dados e Gestão de Projetos Operacionais

## Diagnóstico do conteúdo

A auditoria autenticada confirmou que a mistura ocorreu no histórico do campo principal durante as atualizações da aula de 19/08. A versão principal atualmente restaurada tem 52.798 caracteres, começa com `Excel | Power BI | Pesquisa Operacional` e não contém `19/08/2026`, `Programação linear`, `As Equipes do Projeto`, `Parte 2` nem `Gerador de Energia`.

O conteúdo da aula de 19/08 está preservado em uma página independente, sem remoção de texto. O registro atual é `812c2375-dc09-460e-a964-1bba36d586ba`, com título `Parte 2 — Continuação (19/08/2026)` e 49.879 caracteres. Ele contém o bloco inicial de `Programação linear & Métodos Gráficos`, a data `19/08/2026`, `As Equipes do Projeto`, `Parte 2` e `O Gerador de Energia`.

| Registro | Conteúdo | Evidência |
|---|---:|---|
| Apostila principal `b132f212...` | 52.798 caracteres | Versão limpa; sem marcadores da aula de 19/08 |
| Página `812c2375...` | 49.879 caracteres | Aula de 19/08 completa; todos os marcadores presentes |
| Backup pré-restauração `57e25e20...` | 7.886 caracteres | Bloco inicial que havia sido inserido no campo principal |
| Backup pré-movimentação `3c23668c...` | 41.990 caracteres | Continuação que já estava na página antes da correção completa |

## Diagnóstico do botão `+ PÁGINA`

O checkout local contém o fluxo persistido correto. O callback aguarda autosave, salva a página atual quando necessário, executa o insert em `apostila_pages`, atualiza o estado local, navega para `?page=<novo-id>&expanded=1` e informa que a nova página está aberta. O botão visual é `type="button"`, portanto não submete o formulário por acidente.

A reprodução autenticada local confirmou a criação de um registro real antes inexistente: `e9923dc3-33be-4023-9567-ed7c9726caf6`, título `Nova Página — 20/08/2026`, posição 2, conteúdo vazio e URL com o ID da página nova.

A causa de o usuário ainda observar o comportamento antigo nas URLs públicas não está no código corrigido nem no banco. Os chunks públicos antigos de Lovable e Vercel não continham os marcadores do callback persistido (`Nova página criada`, `createPersistedPage` e `apostila_pages`). Eles correspondem a uma versão anterior do Workbench.

Foi criado um preview no projeto Vercel existente a partir do commit `fe2d6f8359db385c97bd2c8a33b804b0b830e617`. O deployment `dpl_DuttCguz5oqQGrbnV6uHArYQ5xqL` terminou em `READY` e o chunk `AdminApostilaWorkbench-BWkuxeiM.js` contém `Nova página criada`, `apostila_pages`, a mensagem de erro de RLS/schema e `type:"button"`. Isso comprova que o código corrigido constrói e é servido corretamente.

O domínio de produção da Vercel continua associado a deployments `BLOCKED`. O detalhe oficial do deployment aponta para a documentação de configuração de conta da Vercel. A proteção de senha, SSO e IP do projeto está desativada; portanto, não há indicação de que a proteção do projeto seja a causa. O problema restante é a publicação/ativação da versão corrigida na produção, não a lógica local nem a separação dos dados.

## Conclusão

As aulas estão separadas no banco: a apostila principal contém o material original e a página independente contém o conteúdo integral da aula de 19/08. O botão funciona no código corrigido e foi reproduzido criando uma linha real. Se o botão continuar sem criar página em `decodeanalyticsacademy.lovable.app` ou `decodeanalyticsacademy.vercel.app`, a tela pública ainda está servindo o bundle antigo; o preview Vercel READY comprova que a versão corrigida está pronta para substituir a produção assim que o bloqueio de deployment for resolvido.
