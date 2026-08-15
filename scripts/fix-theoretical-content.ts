import { supabase } from "../src/integrations/supabase/client";

const THEORETICAL_CONTENT = `# Teoria da Computação — Texto Estruturado

## 1. Introdução

A disciplina de Teoria da Computação estuda modelos matemáticos capazes de representar processos computacionais. Esses modelos permitem compreender:

- O que pode ser computado.
- Como uma computação pode ser representada formalmente.
- Quais problemas podem ser resolvidos por algoritmos.
- Quais problemas não possuem solução algorítmica geral.
- Quanto tempo e memória são necessários para resolver um problema.

---

## 2. Máquinas de estado

### 2.1 Conceito

Uma máquina de estados é um sistema cujo comportamento evolui por meio de uma sequência de estados. A cada instante, a máquina encontra-se em um estado atual, recebe uma entrada e, de acordo com essa entrada, pode permanecer no mesmo estado ou mudar para outro estado.

A evolução pode ser representada por:
\`\`\`text
Estado atual + Entrada → Próximo estado + Saída
\`\`\`

### 2.2 Componentes
Uma máquina de estados possui normalmente:
- Um conjunto de estados.
- Um estado inicial.
- Um conjunto de entradas.
- Uma função de transição.
- Uma função de saída.

---

## 3. Máquinas de Mealy e Moore

- **Máquina de Mealy**: A saída depende do estado atual e da entrada recebida.
- **Máquina de Moore**: A saída depende somente do estado atual.

---

## 4. Máquina de Turing

A máquina de Turing é um modelo abstrato que define o que significa "computar". Ela consiste em uma fita infinita, uma cabeça de leitura/escrita e um conjunto de estados.

---

## 5. Áudio e Vídeo Aula: A Mente das Máquinas

Nesta seção, exploramos como robôs e videogames processam informações através da teoria de autômatos.

<audio-quiz 
  audio-src="https://gynguskgysompgcajunc.supabase.co/storage/v1/object/public/material-media/theoretical-intro.mp3"
  title="Como os robôs e videogames pensam"
  description="Uma jornada pela lógica dos autômatos e máquinas de estados."
></audio-quiz>

![Guia Visual HD - Máquinas de Turing](https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=1000)
`;

async function fixContent() {
  console.log("Iniciando correção de conteúdo...");
  
  const { data, error } = await supabase
    .from('apostila_pages')
    .update({ content: THEORETICAL_CONTENT })
    .eq('id', '4d6771a6-3aff-4e41-a83d-cb84aea1f115');

  if (error) {
    console.error("Erro ao atualizar página:", error);
  } else {
    console.log("Conteúdo da página principal atualizado com sucesso.");
  }

  // Garantir que a apostila esteja publicada
  const { error: apostilaError } = await supabase
    .from('apostilas')
    .update({ published: true })
    .eq('id', 'd3a7a3cb-d89a-418a-a084-971e9fa4e896');

  if (apostilaError) {
    console.error("Erro ao publicar apostila:", apostilaError);
  } else {
    console.log("Apostila marcada como publicada.");
  }
}

fixContent().catch(console.error);
