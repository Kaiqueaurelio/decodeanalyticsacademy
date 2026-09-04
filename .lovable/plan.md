# Matérias "ocultas" e materiais AVA vazios

## O que a verificação no banco mostrou

1. **As matérias marcadas como "OCULTA" nas suas telas não existem no banco.** São cartões gerados pela própria tela do admin a partir da grade UNIP (título com prefixo `[GRADE]`). Eles nascem com `published: false` e `created_at` = data de hoje, e a lista de apostilas do admin desenha esses cartões exatamente como uma apostila real: badge "Oculta", "0 ex." e "Salva: 03/09/2026". Ou seja, é um erro de exibição — nada foi ocultado nem apagado.
   - Na outra tela (painel de matérias) o mesmo item aparece corretamente como "Criar", sem o prefixo `[GRADE]`.
2. **Só existe uma apostila realmente não publicada no banco:** "Pesquisa Operacional", com 0 caracteres (a versão com conteúdo, "Pesquisa Operacional e Teoria das Restrições", segue publicada).
3. **Matérias que aparecem vazias estão mesmo vazias no banco**, e não há backup para restaurar:
   - "Aspectos Teóricos da Computação": conteúdo 0, uma página com 113 caracteres, sem versões, sem materiais.
   - "Metodos de Pesquisa": conteúdo 0, página com 51 caracteres.
   - Só existe 1 snapshot de versão em todo o banco (Sistemas Operacionais Abertos e Mobile) — nenhum snapshot cobre essas duas.
   - Os 59 materiais (áudio, PDF, vídeo, imagem) têm arquivo válido; nenhum material está sem URL.
   - Uma matéria que parecia vazia na verdade tem conteúdo nas páginas: "Introdução às Ferramentas de Análise de Dados e Gestão de Projetos Operacionais" (83.530 caracteres em páginas, campo principal com 100).

## O que será corrigido

### 1. Cartões da grade não mais parecerem apostilas ocultas
Na lista de apostilas do admin (`src/pages/AdminPage.tsx`), quando o item for placeholder da grade:
- badge "Criar" (contorno) no lugar de "Oculta";
- remover o prefixo `[GRADE]` do título;
- esconder "0 ex." e a data "Salva:" falsa, trocando por "Matéria da grade — ainda sem apostila";
- ponto de status neutro em vez do cinza de "oculta".

### 2. Sinalizar apostila realmente vazia
Para apostilas reais sem conteúdo (campo principal e páginas somando menos de ~200 caracteres), mostrar badge "Vazia" na listagem, para você distinguir "oculta" de "sem conteúdo".

### 3. Painel de saúde
Em `src/components/admin/ApostilaHealthDashboard.tsx`, incluir a seção "Apostilas sem conteúdo" listando as matérias reais vazias (hoje: Pesquisa Operacional, Aspectos Teóricos da Computação, Metodos de Pesquisa) com atalho para abrir no Workbench.

### 4. Limpeza de dados
- Publicar/ocultar continua manual; nada será apagado.
- Nenhuma restauração automática é possível para "Aspectos Teóricos da Computação" e "Metodos de Pesquisa" — não existe backup no banco. Se você tiver o texto original (Word, AVA, PDF), reenvio e eu recoloco.

### 5. Registro
Entrada nova no topo de `src/data/changelog.ts` e atualização do `roadmap.md`.

## Detalhes técnicos
- Placeholders são criados em `AdminPage.tsx` (~linha 1830) e `AdminDashboard.tsx` (~linha 300) com `isPlaceholder: true`; o render da lista em `AdminPage.tsx` (~linhas 2564-2600) ignora essa flag — é onde entra a correção.
- Consultas usadas: `apostilas`, `apostila_pages`, `apostila_version_history`, `apostila_materials`, `materials`.
