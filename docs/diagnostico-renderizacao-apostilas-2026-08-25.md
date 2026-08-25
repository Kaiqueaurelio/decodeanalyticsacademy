# Diagnóstico da renderização das apostilas — 25/08/2026

## Evidências

A página pública de leitura (`src/pages/ApostilaPage.tsx`) e o leitor estruturado (`src/pages/ApostilaReaderPage.tsx`) usam `ApostilaContentBoundary`, que carrega o mesmo `ApostilaContentRenderer`. Portanto, uma falha nesse renderer afeta todas as apostilas e também o preview do editor.

Antes da correção, uma tabela HTML preservada pelo editor era tratada como `paragraph` e recebia um elemento raiz `<p>`. O resultado era HTML estrutural inválido, por exemplo `<p><table>...<td>...</td></table></p>`, deixando o navegador e o DOM em estado inconsistente para o conteúdo rico.

Também foi reproduzido que conteúdos legados com marcadores escapados, como `1\\. Android — Plataforma`, não eram reconhecidos como heading/lista e exibiam a barra invertida literalmente.

A suíte de regressão criada em `src/components/ApostilaContentRenderer.test.tsx` falhou nos dois casos antes da alteração e passou após a alteração.

## Correção aplicada

O renderer agora extrai tabelas HTML completas para blocos independentes, sanitiza sua marcação e as renderiza fora de parágrafos. O wrapper genérico de conteúdo rico passou de `<p>` para `<div>`, permitindo tags estruturais preservadas sem HTML inválido. Foi criada uma normalização compartilhada para remover apenas a barra invertida de marcadores numerados escapados no início de linhas, aplicada tanto ao parser de seções quanto ao renderer.
