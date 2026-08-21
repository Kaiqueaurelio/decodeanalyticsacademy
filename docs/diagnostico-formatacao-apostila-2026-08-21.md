# Diagnóstico de formatação da apostila — 21/08/2026

## Evidências reproduzidas

URL local autenticada: `/reader/244d7b3f-f4eb-492c-8e12-12c87b8f6e17?lesson=page:5089d90c-4f3f-4624-9014-b655136ec3f1`.

O leitor carrega a apostila e seus blocos de conteúdo, mas o sumário e alguns headings aparecem com formatação incorreta. O sumário mostra itens como `1 �`, `2 1 bit: 2 1`, `3 2 bits: 2 2`, `4 3 bits: 2 3`, `5 8 bits: 2 8`, `6 12 bits: 2 12`, `7 256 × 256 × 256`, `8 2 12` e `15 4 Aplicação em Radiologia e Exames de Raio‑X`.

A inspeção DOM confirmou os headings renderizados: `�`, `1 bit: 2 1`, `2 bits: 2 2`, `3 bits: 2 3`, `8 bits: 2 8`, `12 bits: 2 12`, `256 × 256 × 256`, `2 12`, seguidos dos headings corretos de resolução, quantização, tabela, revisão e radiologia.

O problema visual é composto por dois fatores: o conteúdo legado contém caracteres/números corrompidos em alguns headings e o sumário acrescenta uma numeração própria ao texto que já contém números. O conteúdo principal de texto, imagens e áudio continua carregado; a correção deve atuar apenas na apresentação dos títulos e no sumário, sem apagar o conteúdo salvo.

## Objetivo da correção

Remover headings compostos apenas por caractere inválido, normalizar títulos com numeração duplicada quando a duplicação for claramente técnica, preservar números que fazem parte de fórmulas e manter a numeração visual do sumário separada do texto do título, com espaçamento e truncamento responsivo adequados.

## Validação esperada

Após a correção, o sumário deve mostrar títulos legíveis, sem prefixos colados, e cada âncora deve continuar apontando para o heading correspondente. Imagens e áudio devem permanecer presentes e funcionais.

## Referência

Diagnóstico obtido no ambiente local autenticado, em 21/08/2026.

## Referências

Nenhuma fonte externa foi utilizada; este documento registra evidência do próprio aplicativo.


## Confirmação do conteúdo salvo

A consulta autenticada de somente leitura à página `5089d90c-4f3f-4624-9014-b655136ec3f1` retornou `contentLength: 40167`, com imagens `<img>` armazenadas desde o início do conteúdo, confirmando que os dados não foram apagados. A página possui `updated_at: 2026-08-21T00:24:19.145863+00:00` e `created_at: 2026-08-20T22:45:27.791087+00:00`.

As linhas iniciais do conteúdo são imagens de slides; os headings e seções são posteriormente interpretados pelo leitor. A anomalia observada no DOM é de apresentação: caracteres inválidos e prefixos numéricos duplicados nos headings/TOC. A correção deve manter os 40.167 caracteres e as URLs multimídia intactos.


## Headings confirmados no conteúdo salvo

A leitura autenticada retornou os seguintes headings na página: `# �`, `# 1 bit: 2 1`, `# 2 bits: 2 2`, `# 3 bits: 2 3`, `# 8 bits: 2 8`, `# 12 bits: 2 12`, `# 256 × 256 × 256`, `# 2 12`, `## Resolução Espacial: Quantos Pixels Formam a Foto`, `## Resolução de Intensidade: Quantos Níveis de Brilho Cada Pixel Pode Ter`, `## Redução de Níveis de Cinza: Efeitos da Quantização`, `## Palavras-Chave e Definições Importantes`, `## Tabela e Resumo: Comparando as Duas Resoluções`, `## Pontos Essenciais para Estudo e Revisão` e `## <audio-player ... />4Aplicação em Radiologia e Exames de Raio‑X`.

A numeração técnica pode ser apresentada de forma legível como `1 bit: 2¹`, `2 bits: 2²`, `3 bits: 2³`, `8 bits: 2⁸`, `12 bits: 2¹²` e `2¹²`. O heading formado apenas por `�` deve ser ocultado como marcador inválido. O último heading deve retirar o marcador técnico de áudio, inserir o espaço ausente e aparecer como `4 Aplicação em Radiologia e Exames de Raio‑X`.


## Evidência do vídeo enviado

Arquivo analisado: `ScreenRecording_08-21-202609-01-23_1.mp4`.

O erro aparece desde o início e fica evidente por volta de 00:14. O índice lateral mostra um caractere de substituição no primeiro item e fórmulas como `2 1`, `2 2`, `2 3`, `2 8` e `2 12`, sem sobrescrito. Ao abrir a seção, o corpo da apostila mantém o mesmo problema, exibindo potências de base 2 como números comuns e prejudicando a leitura do conteúdo sobre bits e níveis de cinza. Os slides/imagens aparecem visualmente preservados; o defeito está na camada textual/semântica de fórmulas e no caractere inválido.

Sequência observada: abertura da apostila “digitalização de imagens”, restauração de sessão, visualização do índice, rolagem até os slides, clique em “1 bit: 2 1” e navegação para o detalhamento da seção. O estado esperado é exibir `2¹`, `2²`, `2³`, `2⁸` e `2¹²` com expoentes e remover o caractere corrompido.

O diagnóstico orienta uma correção de apresentação: preservar o texto, imagens e áudio salvos, mas normalizar a tipografia matemática no renderer e filtrar headings que consistem somente em caractere inválido.
## Evidência DOM após a primeira correção

O índice renderiza um número automático em um `span` separado e, em seguida, o título começa com o mesmo número, produzindo visualmente sequências como `11 bit`, `22 bits`, `33 bits` e `6256 × 256 × 256`. A correção precisa ocultar a numeração automática quando o título já começa com número, sem remover o número do conteúdo.

O corpo da página ainda contém a expressão textual corrompida `2 � L=2 b`, indicando que a normalização de expoentes precisa tratar essa forma legada como fórmula `2^b`/`L = 2^b` na apresentação. O conteúdo original deve permanecer intacto no banco.

O índice já exibe corretamente alguns expoentes convertidos, como `2¹`, `2²`, `2³`, `2⁸` e `2¹²`, mas o item `2¹²` isolado ainda precisa ser revisado para não parecer um heading duplicado.

Fonte: DOM autenticado do leitor local em 21/08/2026.
## Validação intermediária após normalização

Após a primeira correção, o leitor passou a exibir `1 bit: 2¹`, `2 bits: 2²`, `3 bits: 2³`, `8 bits: 2⁸` e `12 bits: 2¹²` sem números automáticos duplicados nesses itens. A expressão legada do corpo foi normalizada para `L = 2ᵇ` e o caractere de substituição deixou de aparecer.

A inspeção revelou um caso residual: o título `2¹²` era precedido pelo contador automático `7`, sendo exibido como `7 2¹²`. O patch final trata títulos numéricos com sobrescrito como já numerados e remove apenas o contador visual do sumário.
## Validação final do leitor

Após o patch final, a tela autenticada mostrou o sumário com `8 Resolução Espacial`, `9 Resolução de Intensidade`, `10 Redução de Níveis de Cinza`, `11 Palavras-Chave`, `12 Tabela e Resumo` e `13 Pontos Essenciais`, sem números colados ao título. O item matemático isolado `2¹²` aparece sem o contador automático anterior.

As fórmulas de bits permanecem renderizadas como `2¹`, `2²`, `2³`, `2⁸` e `2¹²`; o conteúdo textual e as imagens continuam carregados. As marcações coloridas vistas na captura são a sobreposição de inspeção do navegador, não elementos da interface entregue ao aluno.
