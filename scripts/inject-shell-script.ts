import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;

const targetApostilaId = "955b811b-c633-474e-8322-4167e55dfed7"; // Sistemas Operacionais e Mobile (S6)

const shellScriptContent = `
# Aprendendo Shell Script

Shell script é uma linguagem de script usada para automatizar tarefas em sistemas operacionais baseados em Unix/Linux.

## Introdução
O Bash (Bourne Again SHell) é o shell padrão na maioria das distribuições Linux.

### Primeiro Script
\`\`\`bash
#!/bin/bash
echo "Olá, Mundo!"
\`\`\`

---

## Resolução do Desafio (Aula 1)

Antes de avançar para a próxima aula, vamos resolver os exercícios propostos no final da Aula 1, usando os métodos de avaliação aritmética já vistos ((( )) e $(( ))).

1. Calcular e mostrar a metade de um número qualquer informado pelo usuário

\`\`\`bash
%%writefile desafio1
#!/bin/bash
read -p "Digite um número: " num
metade=$(( num / 2 ))
echo "A metade de $num é $metade"
\`\`\`

\`\`\`bash
!chmod +x desafio1
!./desafio1
Digite um número: 10
A metade de 10 é 5
\`\`\`

Observação: como o bash só trabalha com inteiros, se o número for ímpar o resultado vem arredondado para baixo (ex.: metade de 7 = 3). Se quiser o valor exato, com casas decimais, é preciso usar o bc, como veremos adiante.

2. Ler três números quaisquer e mostrar o resultado da soma

\`\`\`bash
%%writefile desafio2
#!/bin/bash
read -p "Digite o primeiro número: " n1
read -p "Digite o segundo número: " n2
read -p "Digite o terceiro número: " n3

soma=$(( n1 + n2 + n3 ))
echo "A soma de $n1, $n2 e $n3 é $soma"
\`\`\`

\`\`\`bash
!chmod +x desafio2
!./desafio2
Digite o primeiro número: 4
Digite o segundo número: 5
Digite o terceiro número: 6
A soma de 4, 5 e 6 é 15
\`\`\`

3. Ler quatro números quaisquer e mostrar o resultado da média

\`\`\`bash
%%writefile desafio3
#!/bin/bash
read -p "Digite o 1º número: " n1
read -p "Digite o 2º número: " n2
read -p "Digite o 3º número: " n3
read -p "Digite o 4º número: " n4

# usando bc para obter casas decimais na média
media=$(echo "scale=2; ($n1 + $n2 + $n3 + $n4) / 4" | bc)
echo "A média entre $n1, $n2, $n3 e $n4 é $media"
\`\`\`

\`\`\`bash
!chmod +x desafio3
!./desafio3
Digite o 1º número: 7
Digite o 2º número: 8
Digite o 3º número: 5
Digite o 4º número: 10
A média entre 7, 8, 5 e 10 é 7.50
\`\`\`

4. Calcular a área de um retângulo

\`\`\`bash
%%writefile desafio4
#!/bin/bash
read -p "Digite a base do retângulo: " base
read -p "Digite a altura do retângulo: " altura

area=$(( base * altura ))
echo "A área do retângulo é $area"
\`\`\`

\`\`\`bash
!chmod +x desafio4
!./desafio4
Digite a base do retângulo: 5
Digite a altura do retângulo: 3
A área do retângulo é 15
\`\`\`

5. Calcular a área de um círculo

Como a fórmula da área do círculo (π × r²) envolve casas decimais, usamos o bc, do mesmo jeito que fizemos no var7 da Aula 1.

\`\`\`bash
%%writefile desafio5
#!/bin/bash
read -p "Digite o raio do círculo: " raio

area=$(echo "scale=2; 3.14159 * ($raio * $raio)" | bc)
echo "A área do círculo é $area"
\`\`\`

\`\`\`bash
!chmod +x desafio5
!./desafio5
Digite o raio do círculo: 4
A área do círculo é 50.26
\`\`\`

---

## Aula 2 - Estruturas Condicionais

### Introdução

Até agora nossos scripts seguiam sempre um caminho único, de cima para baixo. Mas, assim como em qualquer linguagem de programação, muitas vezes precisamos que o script tome decisões: só executar um bloco de comandos se uma condição for verdadeira, ou escolher entre dois ou mais caminhos possíveis.

No shell script isso é feito com o comando if.

### A estrutura básica do if

\`\`\`bash
if [ condição ]
then
    comando(s)
fi
\`\`\`

then marca o início do bloco que roda se a condição for verdadeira.

fi (o if escrito ao contrário) marca o fim do bloco condicional — todo if precisa ser fechado com um fi.

Repare nos espaços dentro dos colchetes [ ]: eles são obrigatórios! [condição] (sem espaço) dá erro.

### Exemplo simples

\`\`\`bash
%%writefile if1
#!/bin/bash
read -p "Digite um número: " num

if [ $num -gt 10 ]
then
    echo "O número $num é maior que 10"
fi
\`\`\`

\`\`\`bash
!chmod +x if1
!./if1
Digite um número: 15
O número 15 é maior que 10
\`\`\`

### Operadores usados dentro do [ ]

Como as variáveis em shell script são textos, o bash usa operadores em forma de texto (e não os símbolos >, <, == diretamente) para comparar números dentro de colchetes simples:

Operador | Significado
---|---
-eq | igual (equal)
-ne | diferente (not equal)
-gt | maior (greater than)
-ge | maior ou igual
-lt | menor (less than)
-le | menor ou igual

Já para comparar textos/strings, usamos = (igual) e != (diferente) diretamente.

### if / else

Quando queremos executar um bloco se a condição for verdadeira e outro bloco diferente caso seja falsa:

\`\`\`bash
if [ condição ]
then
    comando(s) se verdadeiro
else
    comando(s) se falso
fi
\`\`\`

### Exemplo: par ou ímpar

\`\`\`bash
%%writefile if2
#!/bin/bash
read -p "Digite um número: " num

if [ $(( num % 2 )) -eq 0 ]
then
    echo "$num é par"
else
    echo "$num é ímpar"
fi
\`\`\`

\`\`\`bash
!chmod +x if2
!./if2
Digite um número: 7
7 é ímpar
\`\`\`

### if / elif / else

Para testar várias condições em sequência, usamos elif (contração de "else if"):

\`\`\`bash
if [ condição1 ]
then
    comando(s)
elif [ condição2 ]
then
    comando(s)
else
    comando(s)
fi
\`\`\`

### Exemplo: classificando uma nota

\`\`\`bash
%%writefile if3
#!/bin/bash
read -p "Digite sua nota (0 a 10): " nota

if [ $nota -ge 7 ]
then
    echo "Aprovado"
elif [ $nota -ge 5 ]
then
    echo "Recuperação"
else
    echo "Reprovado"
fi
\`\`\`

\`\`\`bash
!chmod +x if3
!./if3
Digite sua nota (0 a 10): 6
Recuperação
\`\`\`

### Operadores lógicos dentro do if

Podemos combinar mais de uma condição usando && (E lógico) e || (OU lógico):

\`\`\`bash
%%writefile if4
#!/bin/bash
read -p "Digite sua idade: " idade

if [ $idade -ge 18 ] && [ $idade -le 65 ]
then
    echo "Você está na faixa etária economicamente ativa"
else
    echo "Fora da faixa considerada"
fi
\`\`\`

\`\`\`bash
!chmod +x if4
!./if4
Digite sua idade: 30
Você está na faixa etária economicamente ativa
\`\`\`

### O comando case

Quando temos muitas opções para comparar com uma mesma variável, o if/elif/elif/elif... fica repetitivo. Nesses casos, o case é mais elegante:

\`\`\`bash
case $variavel in
    padrao1)
        comando(s)
        ;;
    padrao2)
        comando(s)
        ;;
    *)
        comando(s) padrão
        ;;
esac
\`\`\`

esac é o case escrito ao contrário — fecha a estrutura.

Cada opção termina com ;;.

*) funciona como o "senão" — captura qualquer valor que não bateu com os padrões anteriores.

### Exemplo: menu simples

\`\`\`bash
%%writefile case1
#!/bin/bash
read -p "Digite uma opção (1-Somar, 2-Subtrair, 3-Sair): " opcao

case $opcao in
    1)
        echo "Você escolheu Somar"
        ;;
    2)
        echo "Você escolheu Subtrair"
        ;;
    3)
        echo "Saindo..."
        ;;
    *)
        echo "Opção inválida"
        ;;
esac
\`\`\`

\`\`\`bash
!chmod +x case1
!./case1
Digite uma opção (1-Somar, 2-Subtrair, 3-Sair): 2
Você escolheu Subtrair
\`\`\`

### Desafio - Aula 2

1. Ler um número e informar se ele é positivo, negativo ou zero.
2. Ler três números e mostrar qual deles é o maior.
3. Ler a idade de uma pessoa e classificar em: criança (0-12), adolescente (13-17), adulto (18-59) ou idoso (60+).
4. Fazer um script com case que simule uma calculadora simples (some, subtraia, multiplique ou divida dois números, conforme a opção escolhida pelo usuário).
5. Ler um caractere e informar, usando case, se é uma vogal ou consoante.
`;

async function main() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  const { data: { user }, error: authError } = await supabase.auth.signInWithPassword({ email, password });
  if (authError) throw authError;

  console.log("Authenticated as:", user.email);

  // Check if Shell Script page already exists in this apostila
  const { data: existingPages, error: fetchError } = await supabase
    .from('apostila_pages')
    .select('id, title, position')
    .eq('apostila_id', targetApostilaId)
    .ilike('title', '%Shell Script%');

  if (fetchError) throw fetchError;

  if (existingPages && existingPages.length > 0) {
    console.log("Found existing Shell Script page(s). Updating the first one...");
    const { error: updateError } = await supabase
      .from('apostila_pages')
      .update({ 
        content: shellScriptContent,
        updated_at: new Date().toISOString()
      })
      .eq('id', existingPages[0].id);
    
    if (updateError) throw updateError;
    console.log("Updated page:", existingPages[0].id);
  } else {
    console.log("Shell Script page not found. Creating new one...");
    
    // Get max position
    const { data: maxPosData } = await supabase
      .from('apostila_pages')
      .select('position')
      .eq('apostila_id', targetApostilaId)
      .order('position', { ascending: false })
      .limit(1);
    
    const nextPos = (maxPosData?.[0]?.position || 0) + 1;

    const { data: newPage, error: insertError } = await supabase
      .from('apostila_pages')
      .insert({
        apostila_id: targetApostilaId,
        title: "Aprendendo Shell Script",
        content: shellScriptContent,
        position: nextPos,
        created_by: user.id
      })
      .select();

    if (insertError) throw insertError;
    console.log("Created page:", newPage[0].id);
  }

  // Ensure the apostila is published and visible
  const { error: apostilaError } = await supabase
    .from('apostilas')
    .update({ 
      published: true, 
      liberada: true, 
      semester: 6 // Ensure it stays in S6
    })
    .eq('id', targetApostilaId);
    
  if (apostilaError) throw apostilaError;
  console.log("Apostila visibility ensured.");
}

main().catch(console.error);
