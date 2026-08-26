# Correção emergencial de inicialização e apostilas

## Objetivo
Restabelecer o carregamento normal do aplicativo e garantir que todas as apostilas exibam conteúdo para alunos, sem ciclos de “Atualização necessária” nem telas presas.

## Diagnóstico confirmado
- O aviso da captura é gerado por um temporizador fixo no `index.html`: após 12 segundos com o `#root` vazio, ele tenta limpar todos os service workers/caches e recarregar; na segunda tentativa, bloqueia a tela com “Atualização necessária”. Esse mecanismo pode transformar uma inicialização lenta ou uma falha de módulo em um falso erro de navegador.
- Há três rotinas de recuperação de cache concorrentes (`index.html`, `ErrorBoundary` e `src/lib/pwa.ts`), algumas removendo todos os caches/registros. Isso torna a recuperação imprevisível e pode afetar recursos não relacionados ao app-shell.
- No leitor estruturado, o carregamento inicial e o carregamento da lição não possuem `catch/finally` abrangente. Se uma consulta ao backend falhar, `loadingTree` ou `lessonLoading` pode permanecer ativo e o conteúdo não aparece.
- O leitor clássico e o estruturado compartilham `ApostilaContentBoundary`/`ApostilaContentRenderer`; portanto, a validação precisa cobrir os dois caminhos e conteúdos legados com listas, HTML, tabelas e imagens.

## Implementação
1. **Desbloquear a inicialização**
   - Remover o temporizador inline que injeta a tela “Atualização necessária” e o reload automático baseado apenas no `#root` vazio.
   - Centralizar a recuperação de chunks antigos no `ErrorBoundary`, exibindo uma ação segura somente quando houver erro real de import/chunk.
   - Limitar a limpeza aos caches e ao worker de app-shell da Decode, preservando o worker de push e dados não relacionados.
   - Manter o kill switch em `/sw.js` por um ciclo para atualizar instalações antigas, sem registrar novo cache offline.

2. **Tornar o carregamento das apostilas resiliente**
   - Envolver as consultas do `ApostilaReaderPage` em `try/catch/finally`, sempre encerrando os estados de loading.
   - Tratar falhas do RPC e das páginas separadamente: se a árvore estruturada falhar, usar as páginas salvas; se ambas estiverem vazias, oferecer o conteúdo principal/leitor clássico em vez de uma tela sem conteúdo.
   - Fazer o carregamento de cada lição usar o conteúdo já presente na árvore quando a consulta individual falhar ou retornar vazio.
   - Exibir erro recuperável e botão de tentar novamente, sem esconder a apostila disponível.

3. **Blindar o renderer compartilhado**
   - Validar e corrigir a separação de seções para que listas numeradas curtas não sejam descartadas como títulos vazios.
   - Preservar todo texto em conteúdo legado, incluindo HTML, tabelas, imagens, listas e marcadores escapados.
   - Manter o fallback de texto simples quando um bloco rico específico falhar.

4. **Regressão e validação como aluno**
   - Adicionar testes para inicialização sem falso aviso, limpeza seletiva de cache e encerramento dos estados de loading em falhas.
   - Adicionar casos do renderer para listas numeradas, conteúdo longo, HTML/tabelas e conteúdo parcial.
   - Executar testes focados e validar no navegador, autenticado como aluno, o dashboard, o leitor clássico e o leitor estruturado em viewport desktop e móvel.
   - Confirmar ausência de erros relevantes no console/rede e registrar a correção no changelog.

## Resultado esperado
- O app abre normalmente sem acusar incorretamente versão desatualizada do navegador.
- Uma falha de rede ou estruturação não deixa o leitor preso nem apaga conteúdo existente.
- Apostilas antigas e novas mostram integralmente texto, listas, tabelas e imagens nos dois leitores.
