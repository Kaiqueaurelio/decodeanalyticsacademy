with last_pos as (
  select coalesce(max(position), -1) as pos 
  from public.apostila_pages 
  where apostila_id = '955b811b-c633-474e-8322-4167e55dfed7'
)
insert into public.apostila_pages (apostila_id, title, content, position)
values (
  '955b811b-c633-474e-8322-4167e55dfed7',
  'Aprendendo Shell Script',
  'Aprendendo Shell Script (explicado bem fácil!)

Imagine que o computador é tipo um robô que só entende ordens escritas de um jeito especial. O Shell Script é uma receita de bolo cheia de comandos que a gente escreve para o robô (o Linux) seguir sozinho, um passo depois do outro.

1. Onde a gente escreve isso?

Usamos um caderno de receitas chamado Jupyter (no Google Colab).

Ele tem quadradinhos chamados células: podem ser de texto (para explicações) ou de código (para comandos).

O Jupyter entende um jeito de escrever chamado Markdown — o mesmo formato que a inteligência artificial usa para escrever bonito (negrito, listas, etc).

2. Criando o primeiro arquivo

O comando %%writefile hello funciona como uma impressora mágica: tudo que está escrito depois dele vira um arquivo de verdade dentro do computador, chamado hello.

Podemos até chamar de hello.sh (o .sh é só um apelido que avisa isso aqui é um shell script), mas o nome do arquivo, sozinho, não é o que manda — é o conteúdo de dentro que importa!

A primeira linha é mágica: #!/bin/bash

Pense nela como uma etiqueta de identificação.

Ela diz para o Linux: Ei, use o programa Bash para ler as instruções que vêm depois de mim!

Se a etiqueta estiver errada (ex: pedir um programa que não existe), o Linux vai reclamar e dizer que não encontrou esse tradutor.

É parecido com quando um PDF tem uma marquinha escondida no começo dizendo eu sou um PDF!.

As outras linhas com #

Se o # aparecer em qualquer outra linha (não a primeira), ele é só um comentário — uma anotação que o computador ignora, feita para os humanos lerem.

3. Dando permissão para o arquivo rodar

Criar o arquivo não é suficiente — é preciso dar permissão para ele ser executado, com o comando chmod.

chmod +x hello -> adiciona (+) a permissão de execução (x) para todo mundo poder rodar.

Outras letrinhas de permissão:

r = ler (read)

w = escrever (write)

x = executar (execute)

Sem essa permissão, o Linux te bloqueia dizendo permissão negada — tipo um cadeado!

4. Mandando o robô falar: o comando echo

echo "Oi, mundo!" -> manda o computador imprimir o texto na tela.

Se o texto tiver espaço em branco, é obrigatório usar aspas.

Se não tiver espaço, as aspas são opcionais.

5. Guardando coisas: as variáveis

Uma variável é tipo uma caixinha com nome, onde guardamos um valor.

Para criar: nome="Ana" (sem espaço antes/depois do =!).

Para usar o valor guardado, é preciso colocar um cifrão ($) na frente: echo $nome.

Sem o $, o computador acha que você está falando do nome da caixinha, não do que tem dentro dela!

Segredo importante: no Shell Script, TUDO é texto!

Mesmo números são guardados como texto.

Mas dá para somar, subtrair etc.! O computador transforma o texto em número escondido, faz a conta, e devolve como texto de novo — tudo automático.

6. Fazendo continhas

Para o computador entender que é para calcular (e não só juntar textos), usamos parênteses duplos: $((a + b)).

Dentro dos parênteses duplos dá para fazer:

Soma

Subtração

Multiplicação

Divisão

Resto da divisão (módulo)

Atenção: o Shell Script só sabe trabalhar com números inteiros (sem vírgula)!

Para contas com vírgula (números quebrados), é preciso pedir ajuda para um programa externo, que faz a conta e devolve o resultado prontinho.

7. Desafio: calcular a média ponderada

A turma tentou criar um script para:

Guardar 3 notas em variáveis (n1, n2, n3).

Multiplicar cada nota pelo seu peso (peso 1, peso 2, peso 3).

Somar tudo e dividir para achar a média ponderada.

Mostrar o resultado com echo.

Dica de quem já sabe o segredo: lembre de usar $((...)) para fazer a conta valer, e $nome_da_variavel para abrir a caixinha e pegar o valor guardado!

Resumo rápido (tipo bilhete na geladeira)

- %%writefile nome: Cria um arquivo com o texto de baixo
- #!/bin/bash: Diz qual tradutor vai ler o script
- # (fora da 1ª linha): Comentário (o Linux ignora)
- chmod +x arquivo: Dá permissão para executar
- echo "texto": Imprime um texto na tela
- variavel="valor": Guarda um valor numa caixinha
- $variavel: Usa o valor guardado na caixinha
- $((conta)): Faz o computador calcular de verdade',
  (select pos + 1 from last_pos)
)
returning id;
