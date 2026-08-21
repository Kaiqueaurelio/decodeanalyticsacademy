# Validação do leitor da apostila — sumário ocupando o primeiro viewport

**Data:** 21/08/2026  
**Apostila:** `b132f212-5ede-4522-92d3-b0ead2cd8ce2`  
**Página:** `812c2375-dc09-460e-a964-1bba36d586ba`  
**Data salva:** 20/08/2026

## Diagnóstico

O conteúdo da apostila não estava ausente. O componente `ApostilaTOC`, usado dentro de `ApostilaContentBoundary`, inicializava o sumário com `open = true`. No celular, o sumário com 16 seções ocupava praticamente todo o primeiro viewport, fazendo parecer que somente o índice estava disponível.

O corpo da apostila era renderizado corretamente depois do bloco do sumário, mas exigia rolagem manual. O DOM local confirmou que a página continha o texto completo e que não era exibido o estado vazio `Sem material disponível por enquanto`.

## Correção aplicada

O sumário agora começa fechado com `useState(false)`. O botão continua visível e permite abrir o índice manualmente quando o aluno quiser navegar por seção. Assim, o primeiro viewport mostra o título e o início real da apostila, tanto no celular quanto no desktop.

Também foi criado um teste de regressão que impede que o estado inicial volte a ser aberto em futuras alterações.

## Evidência local

Após recarregar a mesma URL no servidor local:

| Verificação | Resultado |
|---|---|
| `aria-expanded` do sumário | `false` |
| Links do sumário inicialmente no DOM | `0` enquanto fechado |
| Texto renderizado no artigo | `7.116` caracteres observados |
| Primeiros headings | Programação linear & Métodos Gráficos; Dia: 19/08/2026; 1. As Equipes do Projeto; 2. Os Gerentes; 3. O Que é Pesquisa Operacional? |
| Estado vazio de conteúdo | Ausente |
| TypeScript | Aprovado |
| Teste de fluxo contínuo | 4 testes aprovados |

## Observação de publicação

O domínio Lovable ainda mostrou o bundle publicado anterior durante a validação, com o sumário aberto. A correção está pronta no código local e será sincronizada no GitHub; depois da atualização do bundle publicado, a mesma URL passará a abrir com o sumário fechado e o conteúdo visível imediatamente.

Nenhum texto, imagem, áudio ou registro do banco foi alterado.
