import { supabase } from "../src/integrations/supabase/client";

async function restoreTheoreticalStrict() {
  const apostilaId = "d3a7a3cb-d89a-418a-a084-971e9fa4e896";
  const content = `# Teoria da Computação — Texto Estruturado

## 1. Introdução

A disciplina de Teoria da Computação estuda modelos matemáticos capazes de representar processos computacionais. Esses modelos permitem compreender:

- O que pode ser computado.

- Como uma computação pode ser representada formalmente.

- Quais problemas podem ser resolvidos por algoritmos.

- Quais problemas não possuem solução algorítmica geral.

- Quanto tempo e memória são necessários para resolver um problema.

A disciplina estabelece uma ligação entre os conteúdos de Linguagens Formais e Autômatos, máquinas de estados, máquinas de Turing, computabilidade e complexidade computacional.

---

## 2. Máquinas de estado

### 2.1 Conceito

Uma máquina de estados é um sistema cujo comportamento evolui por meio de uma sequência de estados. A cada instante, a máquina encontra-se em um estado atual, recebe uma entrada e, de acordo com essa entrada, pode permanecer no mesmo estado ou mudar para outro estado.

A evolução pode ser representada por:

\`\`\`text

Estado atual + Entrada → Próximo estado + Saída

\`\`\`

Ou, matematicamente:

\\[

S_T \\xrightarrow{X_T} S_{T+1}

\\]

Onde:

- \`S_T\` é o estado atual.

- \`X_T\` é a entrada no instante \`T\`.

- \`S_{T+1}\` é o próximo estado.

### 2.2 Componentes

Uma máquina de estados possui normalmente:

- Um conjunto de estados.

- Um estado inicial.

- Um conjunto de entradas.

- Uma função de transição.

- Uma função de saída.

- Eventualmente, estados finais.

### 2.3 Estado

O estado representa a situação atual da máquina e pode carregar informações sobre o que já ocorreu durante o processamento.

Em termos intuitivos, o estado funciona como uma forma de memória. Ao observar o estado atual, a máquina pode saber qual comportamento deve executar em seguida.

### 2.4 Transição

A transição é a mudança de um estado para outro. Ela ocorre quando a máquina recebe uma entrada ou executa uma ação determinada pela sua função de transição.

Exemplo:

\`\`\`text

S0 --A--> S1

\`\`\`

Essa representação significa que, estando em \`S0\` e lendo \`A\`, a máquina passa para \`S1\`.

### 2.5 Laço

Um laço ocorre quando a máquina recebe uma entrada e permanece no mesmo estado.

Exemplo:

\`\`\`text

S0 --A--> S0

\`\`\`

Nesse caso, a máquina lê \`A\`, mas continua em \`S0\`.

---

## 3. Representações de máquinas de estado

Uma máquina de estados pode ser representada de três formas principais:

1. Diagrama de transição de estados.

2. Tabela de transição.

3. Equações de transição.

### 3.1 Diagrama de transição

No diagrama:

- Cada estado é representado por um círculo.

- Cada transição é representada por uma seta.

- A entrada aparece sobre a seta.

- O estado inicial é indicado por uma seta que vem de fora do diagrama.

- Estados finais podem ser representados com círculos duplos.

Exemplo:

\`\`\`text

        A

   ┌─────────┐

   │         ▼

  (Q0) ───> (Q1)

\`\`\`

### 3.2 Tabela de transição

A tabela apresenta o estado atual nas linhas e as entradas nas colunas.

| Estado atual | Entrada A | Entrada B | Entrada C |
|---|---|---|---|
| S0 | Próximo estado | Próximo estado | Próximo estado |
| S1 | Próximo estado | Próximo estado | Próximo estado |
| S2 | Próximo estado | Próximo estado | Próximo estado |
| S3 | Próximo estado | Próximo estado | Próximo estado |

Cada célula informa qual será o próximo estado depois da leitura do símbolo correspondente.

### 3.3 Equação de transição

Uma transição de um autômato pode ser representada por:

\\[

\\delta(S_0,A)=S_1

\\]

A interpretação é:

- Estado atual: \`S0\`.

- Símbolo lido: \`A\`.

- Próximo estado: \`S1\`.

---

# 4. Máquinas de Mealy e Moore

As máquinas de estado podem ser classificadas em duas categorias principais:

- Máquinas de Mealy.

- Máquinas de Moore.

A principal diferença está na forma como a saída é determinada.

---

## 5. Máquina de Mealy

### 5.1 Definição

Na máquina de Mealy, a saída depende do estado atual e da entrada recebida.

\\[

Y=\\lambda(S,X)

\\]

Onde:

- \`Y\` é a saída.

- \`S\` é o estado atual.

- \`X\` é a entrada atual.

- \`λ\` é a função de saída.

### 5.2 Exemplo

Suponha que a máquina esteja em \`S0\`:

- Ao receber \`A\`, produz \`P\`.

- Ao receber \`B\`, produz \`Q\`.

Mesmo estando no mesmo estado, entradas diferentes podem gerar saídas diferentes.

### 5.3 Representação no diagrama

Na máquina de Mealy, a entrada e a saída são registradas sobre a transição:

\`\`\`text

S0 -- A/P --> S1

\`\`\`

Isso significa:

- Entrada recebida: \`A\`.

- Saída produzida: \`P\`.

- Próximo estado: \`S1\`.

### 5.4 Característica principal

A saída pode mudar imediatamente quando a entrada muda, mesmo que o estado permaneça o mesmo.

---

## 6. Máquina de Moore

### 6.1 Definição

Na máquina de Moore, a saída depende somente do estado atual.

\\[

Y=\\lambda(S)

\\]

Onde:

- \`Y\` é a saída.

- \`S\` é o estado atual.

- \`λ\` é a função de saída.

### 6.2 Representação

A saída é registrada dentro do círculo do estado:

\`\`\`text

S0/0

S1/1

S2/1

S3/0

\`\`\`

### 6.3 Característica principal

Entradas diferentes podem ser recebidas enquanto a máquina permanece no mesmo estado, mas a saída continua sendo a saída associada àquele estado.

A saída só muda quando a máquina muda de estado para um estado com outra saída.

### 6.4 Quantidade de entradas

Uma máquina de Moore não precisa ter exatamente duas entradas. Ela pode possuir:

- Uma entrada.

- Duas entradas.

- Três entradas.

- Muitas entradas.

O que define a máquina de Moore é a dependência da saída, e não a quantidade de entradas.

---

## 7. Diferença entre Mealy e Moore

| Característica | Mealy | Moore |
|---|---|---|
| Dependência da saída | Estado e entrada | Apenas estado |
| Função de saída | \`Y = λ(S,X)\` | \`Y = λ(S)\` |
| Local da saída | Nas transições | Nos estados |
| Mudança da saída | Pode ocorrer quando a entrada muda | Ocorre quando o estado muda |
| Notação típica | \`A/P\` | \`S0/0\` |

### 7.1 Regra prática

Para identificar o tipo de máquina:

- Se a saída aparece nas setas, a máquina é de Mealy.

- Se a saída aparece dentro dos estados, a máquina é de Moore.

---

# 8. Exemplo completo de máquina de Moore

## 8.1 Estados

A máquina possui quatro estados:

| Estado | Saída |
|---|---:|
| S0 | 0 |
| S1 | 1 |
| S2 | 1 |
| S3 | 0 |

O estado inicial é \`S0\`.

A representação dos estados é:

\`\`\`text

S0/0

S1/1

S2/1

S3/0

\`\`\`

## 8.2 Transições

As transições são:

| Estado atual | Entrada | Próximo estado |
|---|---|---|
| S0 | A | S0 |
| S0 | B | S1 |
| S0 | C | S1 |
| S1 | A | S2 |
| S1 | B | S0 |
| S1 | C | S1 |
| S2 | A | S2 |
| S2 | B | S3 |
| S2 | C | S0 |
| S3 | A | S0 |
| S3 | B | S1 |
| S3 | C | S2 |

## 8.3 Diagrama textual

\`\`\`text

                 A

             ┌───────┐

             │       │

             ▼       │

           (S0/0)────┘

            │  │

          B,C  A

            ▼  ▼

          (S1/1) <──── C ────┐

            │  │              │

            │  A              │

            │  ▼              │

            │ (S2/1) ── A ────┘

            │   │  │

            B   │  C

            ▼   │  ▼

          (S0/0)│ (S3/0)

                │    │

                │    ├── A ──> S0/0

                │    ├── B ──> S1/1

                │    └── C ──> S2/1

                └── B ──> S3/0

\`\`\`

O diagrama textual é apenas uma representação aproximada. Em um desenho formal, cada estado deve ser desenhado como um círculo, e cada transição deve ser indicada por uma seta identificada pela entrada.

## 8.4 Interpretação

Quando a máquina está em \`S0\`:

- A saída é \`0\`.

- Com \`A\`, permanece em \`S0\`.

- Com \`B\` ou \`C\`, vai para \`S1\`.

Quando está em \`S1\`:

- A saída é \`1\`.

- Com \`A\`, vai para \`S2\`.

- Com \`B\`, vai para \`S0\`.

- Com \`C\`, permanece em \`S1\`.

Quando está em \`S2\`:

- A saída é \`1\`.

- Com \`A\`, permanece em \`S2\`.

- Com \`B\`, vai para \`S3\`.

- Com \`C\`, vai para \`S0\`.

Quando está em \`S3\`:

- A saída é \`0\`.

- Com \`A\`, vai para \`S0\`.

- Com \`B\`, vai para \`S1\`.

- Com \`C\`, vai para \`S2\`.

---

# 9. Simulação da máquina de Moore

Para simular uma máquina de Moore, siga estes passos:

1. Comece no estado inicial.

2. Leia a entrada atual.

3. Consulte a transição correspondente.

4. Determine o próximo estado.

5. Observe a saída associada ao estado.

6. Repita o processo para a próxima entrada.

## 9.1 Exemplo

Considere a sequência de entradas:

\`\`\`text

B A B C

\`\`\`

Estado inicial: \`S0\`.

| Tempo | Estado atual | Entrada | Próximo estado | Saída do próximo estado |
|---:|---|---|---|---:|
| 0 | S0 | B | S1 | 1 |
| 1 | S1 | A | S2 | 1 |
| 2 | S2 | B | S3 | 0 |
| 3 | S3 | C | S2 | 1 |

A sequência de estados é:

\`\`\`text

S0 → S1 → S2 → S3 → S2

\`\`\`

A sequência de saídas, considerando a saída após cada transição, é:

\`\`\`text

1, 1, 0, 1

\`\`\`

---

# 10. Máquina de Turing

## 10.1 Contexto histórico

A máquina de Turing foi proposta por Alan Turing como um modelo matemático para representar computações. O modelo ajudou a formalizar a ideia de algoritmo e a estudar os limites da computação.

A máquina de Turing não deve ser entendida apenas como uma máquina física. Ela é principalmente um modelo abstrato, utilizado para definir o que significa executar um procedimento computacional.

## 10.2 Ideia intuitiva

Pode-se imaginar uma folha quadriculada formada por células. Cada célula pode conter um símbolo.

A máquina possui uma cabeça que pode:

- Ler o símbolo da célula atual.

- Escrever um novo símbolo.

- Apagar ou substituir o símbolo existente.

- Mover-se para a direita.

- Mover-se para a esquerda.

- Alterar seu estado.

A computação termina quando a máquina alcança um estado de parada ou estado final.

---

# 11. Fita da máquina de Turing

## 11.1 Funções da fita

A fita da máquina de Turing funciona simultaneamente como:

- Dispositivo de entrada.

- Memória de trabalho.

- Área para resultados.

- Dispositivo de saída.

A entrada é colocada em uma região inicial da fita. As células restantes contêm símbolos brancos.

Exemplo:

\`\`\`text

... | branco | branco | A | B | C | A | branco | branco | ...

                         ▲

                    cabeça

\`\`\`

## 11.2 Fita potencialmente ilimitada

A fita é considerada ilimitada ou suficientemente extensa para a computação. Dessa forma, a máquina não fica limitada pela quantidade inicial de células ocupadas.

O modelo pode permitir expansão para:

- A direita.

- A esquerda.

## 11.3 Cabeça de leitura e gravação

A cabeça aponta para uma célula por vez. A cada passo, ela pode:

1. Ler o símbolo atual.

2. Escrever outro símbolo.

3. Alterar o estado.

4. Mover-se para a esquerda ou direita.

---

# 12. Diferença entre autômatos e máquina de Turing

Nos autômatos tradicionais, a leitura normalmente ocorre da esquerda para a direita, sem alteração dos símbolos já lidos.

Na máquina de Turing:

- A cabeça pode mover-se para a direita e para a esquerda.

- A máquina pode retornar a símbolos anteriores.

- A máquina pode escrever na fita.

- A fita funciona como memória.

- A máquina pode modificar a própria entrada durante o processamento.

Isso torna a máquina de Turing um modelo mais poderoso e geral.

---

# 13. Estados da máquina de Turing

Uma máquina de Turing possui:

- Um conjunto finito de estados.

- Um estado inicial.

- Um ou mais estados finais.

- Estados intermediários.

- Uma função de transição.

A primeira célula da fita pode ser utilizada para indicar o início da entrada. A região inicial contém os símbolos fornecidos à máquina; depois dela aparecem células em branco.

---

# 14. Alfabetos da máquina de Turing

## 14.1 Alfabeto de entrada

O alfabeto de entrada, representado por \`Σ\`, contém os símbolos que podem aparecer nas palavras de entrada.

Exemplo:

\`\`\`text

Σ = {A, B, C}

\`\`\`

Uma entrada possível é:

\`\`\`text

ABCAB

\`\`\`

## 14.2 Alfabeto da fita

O alfabeto da fita, representado por \`Γ\`, contém todos os símbolos que podem aparecer na fita.

Ele pode incluir:

- Símbolos de entrada.

- Símbolos de saída.

- Símbolos de marcação.

- Símbolo branco.

A relação usual é:

\\[

\\Sigma \\subseteq \\Gamma

\\]

## 14.3 Símbolo branco

As células vazias da fita são representadas por um símbolo especial, como:

- \`β\`.

- \`Δ\`.

- \`□\`.

O símbolo exato depende da convenção adotada pelo professor ou pelo simulador.

## 14.4 Marcadores

Os marcadores são utilizados para indicar que um símbolo já foi processado.

Por exemplo, a máquina pode substituir \`A\` por \`B\` para sinalizar que aquele \`A\` já foi lido.

---

# 15. Transição de uma máquina de Turing

A transição de uma máquina de Turing informa cinco elementos:

1. Estado atual.

2. Símbolo lido.

3. Próximo estado.

4. Símbolo escrito.

5. Direção do movimento.

A forma geral é:

\\[

\\delta(q,A)=(p,B,R)

\\]

Interpretação:

- A máquina está no estado \`q\`.

- Lê o símbolo \`A\`.

- Escreve \`B\` no lugar de \`A\`.

- Vai para o estado \`p\`.

- Move a cabeça uma posição para a direita.

Se a direção for para a esquerda:

\\[

\\delta(q,A)=(p,B,L)

\\]

Onde:

- \`R\` significa \`right\`, direita.

- \`L\` significa \`left\`, esquerda.

---

# 16. Exemplo de execução de transição

Considere:

\\[

\\delta(q,A)=(p,B,R)

\\]

Configuração antes da transição:

\`\`\`text

... | C | A | C | branco | ...

          ▲

       estado q

\`\`\`

A máquina:

1. Está no estado \`q\`.

2. Lê \`A\`.

3. Substitui \`A\` por \`B\`.

4. Muda para o estado \`p\`.

5. Move a cabeça para a direita.

Configuração depois da transição:

\`\`\`text

... | C | B | C | branco | ...

              ▲

           estado p

\`\`\`

---

# 17. Formas de representar uma máquina de Turing

Uma máquina de Turing pode ser representada por:

- Diagrama de transição.

- Tabela de transição.

- Função ou equação de transição.

- Configuração instantânea da fita.

- Simulação passo a passo.

## 17.1 Tabela de máquina de Turing

| Estado atual | Símbolo lido | Próximo estado | Símbolo escrito | Movimento |
|---|---|---|---|---|
| q | A | p | B | R |
| p | C | q | C | L |

## 17.2 Configuração instantânea

Uma configuração instantânea registra:

- O conteúdo atual da fita.

- A posição da cabeça.

- O estado atual.

Exemplo:

\`\`\`text

... C B [q, C] A branco ...

\`\`\`

A notação indica que a cabeça está sobre \`C\` e a máquina está no estado \`q\`.

---

# 18. Computabilidade

## 18.1 Conceito

Computabilidade é o estudo dos problemas que podem ou não ser resolvidos por um procedimento algorítmico.

Um problema é computável quando existe uma máquina ou algoritmo capaz de produzir a resposta correta para todas as entradas válidas e terminar sua execução.

## 18.2 Problemas não computáveis

Existem problemas para os quais não há algoritmo geral capaz de produzir uma resposta correta para todos os casos.

Esses problemas são chamados de não computáveis.

## 18.3 Problemas decidíveis

Um problema é decidível quando existe uma máquina de Turing que sempre termina e responde corretamente se a entrada pertence ou não à linguagem analisada.

## 18.4 Problema da parada

O problema da parada pergunta se é possível criar um algoritmo que determine, para qualquer programa e qualquer entrada, se esse programa vai parar ou executar indefinidamente.

Esse problema é um dos principais exemplos de problema indecidível.

---

# 19. Tese de Church-Turing

A tese de Church-Turing relaciona a ideia intuitiva de algoritmo com os modelos formais de computação.

De forma simplificada, ela afirma que todo procedimento efetivamente computável pode ser representado por uma máquina de Turing ou por outro modelo equivalente de computação.

A tese é importante porque fornece uma referência para definir o conceito de computabilidade.

---

# 20. Complexidade computacional

A complexidade computacional estuda os recursos necessários para resolver um problema.

Os principais recursos analisados são:

- Tempo de execução.

- Espaço ou memória.

- Número de operações.

- Crescimento do custo conforme o tamanho da entrada aumenta.

## 20.1 Comportamento assintótico

O comportamento assintótico descreve como o custo de um algoritmo cresce quando a entrada aumenta.

A notação mais comum é a notação \`O\`, chamada de Big-O.

## 20.2 Complexidade logarítmica

\\[

O(\\log n)

\\]

O crescimento é muito lento. Um exemplo típico é a busca binária em uma lista ordenada.

## 20.3 Complexidade linear

\\[

O(n)

\\]

O tempo cresce proporcionalmente ao tamanho da entrada.

## 20.4 Complexidade quadrática

\\[

O(n^2)

\\]

O tempo cresce aproximadamente com o quadrado do tamanho da entrada. É comum em algoritmos que utilizam dois laços aninhados.

## 20.5 Complexidade polinomial

Uma complexidade polinomial possui a forma geral:

\\[

O(n^k)

\\]

Onde \`k\` é uma constante.

## 20.6 Complexidade exponencial

\\[

O(2^n)

\\]

O custo cresce rapidamente conforme \`n\` aumenta.

## 20.7 Complexidade fatorial

\\[

O(n!)

\\]

O crescimento é ainda mais rápido e aparece em problemas que analisam todas as permutações possíveis.

---

# 21. Classes de problemas

A disciplina apresenta classes utilizadas para organizar problemas segundo sua dificuldade computacional.

Entre os assuntos previstos estão:

- Classe P.

- Classe NP.

- Problemas NP-completos.

- Reduções entre problemas.

- Problemas de otimização.

- Problemas de decisão.

## 21.1 Problemas em P

São problemas que podem ser resolvidos em tempo polinomial por uma máquina determinística.

## 21.2 Problemas em NP

São problemas cujas soluções podem ser verificadas em tempo polinomial, mesmo que encontrar a solução possa ser difícil.

## 21.3 NP-completude

Um problema é NP-completo quando:

1. Pertence à classe NP.

2. É pelo menos tão difícil quanto qualquer problema de NP, por meio de reduções apropriadas.

---

# 22. Problemas clássicos

A disciplina menciona problemas importantes da computação teórica e da otimização, tais como:

- Problema da parada.

- Problemas em grafos.

- Fluxo em redes.

- Caminhos em grafos.

- Cobertura de vértices.

- Problema da mochila.

- Satisfatibilidade booleana.

- Problemas de decisão.

- Problemas de otimização.

---

# 23. Objetivos da disciplina

Ao final da disciplina, espera-se que o estudante consiga:

- Compreender modelos formais de computação.

- Explicar o funcionamento de autômatos e máquinas de Turing.

- Representar máquinas por diagramas, tabelas e equações.

- Diferenciar máquinas de Mealy e Moore.

- Identificar problemas computáveis e não computáveis.

- Compreender a tese de Church-Turing.

- Entender o problema da parada.

- Analisar o crescimento do custo de algoritmos.

- Conhecer classes como P e NP.

- Reconhecer problemas NP-completos.

---

# 24. Avaliação e materiais

A disciplina utiliza:

- Aulas expositivas.

- Microsoft Teams como repositório.

- Artigos.

- Vídeos.

- Informações complementares.

- Listas de exercícios.

- Simuladores de máquinas de Turing.

- Avaliações periódicas.

As listas podem conter regras específicas sobre:

- Uso de simuladores.

- Materiais permitidos.

- Formato da resposta.

- Datas de entrega.

- Critérios de correção.

---

# 25. Resumo conceitual

## Máquinas de estado

São sistemas que evoluem entre estados por meio de transições provocadas por entradas.

## Máquina de Mealy

A saída depende do estado e da entrada:

\\[

Y=\\lambda(S,X)

\\]

## Máquina de Moore

A saída depende somente do estado:

\\[

Y=\\lambda(S)

\\]

## Máquina de Turing

É um modelo formal de computação com:

- Estados.

- Fita.

- Cabeça de leitura e gravação.

- Leitura e escrita de símbolos.

- Movimentos para a esquerda e para a direita.

- Estados inicial e final.

## Computabilidade

Estuda quais problemas podem ser resolvidos por algoritmos.

## Complexidade

Estuda a quantidade de recursos necessária para resolver os problemas.

---

# 26. Fórmulas essenciais

## Máquina de Mealy

\\[

Y=\\lambda(S,X)

\\]

## Máquina de Moore

\\[

Y=\\lambda(S)

\\]

## Transição de autômato

\\[

\\delta(S,A)=S'

\\]

## Transição de máquina de Turing

\\[

\\delta(q,A)=(p,B,R)

\\]

## Movimento para a esquerda

\\[

\\delta(q,A)=(p,B,L)

\\]

## Complexidade logarítmica

\\[

O(\\log n)

\\]

## Complexidade linear

\\[

O(n)

\\]

## Complexidade quadrática

\\[

O(n^2)

\\]

## Complexidade exponencial

\\[

O(2^n)

\\]

## Complexidade fatorial

\\[

O(n!)

\\]
`;

  console.log("Iniciando restauração da apostila 'Aspectos Teóricos da Computação'...");

  // Atualiza a primeira página da apostila
  const { data: pages, error: fetchError } = await supabase
    .from("apostila_pages")
    .select("id")
    .eq("apostila_id", apostilaId)
    .order("position", { ascending: true })
    .limit(1);

  if (fetchError || !pages || pages.length === 0) {
    console.error("Erro ao buscar página ou página não encontrada:", fetchError);
    return;
  }

  const pageId = pages[0].id;
  const { error: updateError } = await supabase
    .from("apostila_pages")
    .update({ content })
    .eq("id", pageId);

  if (updateError) {
    console.error("Erro ao atualizar conteúdo da página:", updateError);
  } else {
    console.log("Conteúdo estruturado injetado com sucesso na página:", pageId);
  }
}

restoreTheoreticalStrict();
