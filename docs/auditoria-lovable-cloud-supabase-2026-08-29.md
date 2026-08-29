# Auditoria Lovable Cloud → Supabase

**Data:** 29/08/2026  
**Projeto:** Decode Analytics Academy  
**Supabase de destino:** `wxkkpjpqyrygglbuogsd`

## Resultado executivo

A auditoria do repositório e do Supabase confirma que o schema, as tabelas, funções, políticas e estruturas necessárias do aplicativo foram levados para o projeto Supabase de destino. Entretanto, o histórico do GitHub não contém um dump completo dos dados operacionais do Lovable Cloud, e o painel legado não pôde ser consultado porque exige autenticação. Portanto, não é tecnicamente possível afirmar que cada registro histórico do Lovable Cloud foi copiado sem obter um export/backup do banco antigo.

## O que está confirmado no Supabase atual

| Entidade | Quantidade atual | Integridade observada |
|---|---:|---|
| Apostilas | 52 | Todas publicadas |
| Páginas de apostila | 63 | Nenhuma órfã |
| Módulos | 8 | Presentes |
| Capítulos | 24 | Presentes |
| Lições | 86 | Nenhuma órfã |
| Exercícios | 299 | Presentes |
| Apostilas duplicadas por título e matéria | 0 | Nenhuma encontrada |

O banco atual possui uma apostila sem conteúdo principal (`Metodos de Pesquisa`) e três páginas vazias de Cálculo Computacional. Também existem páginas curtas/placeholder em algumas matérias cujo conteúdo completo permanece em `apostilas.content`. Esses casos foram identificados como inconsistências de dados/estrutura, não como prova de apagamento em massa.

## Evidências do histórico do projeto

O commit de migração `ed1b5efa` registra a migração do schema consolidado, tabelas-base, compatibilidade e tipos TypeScript. A própria documentação da migração informa que os dados de usuários e conteúdo operacional do projeto antigo não foram copiados porque não havia dump completo e a consulta autenticada ao projeto antigo não estava autorizada.

As migrations de 18/08/2026 criaram páginas iniciais com textos-placeholder para apostilas sem páginas, a fim de impedir que o leitor ficasse vazio. Essa operação explica por que algumas matérias podem ter parecido sem conteúdo depois da migração, enquanto o conteúdo principal continuava no registro de `apostilas`.

A referência remota `origin/lovable-sync-1786221979` contém o código e a grade curricular do período anterior, mas não contém um dump do banco nem os conteúdos operacionais completos. Ela não pode ser usada como prova de que todos os registros do Lovable Cloud foram preservados.

Os `audit_logs` atuais não apresentam eventos de exclusão de apostilas, páginas ou conteúdos; apenas eventos `login_failed` foram encontrados no agrupamento consultado. Também não foram encontrados registros órfãos ou duplicatas no Supabase atual.

## Conclusão técnica

A conclusão correta é a seguinte: **a estrutura da aplicação foi migrada e o acervo presente no Supabase está íntegro nas relações principais, mas a preservação histórica integral do Lovable Cloud ainda não pode ser comprovada porque os dados do banco legado não estão disponíveis para comparação**.

Não foram apagados dados no Supabase atual durante esta auditoria. Nenhuma remoção foi executada. Os problemas de visualização já foram tratados no leitor para que o conteúdo principal não seja escondido por páginas-placeholder.

## Como fechar a auditoria com prova completa

Para uma comparação definitiva, é necessário obter no Lovable Cloud um export das tabelas de conteúdo e operação, especialmente `apostilas`, `apostila_pages`, `apostila_modules`, `apostila_chapters`, `apostila_lessons`, `exercises`, perfis e demais tabelas usadas pelo aplicativo. Com esse arquivo, será possível comparar IDs, títulos, tamanhos de conteúdo, datas e hashes registro por registro e importar somente as lacunas confirmadas.
