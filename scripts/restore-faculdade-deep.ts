import { supabase } from "../src/lib/content-recovery/recovery-client";

const FACULDADE_CONTENT = [
  {
    title: "Redes de Computadores",
    subject: "Ciência da Computação",
    semester: 5,
    chapters: [
      {
        title: "Capítulo 1: Introdução às Redes",
        content: `## Fundamentos de Redes
Redes de computadores são sistemas de objetos interconectados que trocam dados.
![Redes](https://images.unsplash.com/photo-1544197150-b99a580bb7a8?q=80&w=1000)
### Modelos de Referência:
- **OSI**: 7 camadas.
- **TCP/IP**: 4 camadas.
<audio src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" controls></audio>`,
        order: 1
      },
      {
        title: "Capítulo 2: Camada de Aplicação",
        content: `## Protocolos de Aplicação
HTTP, DNS, SMTP e FTP operam nesta camada.
![Internet](https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1000)`,
        order: 2
      }
    ],
    exercises: [
      { question: "Qual a diferença entre o modelo OSI e TCP/IP?", correct_answer: "O modelo OSI tem 7 camadas e o TCP/IP tem 4.", type: "essay" }
    ]
  },
  {
    title: "Inteligência Artificial",
    subject: "Ciência da Computação",
    semester: 5,
    chapters: [
      {
        title: "Capítulo 1: O que é IA?",
        content: `## Definição de IA
IA é o campo da computação que busca simular a inteligência humana em máquinas.
![IA](https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=1000)
### Áreas da IA:
- Machine Learning
- NLP
- Visão Computacional`,
        order: 1
      }
    ],
    exercises: [
      { question: "O que é o Teste de Turing?", correct_answer: "Um teste para determinar se uma máquina pode exibir comportamento inteligente equivalente ao de um humano.", type: "essay" }
    ]
  },
  {
     title: "Sistemas Operacionais",
     subject: "Ciência da Computação",
     semester: 5,
     chapters: [
       {
         title: "Capítulo 1: Gerenciamento de Processos",
         content: `## Processos e Threads
Um processo é um programa em execução. Uma thread é a menor unidade de processamento.
![CPU](https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?q=80&w=1000)`,
         order: 1
       }
     ],
     exercises: [
       { question: "O que é Deadlock?", correct_answer: "Uma situação onde dois ou mais processos ficam bloqueados esperando um pelo outro.", type: "essay" }
     ]
  }
];

async function runRestoration() {
  console.log("🚀 Iniciando restauração profunda de Faculdade...");

  for (const item of FACULDADE_CONTENT) {
    console.log(`\n📄 Restaurando: ${item.title}`);
    
    // 1. Buscar apostila existente (mesmo com ID diferente ou General)
    const { data: existing } = await supabase
      .from('apostilas')
      .select('id')
      .or(`title.ilike.%${item.title}%,subject.ilike.%${item.title}%`)
      .limit(1)
      .single();

    let apostilaId;

    if (existing) {
      apostilaId = existing.id;
      console.log(`Found existing ID: ${apostilaId}. Updating metadata...`);
      const { error: updateError } = await supabase.from('apostilas').update({
        subject: item.subject,
        category: item.subject,
        semester: item.semester,
        published: true
      }).eq('id', apostilaId);
      
      if (updateError) console.error(`Error updating ${item.title}:`, updateError);

      await supabase.from('apostila_pages').delete().eq('apostila_id', apostilaId);
      await supabase.from('exercises').delete().eq('apostila_id', apostilaId);
    } else {
      console.log(`Creating new apostila entry for: ${item.title}`);
      const { data: newApostila, error: insertError } = await supabase.from('apostilas').insert({
        title: item.title,
        subject: item.subject,
        category: item.subject,
        semester: item.semester,
        published: true,
        cover_url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1000'
      }).select().single();
      
      if (insertError) {
        console.error(`Error inserting ${item.title}:`, insertError);
        continue;
      }
      apostilaId = newApostila.id;
    }

    // 2. Inserir Capítulos
    console.log(`Inserting ${item.chapters.length} chapters...`);
    await supabase.from('apostila_pages').insert(
      item.chapters.map(c => ({
        apostila_id: apostilaId,
        title: c.title,
        content: c.content,
        position: c.order
      }))
    );

    // 3. Inserir Exercícios
    console.log(`Inserting ${item.exercises.length} exercises...`);
    await supabase.from('exercises').insert(
      item.exercises.map((e, idx) => ({
        apostila_id: apostilaId,
        question: e.question,
        correct_answer: e.correct_answer,
        type: e.type,
        sort_order: idx
      }))
    );
  }

  console.log("\n✅ Restauração de Faculdade concluída com sucesso!");
}

runRestoration().catch(console.error);
