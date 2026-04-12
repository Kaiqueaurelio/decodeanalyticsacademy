

# Plano: Notificações de Prova + Landing Page Multicurso + Depoimentos Redesenhados

## Resumo

Três melhorias: (1) sistema de notificações toast quando provas estão a menos de 3 dias, (2) atualizar toda a landing page para refletir que o app atende múltiplos cursos de tecnologia (CC, SI, EC), e (3) redesenhar a seção de depoimentos com visual mais impactante e editorial.

---

## 1. Notificações de Lembrete de Provas

**Arquivo:** `src/components/ExamCalendarWidget.tsx`

- Adicionar um `useEffect` que roda ao montar o componente e verifica todas as provas com `differenceInDays <= 3` e `!isPast`
- Para cada prova urgente, disparar um `toast.warning()` do sonner com mensagem tipo: `"⚠️ Prova 'Cálculo II' em 2 dias!"`
- Usar `localStorage` para guardar quais notificações já foram mostradas na sessão atual (`decode_exam_notified_ids`), evitando spam
- Provas com `days === 0` mostram toast especial: `"🔴 Hoje é dia de prova: 'Cálculo II'!"`

## 2. Landing Page — Multicurso de Tecnologia

**Arquivo:** `src/pages/LandingPage.tsx`

Mudanças pontuais em textos:

- **Linha 185** (seção Benefits): Trocar `"Criada por alunos de Ciência da Computação que sabem exatamente o que você precisa."` por algo como `"Criada para estudantes de Ciência da Computação, Sistemas de Informação, Engenharia da Computação e cursos de tecnologia com grade curricular compartilhada."`
- **Seção Stats**: Adicionar ou ajustar um stat para `"3+ Cursos"` com label `"Compatíveis"` (CC, SI, EC)
- **Testimonials**: Diversificar os cursos nos depoimentos — mudar `"CC"` para incluir `"SI"` e `"EC"` nos cursos dos alunos
- **Hero ou subtítulo**: Pode-se adicionar uma menção sutil tipo `"Para CC, SI, EC e cursos de tecnologia"`

## 3. Depoimentos — Redesign Visual

**Arquivo:** `src/pages/LandingPage.tsx` (seção Testimonials, linhas 238-265)

Redesenhar a seção para ficar mais destacada e impactante:

- **Layout**: Um depoimento principal grande (featured) no topo com foto/avatar placeholder, aspas decorativas grandes em Instrument Serif (`""`), e os outros dois menores abaixo
- **Visual**: Card do depoimento featured com borda `primary/20`, fundo levemente diferenciado (`bg-primary/[0.03]`), aspas decorativas em `text-primary/20` com tamanho `text-6xl`
- **Avatares**: Adicionar iniciais coloridas em círculos como avatar placeholder (sem usar emojis)
- **Badges de curso**: Cada depoimento mostra um badge colorido com o curso (CC em amarelo, SI em verde, EC em azul)
- **Diversificar cursos**: Ana Silva → SI, Carlos Santos → EC, Juliana Costa → CC (mostrando que serve para todos)
- **Adicionar mais 1-2 depoimentos** para ter conteúdo suficiente para o layout assimétrico

---

## Detalhes Técnicos

- Toast de provas usa `import { toast } from "sonner"` — já disponível no projeto
- Nenhuma alteração de banco de dados necessária
- Nenhum componente novo — apenas edições no `ExamCalendarWidget` e `LandingPage`

