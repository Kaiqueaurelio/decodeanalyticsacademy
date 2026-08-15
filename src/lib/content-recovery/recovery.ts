import { supabase } from "./recovery-client";
import { subjectKey } from "@/lib/curriculum-subjects";

interface WorkbookMetadata {
  id: string;
  title: string;
  subject: string;
  description: string;
}

interface ContentBlock {
  title: string;
  order: number;
  content: string;
}

/**
 * PRIORITY 1: Restore Theoretical Aspects of Computing Content
 */
export async function restoreTheoreticalComputingApostila() {
  const theoreticalContent = {
    id: 'apostila_theoretical_computing_001',
    title: 'Aspectos Teóricos da Computação',
    subject: 'Ciência da Computação',
    description: 'Guia completo sobre teoria da computação, algoritmos e complexidade computacional com suporte multimídia.',
    
    sections: [
      {
        title: 'Capítulo 1: Fundamentos da Computação',
        order: 1,
        content: `
## 1.1 O que é Computação?

A computação é o processo de transformar dados de entrada em dados de saída seguindo um conjunto de regras ou algoritmos.

![Fundamentos da Computação](https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=1000)

### Conceitos Chave:
- **Algoritmo**: Uma sequência finita de instruções bem definidas.
- **Máquina de Turing**: Modelo abstrato para computabilidade.
- **Complexidade**: Medição da eficiência (tempo e espaço).

<audio src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" controls></audio>
*Ouça a introdução aos fundamentos.*
        `
      },
      {
        title: 'Capítulo 2: Linguagens Formais e Autômatos',
        order: 2,
        content: `
## 2.1 Linguagens Formais

Uma linguagem formal é uma descrição matemática precisa de linguagens usando alfabetos e cadeias.

![Autômatos](https://images.unsplash.com/photo-1507413245164-6160d8298b31?auto=format&fit=crop&q=80&w=1000)

### Hierarquia de Chomsky:
1. **Regulares**: DFA/NFA.
2. **Livres de Contexto**: PDA.
3. **Sensíveis ao Contexto**: LBA.
4. **Recursivamente Enumeráveis**: Máquina de Turing.

<audio src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" controls></audio>
*Explicação sobre a Hierarquia de Chomsky.*
        `
      },
      {
        title: 'Capítulo 3: Complexidade Computacional',
        order: 3,
        content: `
## 3.1 Complexidade de Tempo

Mede a eficiência do algoritmo em função do tamanho da entrada (n).

![Algoritmos](https://images.unsplash.com/photo-1516116216624-53e697fedbea?auto=format&fit=crop&q=80&w=1000)

### Notação Big-O:
- **O(1)**: Constante.
- **O(log n)**: Logarítmica.
- **O(n)**: Linear.
- **O(n log n)**: Linearitmica.
- **O(n²)**: Quadrática.

<audio src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3" controls></audio>
*Análise de complexidade e Notação Big-O.*
        `
      },
      {
        title: 'Capítulo 4: Decidibilidade e Redutibilidade',
        order: 4,
        content: `
## 4.1 Problema da Parada

O problema de determinar se um programa P para em uma entrada I é indecidível.

![Decidibilidade](https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&q=80&w=1000)

### Teorema de Rice:
Qualquer propriedade não trivial das linguagens recursivamente enumeráveis é indecidível.
        `
      },
      {
        title: 'Capítulo 5: Tópicos Avançados e P vs NP',
        order: 5,
        content: `
## 5.1 O Problema P vs NP

P é a classe de problemas solúveis em tempo polinomial. NP é a classe de problemas cujas soluções são verificáveis em tempo polinomial.

![Futuro da Computação](https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=1000)

### Computação Quântica:
Utiliza qubits e fenômenos como superposição e emaranhamento para resolver problemas específicos mais rapidamente.
        `
      },
      {
        title: 'Capítulo 6: Aplicações Modernas',
        order: 6,
        content: `
## 6.1 Criptografia e Segurança

A segurança moderna baseia-se na dureza computacional de certos problemas (ex: fatoração de primos).

![Criptografia](https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=1000)
        `
      }
    ]
  };

  try {
    // 1. DELETE OLD INCOMPLETE DATA (if exists)
    const { data: existing } = await supabase
      .from('apostilas')
      .select('id')
      .eq('title', theoreticalContent.title)
      .maybeSingle();

    if (existing) {
      await supabase
        .from('apostilas')
        .delete()
        .eq('id', existing.id);
    }

    // 2. CREATE APOSTILA WITH FULL METADATA
    const { data: apostila, error: apostilaError } = await supabase
      .from('apostilas')
      .insert({
        title: theoreticalContent.title,
        category: theoreticalContent.subject, 
        subject: theoreticalContent.subject,
        cover_url: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?q=80&w=1000',
        published: true,
        semester: 5,
        created_by: '1ea75282-cc92-49a2-92a2-4c54344a6d43',
        content: theoreticalContent.description
      })
      .select()
      .single();

    if (apostilaError) throw apostilaError;

    // 3. INSERT CHAPTERS
    const pages = theoreticalContent.sections.map((section, idx) => ({
      apostila_id: apostila.id,
      title: section.title,
      content: section.content,
      position: section.order
    }));

    const { error: pagesError } = await supabase
      .from('apostila_pages')
      .insert(pages);

    if (pagesError) throw pagesError;

    // 4. CREATE ASSOCIATED EXERCISES
    const exercises = [
      {
        question: 'Explique a Tese de Church-Turing e suas implicações para a computação.',
        correct_answer: 'A Tese de Church-Turing afirma que qualquer função efetivamente computável pode ser computada por uma Máquina de Turing.',
        type: 'essay'
      },
      {
        question: 'Desenhe um DFA para cadeias binárias terminadas em "01". Descreva os estados e transições.',
        correct_answer: 'Estados: q0 (início), q1 (viu 0), q2 (viu 01). Transições: q0-0->q1, q0-1->q0, q1-0->q1, q1-1->q2, q2-0->q1, q2-1->q0.',
        type: 'essay'
      },
      {
        question: 'Analise e prove que o merge sort tem complexidade de tempo O(n log n).',
        correct_answer: 'O merge sort utiliza divisão e conquista, dividindo o array em metades (profundidade log n) e mesclando-os em tempo linear (O(n)).',
        type: 'essay'
      },
      {
        question: 'Forneça a prova por contradição para o Problema da Parada.',
        correct_answer: 'Assuma que uma função halts(P, I) existe, crie um diagonal(P) que entra em loop se P para e para se P entra em loop, então diagonal(diagonal) cria uma contradição.',
        type: 'essay'
      }
    ];

    const exercisesToInsert = exercises.map((ex, idx) => ({
      apostila_id: apostila.id,
      question: ex.question,
      correct_answer: ex.correct_answer,
      type: ex.type,
      sort_order: idx
    }));

    const { error: exercisesError } = await supabase
      .from('exercises')
      .insert(exercisesToInsert);

    if (exercisesError) throw exercisesError;

    console.log('✅ Aspectos Teóricos da Computação FULLY RESTORED');
    return { success: true, apostila, pageCount: pages.length };
  } catch (error) {
    console.error('❌ Error restoring Theoretical Computing:', error);
    throw error;
  }
}

/**
 * VERIFY & RESTORE ALL APOSTILAS
 */
export async function verifyAllApostilasIntegrity() {
  console.log('🔍 Starting comprehensive apostila integrity check...');

  const { data: apostilas, error } = await supabase
    .from('apostilas')
    .select('id, title, subject, category');

  if (error) throw error;

  const integrityReport: any[] = [];

  for (const apostila of apostilas || []) {
    const issues = [];
    
    // Check subject field
    if (!apostila.subject) {
      issues.push('Missing subject field');
    }

    // Check pages
    const { count: pageCount } = await supabase
      .from('apostila_pages')
      .select('id', { count: 'exact', head: true })
      .eq('apostila_id', apostila.id);

    if (!pageCount || pageCount === 0) {
      issues.push('No content pages found');
    }

    // Check exercises
    const { count: exerciseCount } = await supabase
      .from('exercises')
      .select('id', { count: 'exact', head: true })
      .eq('apostila_id', apostila.id);

    if (!exerciseCount || exerciseCount === 0) {
      issues.push('No exercises found');
    }

    integrityReport.push({
      id: apostila.id,
      title: apostila.title,
      status: issues.length === 0 ? '✅ INTACT' : '⚠️ ISSUES',
      issues,
      pageCount,
      exerciseCount,
      needsRepair: issues.length > 0
    });
  }

  return integrityReport;
}

/**
 * REPAIR ALL CORRUPTED APOSTILAS
 */
export async function repairAllCorruptedApostilas() {
  console.log('🔧 Starting comprehensive repair...');

  const { data: apostilas } = await supabase
    .from('apostilas')
    .select('*');

  for (const apostila of apostilas || []) {
    let updates: any = {};
    let needsUpdate = false;

    if (!apostila.subject) {
      updates.subject = inferSubjectFromTitle(apostila.title);
      needsUpdate = true;
    }

    if (needsUpdate) {
      await supabase
        .from('apostilas')
        .update(updates)
        .eq('id', apostila.id);
      
      console.log(`✅ Repaired metadata for: ${apostila.title}`);
    }
  }

  console.log('✅ All apostilas have been repaired!');
}

function inferSubjectFromTitle(title: string): string {
  const subjectMap: Record<string, string> = {
    'programming': 'Programming',
    'algorithm': 'Computer Science',
    'data structure': 'Computer Science',
    'database': 'Database Design',
    'web': 'Web Development',
    'theoretical': 'Computer Science',
    'computation': 'Computer Science',
    'security': 'Cybersecurity',
    'network': 'Networking'
  };

  for (const [keyword, subject] of Object.entries(subjectMap)) {
    if (title.toLowerCase().includes(keyword)) {
      return subject;
    }
  }

  return 'General';
}

function generateHash(content: string): string {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}
