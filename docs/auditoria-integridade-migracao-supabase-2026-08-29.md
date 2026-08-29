# Auditoria de Integridade da Migração para o Supabase

**Data da auditoria:** 29/08/2026  
**Projeto:** Decode Analytics Academy  
**Banco analisado:** `wxkkpjpqyrygglbuogsd`

## Conclusão executiva

A auditoria não encontrou evidência de apagamento em massa do acervo durante a migração. O banco atual contém 52 apostilas publicadas, 63 páginas, 8 módulos, 24 capítulos, 86 lições e 299 exercícios.

A principal causa da ausência aparente de conteúdos foi estrutural: algumas migrations criaram páginas-placeholder para evitar um leitor vazio, enquanto o conteúdo completo permaneceu no campo principal de `apostilas.content`. O leitor antigo priorizava `apostila_pages` e, em alguns casos, exibia apenas o placeholder ou um trecho muito curto.

## Inventário encontrado

| Entidade | Quantidade | Observação |
|---|---:|---|
| Apostilas | 52 | Todas marcadas como publicadas |
| Apostilas sem conteúdo principal | 1 | `Metodos de Pesquisa` |
| Páginas | 63 | Associadas ao acervo |
| Páginas completamente vazias | 3 | Todas em Cálculo Computacional |
| Páginas órfãs | 0 | Nenhuma aponta para apostila inexistente |
| Módulos | 8 | Sem inconsistência referencial observada |
| Capítulos | 24 | Sem inconsistência referencial observada |
| Lições | 86 | Nenhuma lição órfã |
| Exercícios | 299 | Registros presentes |
| Apostilas duplicadas por título e matéria | 0 | Nenhuma duplicidade encontrada |

## Registros que exigem atenção

A apostila `Metodos de Pesquisa` está realmente sem conteúdo principal e possui apenas um texto-placeholder de 51 caracteres na página associada. Não foi encontrada no repositório uma fonte versionada com o material completo dessa disciplina; portanto, ela não foi preenchida com conteúdo inventado.

Três páginas vazias pertencem à apostila de Cálculo Computacional e têm os títulos `25/08/2026` e `Nova Página — 26/08/2026`. O conteúdo principal e outras páginas completas da apostila continuam presentes. Essas páginas parecem ser rascunhos criados no editor, não evidência de apagamento do material principal.

Também foram encontradas apostilas cujo campo principal é muito maior que as páginas associadas, especialmente em Ciência da Computação. Nesses casos, o conteúdo original continua salvo, mas a leitura poderia aparentar perda quando as páginas curtas eram priorizadas.

## Evidência no histórico do projeto

As migrations de 18/08/2026 incluíram comandos para criar páginas iniciais com textos como `Este conteúdo está sendo estruturado` e `Material em fase de estruturação` quando não existiam páginas. Isso explica a presença de placeholders, mas não demonstra exclusão do conteúdo principal.

Os `audit_logs` disponíveis no banco registram apenas eventos `login_failed` no período consultado; não há eventos registrados de exclusão de apostilas, páginas ou conteúdos. Como o banco anterior não está disponível nesta sessão para uma comparação integral linha a linha, a conclusão correta é: **não há evidência no Supabase atual de apagamento em massa ou de registros órfãos, mas não é possível provar historicamente a preservação de cada versão anterior sem um backup/exportação do banco antigo**.

## Correção aplicada no aplicativo

O leitor foi corrigido para incluir o conteúdo principal de `apostilas.content` quando as páginas associadas estiverem vazias, forem placeholders ou representarem apenas uma fração insuficiente do material. A correção evita que páginas curtas escondam o conteúdo completo.

Essa correção está no commit:

```text
8ec2361d fix: restaurar conteudo principal das materias
```

## Próximas ações recomendadas

O conteúdo de `Metodos de Pesquisa` deve ser restaurado a partir do arquivo original, backup ou material fornecido pelo administrador. As três páginas vazias de Cálculo podem ser mantidas como rascunhos ou removidas posteriormente, mas não devem ser apagadas sem confirmação, pois possuem datas associadas.

Para que a correção do leitor apareça no endereço público, a Vercel ou a Lovable precisam publicar o branch `main` atualizado. O GitHub, o Supabase e o código local já estão alinhados quanto à correção do carregamento.
