## Implementação: apostilas por semestre

### 1. Migração de banco

Adicionar em `apostilas`:
- `semester smallint` (1–12, nullable — `NULL` = visível em todos)
- `course text[]` (subset de `CC`,`SI`,`EC` — nullable = todos os cursos)

Trigger `validate_apostila_semester_course` (sem CHECK constraint) valida intervalo e valores do array. Index em `(semester, published)` para a query do aluno.

**Pré-classificação automática** das categorias existentes via `UPDATE` na própria migração, usando a grade UNIP CC do 1º ao 8º semestre. Apostilas que não baterem com nenhum padrão ficam `NULL` (aparecem para todos até o admin classificar). As 6 categorias já cadastradas (Inteligência Artificial, Arquitetura de Redes, Sistemas Operacionais, Teoria dos Grafos, Arquitetura de Computadores Modernos, Linguagens Formais, Computação Gráfica, APS V) ficam no **5º semestre**.

### 2. Helper TS — mapa disciplina→semestre

`src/lib/subject-semester-map.ts`: função `guessSemesterFromCategory(category)` que retorna 1–8 ou `null`. Usado para auto-preencher o campo no admin quando uma disciplina é digitada/selecionada.

### 3. Admin — Workbench (`AdminApostilaWorkbench.tsx`)

Na toolbar, ao lado de "Disciplina":
- **Select Semestre**: opções "Todos", "1º", "2º"… "8º" (autosave igual ao resto).
- **Multi-chip Curso**: CC / SI / EC (vazio = todos).
- Quando o admin troca a disciplina e o semestre está vazio, sugere automaticamente via `guessSemesterFromCategory`.

### 4. Admin — `AdminPage.tsx`

- Badge "5º sem" no card da apostila (cor sutil, ao lado do badge de status).
- Filtro "Semestre" na barra de busca (Select com "Todos" + 1–8).
- Form "Criar manualmente" e "Importar": adicionar campo Semestre (com sugestão automática quando categoria é escolhida).
- **Ação em lote**: checkbox em cada card + botão "Definir semestre nos selecionados" (resolve as apostilas órfãs em poucos cliques).

### 5. Aluno — filtro por semestre

`src/hooks/queries/useDashboardData.ts`:
- `useApostilasList` aceita `{ semester?: number, course?: 'CC'|'SI'|'EC', mode: 'mine'|'all' }`.
- Quando `mode='mine'` e `semester` definido, filtra `.or('semester.eq.X,semester.is.null')` e (se curso definido) `.or('course.is.null,course.cs.{X}')`.
- Inclui `semester` e `course` nas colunas retornadas (sem custo: leves).

`src/pages/DashboardPage.tsx`:
- Lê `profile.semester` e `profile.course`.
- Adiciona toggle Pill no header dos carrosséis: **"Meu semestre (5º)"** ↔ **"Todos"**.
- Default = "Meu semestre". Preferência persistida em `localStorage` (`apostilas.semesterFilter`).
- Quando "Todos", agrupa por semestre com headers ("1º semestre" → "8º semestre" → "Sem semestre").
- Se aluno não tem `semester` no profile: banner discreto "Defina seu semestre no perfil" com link para `/profile`, e mostra todas como fallback.

### 6. Card visual

`src/components/ApostilaCardActions.tsx` (ou onde o card é renderizado): badge sutil com cor do `getSubjectColor` mostrando "Nº sem".

## Arquivos afetados

```text
NOVOS:
  supabase/migrations/<ts>_apostilas_semester_course.sql
  src/lib/subject-semester-map.ts

EDITADOS:
  src/hooks/queries/useDashboardData.ts
  src/pages/AdminApostilaWorkbench.tsx
  src/pages/AdminPage.tsx
  src/pages/DashboardPage.tsx
  src/components/ApostilaCardActions.tsx (badge opcional)
```

## Garantias

- **Não quebra nada**: como `semester` é nullable e o toggle "Todos" existe, alunos seguem vendo tudo até o admin classificar; e apostilas extracurriculares (NULL) sempre aparecem.
- **Performance**: filtro server-side (`.eq` / `.is`), com index `(semester, published)`.
- **Multi-curso**: já fica preparado para SI e EC, mesmo que hoje só CC esteja em uso.
- **Pré-classificação**: roda 1x na migração; admin pode reclassificar depois.
