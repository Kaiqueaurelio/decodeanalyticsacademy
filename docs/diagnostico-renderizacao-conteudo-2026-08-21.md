# Diagnóstico da apostila completa — 21/08/2026

## Fonte e reprodução

A reprodução foi feita no ambiente autenticado local em:

`http://localhost:8080/reader/244d7b3f-f4eb-492c-8e12-12c87b8f6e17?lesson=page:5089d90c-4f3f-4624-9014-b655136ec3f1`

A mesma página corresponde à apostila `digitalização de imagens`, exibida na matéria `Fundamentos de Processamento de Imagens Digitais`, com data de aula `21/08/2026`.

## Evidências observadas antes da correção

O leitor estruturado usava `react-markdown` diretamente em `lessonContent`, enquanto o leitor clássico já usava `ApostilaContentBoundary` e `ApostilaContentRenderer`.

O conteúdo textual completo estava presente no DOM, com aproximadamente 31.563 caracteres na página reproduzida. O problema era a composição visual: o marcador `<audio-player ... />` estava concatenado com o texto de uma seção e aparecia como texto no sumário/conteúdo; não havia elemento de áudio renderizado (`audioElements: 0`).

A consulta do DOM também identificou 9 elementos de imagem, com 1 imagem sem carregamento confirmado no momento da medição. O texto não continha `<img` literal, indicando que o principal problema reproduzido era a interpretação do conteúdo rico e do marcador de áudio embutido, não a ausência do registro salvo.

## Correção aplicada

`src/pages/ApostilaReaderPage.tsx` foi alterado para usar `ApostilaContentBoundary` no lugar de `ReactMarkdown`. Esse wrapper usa `ApostilaContentRenderer`, que preserva texto, imagens, áudio, tabelas, blocos de código e fallback seguro.

Ainda deve ser concluído o ajuste do parser para reconhecer `<audio-player ... />` quando o marcador estiver embutido na mesma linha de um título, separando o controle de áudio do texto sem perder o título da seção.

## Validação já realizada

Após a troca para o renderer rico, o leitor carregou a página completa, exibindo 15 seções, 8 imagens de slides e o marcador de áudio identificado no conteúdo. TypeScript, 96 testes automatizados, build Vite/PWA e `git diff --check` passaram após a primeira correção.

A publicação não foi alterada durante o diagnóstico; nenhuma linha de conteúdo foi sobrescrita ou apagada.

## Validação após a correção do parser

No mesmo leitor autenticado, após a troca do `ApostilaContentRenderer` e da separação de marcadores embutidos:

- o sumário deixou de exibir `<audio-player ...>` como texto;
- a seção passou a aparecer como `4Aplicação em Radiologia e Exames de Raio‑X` (o conteúdo foi preservado; resta apenas uma melhoria visual opcional para inserir espaço após o número);
- foram encontrados 9 elementos de imagem, com 9 carregados (`naturalWidth > 0`);
- foi encontrado 1 elemento `<audio>` com a URL pública do arquivo MP3 salvo;
- o título do áudio `Resolução em Imagens Digitais.mp3` permaneceu presente;
- não existem `<img` nem `<audio-player` literais no texto renderizado;
- o conteúdo renderizado manteve aproximadamente 31.285 caracteres.

A screenshot atual mostra o conteúdo visual da apostila, incluindo a imagem de digitalização, em vez do HTML bruto.

## Gates após o ajuste

- TypeScript: passou.
- Vitest: 14 arquivos e 96 testes aprovados.
- Build Vite/PWA: passou; apenas o aviso existente de chunks maiores que 500 kB foi emitido.
- `git diff --check`: passou.
