-- Adiciona a apostila de revisão da disciplina de Processamento de Imagem e Visão Computacional.
-- A operação é idempotente: reutiliza a apostila existente da disciplina quando encontrada.
DO $migration$
DECLARE
  v_apostila_id UUID;
  v_content TEXT := $pdi_content$
Apostila de Revisão — NP1

Processamento Digital de Imagens e Visão Computacional

Material de estudo revisado a partir das Aulas 0, 1, 2, 3 e 4.


Objetivo. Apresentar os fundamentos de processamento digital de imagens de forma organizada, explicativa e orientada à resolução de questões. O material reúne conceitos, fórmulas, comparações, exemplos, exercícios e uma revisão final.

Como usar esta apostila

Faça uma primeira leitura para entender a sequência dos assuntos. Em seguida, revise os pontos-chave, resolva os exercícios sem consultar as respostas e use a revisão de emergência na véspera ou pouco antes da prova. Em questões numéricas, identifique primeiro o tipo de problema e só depois escolha a fórmula.


Regra de ouro: não memorize apenas fórmulas. Entenda o significado de cada termo e o problema que cada técnica resolve. A prova pode alterar os números, mas a lógica permanece.

Sumário

•
Parte I — Fundamentos do processamento digital de imagens: formação da imagem, percepção visual, cores e visão artificial.

•
Parte II — Imagens digitais e aquisição: representação matricial, amostragem, quantização, resolução, sensores e formatos.

•
Parte III — Domínio espacial e operações: transformações, operações aritméticas e lógicas, vizinhanças e distâncias.

•
Parte IV — Filtragem e detecção: filtros espaciais, correlação, convolução e operadores de borda.

•
Parte V — Comparações essenciais: síntese dos conceitos que mais costumam ser confundidos.

•
Parte VI — Exercícios de revisão: questões conceituais e numéricas com orientação de resolução.

•
Parte VII — Pegadinhas de prova: erros comuns e como evitá-los.

•
Parte VIII — Guia de estudo para a NP1: fórmulas, checklists e reconhecimento de enunciados.

•
Parte IX — Mapa mental e revisão final: visão geral do conteúdo e resumo de emergência.




Mapa da disciplina apresentado na Aula 0

A Aula 0 apresenta a organização geral da disciplina. Ela divide o conteúdo em módulos que vão dos fundamentos de processamento de imagens até visão computacional, aprendizado profundo e desenvolvimento de projetos.

Módulo 1 — Introdução ao Processamento de Imagem e Visão Computacional

•
Terminologia e conceitos básicos

•
Percepção visual: sistema biológico x computacional

•
Imagens e características

Módulo 2 — Fundamentos de imagens digitais

•
Fontes de dados

•
Canais de imagem

•
RGB e HSV

•
Resolução, cores e formatos

Módulo 3 — Manipulação matricial

•
Representação em matriz

•
Coordenadas

•
Manipulação de pixels

•
ROI (Region of Interest)

•
Variação de canais

Módulo 4 — Técnicas de pré-processamento

•
Rotação

•
Histograma de cores

•
Operações aritméticas

•
Transformações geométricas

•
Ruído

•
Escala de cinza

Módulo 5 — Métodos de filtragem

•
Média

•
Gaussiana

•
Mediana

•
Filtro bilateral

Módulo 6 — Detecção de bordas

•
Sobel

•
Operador laplaciano

•
Máscara de desaguçamento

•
Canny

Módulo 7 — Operações morfológicas

•
Elemento estruturante

•
Erosão e dilatação

•
Abertura e fechamento

•
Gradiente morfológico

•
Top Hat

Módulo 8 — Segmentação

•
Detecção de descontinuidades

•
Detecção de similaridades

Módulo 9 — Extração de características

•
Redução de dimensionalidade

•
Maldição da dimensionalidade

•
Segmentação no espaço de atributos

•
PCA

•
LDA

Módulo 10 — Reconhecimento de padrões

•
K-Vizinhos Mais Próximos

•
Haar Cascade

Módulo 11 — Aprendizado profundo

•
Redes neurais convolucionais

•
Convolução

•
Pooling

•
Flatten

•
Funções de ativação

Módulo 12 — Tecnologias e projetos de Visão Computacional

•
Planejamento

•
Desafios

•
Desenvolvimento

•
Implantação

•
Reconhecimento facial

•
Segmentação de objetos

•
Plataformas, bibliotecas e linguagens.


Observação: a Aula 0 apresenta esse mapa geral. Os arquivos seguintes desenvolvem em profundidade principalmente os fundamentos, digitalização, domínio espacial, operações e filtragem. Não foram inventados detalhes dos módulos posteriores que não estejam desenvolvidos nos slides fornecidos.




PARTE I — FUNDAMENTOS DO PROCESSAMENTO DIGITAL DE IMAGENS

1. O que é uma imagem para um computador?

1.1 A diferença entre o olho humano e o computador

Uma pessoa olha uma fotografia e enxerga imediatamente uma pessoa, uma rua, uma árvore ou um objeto. O cérebro humano processa a imagem de forma paralela e extremamente rápida, reconhecendo padrões, cores, texturas e formas sem esforço consciente.

Para o computador, entretanto, a imagem precisa ser representada por valores numéricos. O computador não "vê" uma pessoa ou uma árvore; ele vê uma matriz de números. Cada número representa a intensidade de luz (ou a cor) em uma posição específica da imagem.

A ideia central do Processamento Digital de Imagens (PDI) é trabalhar matematicamente sobre esses valores. Quando alteramos esses números de forma organizada, estamos processando a imagem.

1.2 Definição de Processamento Digital de Imagens

Os slides definem o processamento de uma imagem como o uso de operações matemáticas para alterar os valores dos pixels de uma ou mais imagens.

Esses processos podem ter dois grandes objetivos:

1.
Melhorar a imagem para que o observador veja melhor — por exemplo, aumentar o contraste de uma foto escura, remover ruído de uma imagem médica ou corrigir a iluminação de uma foto.

2.
Preparar a imagem para ser analisada pelo próprio computador — por exemplo, segmentar objetos, detectar bordas, extrair características para um sistema de reconhecimento automático.

Explicando como para uma criança

Imagine que a imagem é um enorme mosaico. Cada pedacinho desse mosaico é um pixel. O computador pode olhar para cada pedacinho e mudar o número que representa sua intensidade ou cor. Quando muitos pedacinhos mudam juntos, a imagem inteira muda.

Se você tem um mosaico de 1000 pecinhas e muda a cor de 500 delas, a imagem muda completamente. Se muda apenas 10, a mudança é sutil. O processamento digital de imagens é a arte de decidir quais pecinhas mudar e para quais valores, para atingir um objetivo específico.

1.3 Para que o PDI é usado?

Os slides citam aplicações como:

•
Automação e visão artificial: robôs industriais que inspecionam peças em uma linha de montagem.

•
Reconhecimento de caracteres: ler placas de carro, códigos de barras, textos digitalizados.

•
Análise de cromossomos: cariotipagem automatizada em exames médicos.

•
Veículos autônomos: carros que "enxergam" o ambiente para navegar.

•
Mapeamento de terrenos: satélites que geram mapas de relevo e uso do solo.

•
Detecção de alvos: sistemas militares e de vigilância.

•
Tomografia computadorizada: reconstrução de imagens internas do corpo.

•
Ultrassonografia: imagens de fetos, órgãos e tecidos.

•
Inspeção industrial: detecção de defeitos em produtos.

•
Análise de imagens de satélites: monitoramento ambiental, agrícola e urbano.

Ideia-chave: PDI não é somente "embelezar uma foto". Ele também prepara a imagem para que uma máquina consiga extrair informação dela. É a base da Visão Computacional.

1.4 A diferença entre PDI e Visão Computacional

É importante entender a diferença:

•
Processamento Digital de Imagens (PDI): foca na manipulação da imagem para melhorá-la ou prepará-la. Exemplo: remover ruído, ajustar contraste, realçar bordas.

•
Visão Computacional (VC): foca na interpretação da imagem para tomar decisões. Exemplo: reconhecer um rosto, detectar um obstáculo, classificar um objeto.

O PDI é frequentemente uma etapa de pré-processamento para a Visão Computacional. Mas os dois campos se sobrepõem muito.

2. Formação da imagem

2.1 Os três elementos básicos

Os slides apresentam três elementos básicos para a formação de uma imagem:

Cenário + fonte de luz + sensor.

Cenário

Contém objetos com formas e cores diversas. Pode ser uma paisagem, uma pessoa, uma peça industrial, um órgão do corpo humano, etc.

Fonte de luz

Fornece a radiação que interage com os objetos. Os slides tratam a luz como uma onda eletromagnética. A fonte pode ser:

•
Luz visível (sol, lâmpada, flash)

•
Raios X (equipamentos médicos)

•
Ultrassom (ondas mecânicas, não eletromagnéticas)

•
Radiação infravermelha

•
Micro-ondas (radar)

Sensor

É o elemento que recebe a energia e gera o sinal que será usado para formar a imagem. Os exemplos citados incluem:

•
Olhos humanos

•
Câmeras fotográficas

•
Filmadoras

•
Scanners

•
Sensores CCD e CMOS

2.2 O processo de formação da imagem

O processo acontece em três etapas:

1.
Luz é emitida por uma fonte — o sol, uma lâmpada, um emissor de raios X.

2.
Luz é refletida pelos objetos — cada objeto absorve parte da luz e reflete outra parte, dependendo de sua cor e material.

3.
Luz é captada pelo olho humano ou sensor — o sensor converte a luz em um sinal elétrico que será processado.

2.3 E as cores?

Os slides explicam que as cores são transportadas pelos raios refletidos nos objetos. Um objeto reflete determinadas componentes de luz de acordo com sua característica predominante.

Por exemplo:

•
Uma parede vermelha absorve a maior parte da luz verde e azul, e reflete principalmente a luz vermelha.

•
Uma parede branca reflete quase toda a luz que recebe.

•
Uma parede preta absorve quase toda a luz.

Analogia

Pense em uma parede vermelha. A luz chega à parede, parte da energia é absorvida e parte é refletida. O sensor capta o que foi refletido. A informação resultante será usada para montar a imagem.

Se você iluminar uma parede vermelha com luz azul, ela parecerá escura, porque a parede absorve a luz azul e reflete muito pouca luz. Isso mostra que a cor percebida depende tanto do objeto quanto da fonte de luz.

2.4 Percepção visual

Objetos que emitem luz visível são percebidos em função da soma das cores espectrais emitidas. Isso significa que a cor que vemos é o resultado da combinação das diferentes frequências de luz que chegam aos nossos olhos.

3. Percepção visual e cores

3.1 O sistema visual humano

A percepção visual humana envolve a interpretação das componentes espectrais da luz. Os slides apresentam uma formação aditiva de cores baseada nas componentes vermelha, verde e azul.

3.2 O olho humano — estrutura

O olho humano é um sistema óptico complexo. Os slides apresentam um diagrama simplificado com as seguintes partes:

•
Córnea: primeira lente do olho, responsável pela maior parte do poder de refração.

•
Íris: controla o tamanho da pupila, regulando a entrada de luz.

•
Pupila: abertura pela qual a luz entra.

•
Lente (cristalino): ajusta o foco para objetos em diferentes distâncias.

•
Retina: superfície onde a imagem é formada.

•
Fóvea: região central da retina, onde a visão é mais nítida e colorida.

•
Nervo óptico: transmite os sinais ao cérebro.

•
Humor vítreo: substância que preenche o globo ocular.

3.3 A retina humana — bastonetes e cones

A retina possui dois tipos principais de células fotossensíveis:

Bastonetes

•
Quantidade: 75 a 150 milhões.

•
Distribuição: por toda a superfície da retina.

•
Sensibilidade à cor: insensíveis à cor.

•
Sensibilidade à luz: muito sensíveis a baixos níveis de iluminação.

•
Função: responsáveis pela visão de baixa luminância (visão escotópica).

•
Uso: visão noturna, percepção de movimento.

Cones

•
Quantidade: 6 a 7 milhões.

•
Tipos: 3 tipos, dependendo da cor a que são sensíveis (vermelho, verde, azul).

•
Sensibilidade à cor: muito sensíveis à cor.

•
Sensibilidade à luz: necessitam de maior intensidade de luz para serem sensibilizados.

•
Distribuição: concentrados principalmente na fóvea.

•
Função: responsáveis pela visão a elevada luminância (visão fotópica).

•
Uso: visão diurna, percepção de detalhes e cores.

Macete

Bastonetes = Baixa luz, Básico (sem cor).

Cones = Cores, Claridade, Concentrados na fóvea.

3.4 O modelo RGB

RGB significa:

•
R — Red — Vermelho

•
G — Green — Verde

•
B — Blue — Azul

Os slides classificam vermelho, verde e azul como cores primárias do modelo RGB. A combinação de duas delas em igual intensidade produz as cores secundárias:

•
Vermelho + Verde → Amarelo

•
Verde + Azul → Ciano

•
Vermelho + Azul → Magenta

3.5 Tabela de comprimentos de onda e combinações

Primária
λ (nm)
Combinação de Primárias
Secundária Resultante
Vermelho
700,0
Vermelho + Verde
Amarelo
Verde
546,1
Vermelho + Azul
Magenta
Azul
435,8
Verde + Azul
Ciano




3.6 Processo aditivo

A formação da imagem é um processo aditivo no qual ocorre uma combinação variável em proporção de componentes monocromáticas nas faixas espectrais associadas às sensações de cor verde, vermelho e azul. Essas três cores são responsáveis pela formação de todas as demais sensações de cores registradas pelo olho humano nos cones verde, vermelho e azul.

Macete

RGB = Red, Green, Blue.

Se a questão falar em combinação aditiva de vermelho, verde e azul, pense imediatamente em RGB.

3.7 Modelo subtrativo (CMY)

Embora os slides foquem no modelo aditivo RGB, é importante saber que existe também o modelo subtrativo CMY (Ciano, Magenta, Amarelo), usado em impressoras. No modelo subtrativo, as cores são formadas pela absorção de luz.

•
Ciano absorve vermelho.

•
Magenta absorve verde.

•
Amarelo absorve azul.

A combinação dos três pigmentos idealmente produz o preto. Na prática, adiciona-se o preto (K) para formar o CMYK.

4. Sistema visual humano x sistema de visão artificial

4.1 Comparação detalhada

Os slides apresentam uma comparação direta entre os dois sistemas. Vamos expandir cada ponto:

Espectro

•
Humano: limitado à faixa de luz visível (aproximadamente 300 nm a 700 nm).

•
Artificial: pode operar em praticamente todo o espectro de radiações eletromagnéticas, dos raios X ao infravermelho, dependendo do sensor.

Flexibilidade

•
Humano: extremamente flexível, capaz de se adaptar a diferentes tarefas e condições de trabalho.

•
Artificial: normalmente inflexível, apresenta bom desempenho somente na tarefa para a qual foi projetado.

Habilidade de medição

•
Humano: capaz de estabelecer estimativas relativamente precisas em assuntos subjetivos.

•
Artificial: pode efetuar medições exatas, baseadas em contagem de pixels e dependentes da resolução da imagem digitalizada.

Cor

•
Humano: possui capacidade de interpretação subjetiva de cores.

•
Artificial: mede objetivamente os valores das componentes R, G e B para determinação de cor.

Sensibilidade

•
Humano: capaz de se adaptar a diferentes condições de luminosidade, características físicas da superfície do objeto e distância ao objeto. Limitado na distinção de muitos níveis diferentes de cinza simultaneamente.

•
Artificial: sensível ao nível e padrão de iluminação, bem como à distância em relação ao objeto e suas características físicas. Pode trabalhar com centenas de tons de cinza, conforme projeto do digitalizador.

Tempo de resposta

•
Humano: elevado, da ordem de 0,1 s.

•
Artificial: dependente de aspectos de hardware, podendo ser tão baixo quanto 0,001 s.

2-D e 3-D

•
Humano: pode executar tarefas 3-D e com múltiplos comportamentos de onda (dentro do espectro de luz visível) facilmente.

•
Artificial: executa tarefas 2-D com relativa facilidade, mas é mais lento e limitado em tarefas 3-D.

Percepção

•
Humano: percebe variações de brilho em escala logarítmica. A interpretação subjetiva de brilho depende da área ao redor do objeto considerado.

•
Artificial: pode perceber brilho em escala linear ou logarítmica.

📝 Para a prova

Não memorize todos os números da tabela sem necessidade. O mais importante é compreender a diferença geral:

Humano = flexível e interpretativo.

Sistema artificial = mensurável, projetado e dependente de hardware/tarefa.

4.2 Implicações práticas

Essa comparação é importante porque mostra que:

•
Sistemas artificiais podem superar humanos em tarefas específicas (medição precisa, velocidade, espectro não visível).

•
Humanos ainda são superiores em tarefas que exigem adaptação, interpretação subjetiva e compreensão contextual.

•
O projeto de um sistema de visão computacional deve levar em conta essas diferenças.




5. Imagens obtidas em diferentes partes do espectro

5.1 Por que isso é importante?

Porque "imagem digital" não significa necessariamente "fotografia feita com luz visível". Um equipamento pode registrar informação em outras faixas e convertê-la em uma representação visual/digital.

5.2 Tipos de imagens por faixa do espectro

Os slides mostram que uma imagem pode ser obtida por diferentes formas de radiação ou fenômenos:

Raios gama

•
Aplicações: medicina nuclear, astronomia.

•
Exemplo: cintilografia óssea, imagem da nebulosa Cygnus Loop.

Raios X

•
Aplicações: medicina, indústria, astronomia.

•
Exemplo: tomografia computadorizada (CT), inspeção de circuitos, imagem de Cygnus Loop.

Ultravioleta

•
Aplicações: litografia, inspeção industrial, microscopia, imagens biológicas, astronomia.

•
Exemplo: microscopia de fluorescência, imagem de Cygnus Loop.

Espectro visível

•
Aplicações: automação industrial, fotografia.

•
Exemplo: inspeção de cápsulas, garrafas.

Infravermelho

•
Aplicações: satélites, visão noturna, astronomia.

•
Exemplo: imagens de satélite dos EUA, América do Sul.

Micro-ondas (radar)

•
Aplicações: sensoriamento remoto, geologia.

•
Exemplo: imagem de montanha no sudeste do Tibet.

Eventos atômicos

•
Aplicações: medicina, astronomia.

•
Exemplo: ressonância magnética do joelho e da coluna.

Ultrassom

•
Aplicações: medicina, exploração geológica.

•
Exemplo: imagens de bebê, tireoide, músculos.

5.3 Imagens da Crab Pulsar

Os slides mostram a mesma região do espaço (Crab Pulsar) em diferentes faixas:

•
Gama: mostra os pulsos de alta energia.

•
Raio X: mostra a estrutura ao redor da estrela de nêutrons.

•
Ótico: mostra a nebulosa em luz visível.

•
Infravermelho: mostra poeira e gás aquecido.

•
Rádio: mostra a emissão de rádio da pulsar.

Isso demonstra como diferentes faixas revelam diferentes aspectos do mesmo objeto.

6. Processar uma imagem: o objetivo

6.1 Objetivos do processamento

Uma imagem pode ser alterada para:

1.
Melhorar a visualização humana — tornar a imagem mais fácil de interpretar para uma pessoa.

2.
Preparar a imagem para análise automática — facilitar a extração de informações por um computador.

6.2 Exemplos destacados

Realce de contraste

Alterações que tornam diferenças de intensidade mais perceptíveis. Exemplo: uma imagem de um carro antigo em que os detalhes estão "lavados" pode ter o contraste aumentado para revelar texturas.

Correção de iluminação

Compensa não uniformidades provocadas pela iluminação ou pelo sistema de aquisição. Exemplo: uma imagem de grãos de arroz com fundo irregular pode ser corrigida para uniformizar o fundo.

Redução de ruído

Reduz elementos indesejados presentes na imagem. Exemplo: uma imagem de um circuito com ruído sal e pimenta pode ser filtrada para remover os pontos brancos e pretos.

6.3 Pergunta mental

Antes de aplicar qualquer técnica, pergunte:


"Quero ajudar uma pessoa a enxergar melhor ou quero facilitar a análise feita pelo computador?"

Essa pergunta ajuda a entender por que o processamento está sendo feito.

7. Fases de um sistema de Processamento Digital de Imagens

7.1 A sequência clássica

Os slides apresentam uma sequência clássica:

Aquisição → Pré-processamento → Segmentação → Extração de Atributos → Reconhecimento e Interpretação.

Esta sequência precisa ser entendida, não apenas decorada.

7.2 Aquisição

É o momento em que a imagem é capturada. O sensor recebe a informação e produz um sinal que será transformado em dados de imagem.

Exemplo: uma câmera CCD ou CMOS captura a cena e gera um sinal analógico que é convertido para digital.

7.3 Pré-processamento

É o tratamento inicial da imagem. Pode incluir correções, redução de ruído e outras operações para deixar os dados mais adequados à próxima etapa.

Exemplo: corrigir iluminação, remover ruído, ajustar contraste.

7.4 Segmentação

É a separação de regiões ou objetos de interesse. Em uma imagem complexa, o computador precisa descobrir qual parte da imagem realmente interessa.

Exemplo: separar a peça defeituosa do fundo da esteira industrial.

7.5 Extração de atributos

Depois de separar uma região de interesse, é possível extrair características que ajudem na análise.

Exemplo: medir o diâmetro da peça, calcular sua área, contar o número de furos.

7.6 Reconhecimento e interpretação

É quando o sistema utiliza as informações extraídas para reconhecer ou interpretar aquilo que foi observado.

Exemplo: decidir se a peça está dentro das especificações ou se deve ser descartada.

Macete

A-P-S-E-R

Aquisição → Pré → Segmentação → Extração → Reconhecimento.

7.7 Exemplo simples

Imagine uma câmera industrial procurando uma peça defeituosa:

•
Aquisição: captura a peça.

•
Pré-processamento: reduz ruído e corrige iluminação.

•
Segmentação: separa a peça do restante da cena.

•
Extração: mede características da peça.

•
Reconhecimento: decide se há defeito.

7.8 Diagrama das fases

Os slides apresentam um diagrama com as seguintes etapas:

Plain Text


Aquisição → Pré-processamento → Segmentação → Extração de Atributos → Reconhecimento e Interpretação



Cada etapa depende da anterior e prepara o terreno para a próxima.

8. Aquisição: CCD e CMOS

8.1 O que são sensores de imagem?

Sensores de imagem são dispositivos que convertem luz em sinais elétricos. Eles são o coração de qualquer câmera digital, scanner ou sistema de visão.

Os slides destacam dois tipos principais: CCD e CMOS.

8.2 CCD (Charge Coupled Device)

O CCD transporta a carga através do chip a partir da matriz fotossensível e o sinal lido é convertido por um conversor analógico-digital (A/D).

Características:

•
Qualidade: alta qualidade de imagem.

•
Ruído: baixo nível de ruído.

•
Consumo: maior consumo de energia (cerca de 100 vezes mais que CMOS equivalente).

•
Custo: maior custo de fabricação.

•
Velocidade: menor velocidade de leitura.

8.3 CMOS (Complementary Metal Oxide Semiconductor)

O CMOS utiliza transistores associados aos pixels para amplificar e mover a carga por fios tradicionais. O sinal de CMOS é digital, assim ele não necessita do conversor A/D.

Características:

•
Qualidade: geralmente mais suscetível a ruídos (interferência eletromagnética).

•
Ruído: maior suscetibilidade a ruído.

•
Consumo: menor consumo de energia.

•
Custo: menor custo de fabricação.

•
Velocidade: maior velocidade de leitura.

8.4 Comparação resumida

Característica
CCD
CMOS
Qualidade
Alta
Boa
Ruído
Baixo
Maior
Consumo
Alto
Baixo
Custo
Alto
Baixo
Velocidade
Menor
Maior
Conversor A/D
Necessário
Não necessário




Macete de prova

CCD = qualidade e maior consumo.

CMOS = velocidade, menor consumo e menor preço.

8.5 Como funciona a leitura

•
CCD: a carga é transferida de pixel em pixel até sair do chip. Isso é mais lento, mas gera menos ruído.

•
CMOS: cada pixel tem seu próprio transistor, permitindo leitura direta e paralela. Isso é mais rápido, mas pode gerar mais ruído.

8.6 Aplicações típicas

•
CCD: câmeras científicas, astronomia, aplicações que exigem alta qualidade.

•
CMOS: celulares, webcams, câmeras de segurança, aplicações que exigem baixo consumo e baixo custo.




9. Fotodiodo, LED e fototransistor

9.1 Componentes fotossensíveis

Os slides mostram exemplos e símbolos de componentes associados à emissão e detecção de luz:

LED (Light Emitting Diode)

•
Função: emite luz quando uma corrente elétrica passa por ele.

•
Símbolo: diodo com setas apontando para fora.

•
Aplicações: indicadores, iluminação, displays.

Fotodiodo

•
Função: gera corrente elétrica quando exposto à luz.

•
Símbolo: diodo com setas apontando para dentro.

•
Aplicações: sensores de luz, câmeras, controles remotos.

Fototransistor

•
Função: amplifica a corrente gerada pela luz.

•
Símbolo: transistor com setas apontando para dentro.

•
Aplicações: sensores de proximidade, leitores ópticos, automação.

9.2 Importância para o PDI

O ponto central para o estudo do material é compreender que sensores e dispositivos fotossensíveis são fundamentais na aquisição da imagem: a informação luminosa precisa ser convertida em sinal elétrico para depois virar representação digital.

Sem esses componentes, não haveria como capturar imagens digitalmente.

10. Por que existe tanto interesse em PDI?

10.1 Os três motivos principais

Os slides apresentam três motivos principais:

1.
Melhoramento da informação da imagem para interpretação humana

•
Exemplo: realçar contraste de uma radiografia para que o médico veja melhor uma fratura.



2.
Processamento de cenas para percepção de máquinas

•
Exemplo: um robô que precisa identificar e pegar uma peça em uma esteira.



3.
Compressão de imagens

•
Exemplo: reduzir o tamanho de uma foto para enviar por WhatsApp ou armazenar em um celular.



10.2 Conexão com o cotidiano

Isso conecta o PDI ao cotidiano:

•
Melhorar uma imagem: filtros do Instagram, correção de fotos.

•
Analisar automaticamente uma cena: reconhecimento facial, carros autônomos.

•
Reduzir o tamanho: JPEG, PNG, streaming de vídeo.

10.3 Aplicações modernas

Além das aplicações clássicas, o PDI está na base de:

•
Redes sociais: filtros, reconhecimento de rostos, moderação de conteúdo.

•
Medicina: diagnóstico assistido por computador.

•
Segurança: reconhecimento de placas, vigilância inteligente.

•
Agricultura: monitoramento de lavouras por drones.

•
Indústria: controle de qualidade automatizado.




11. História do processamento digital de imagens

11.1 O marco inicial

Os slides destacam a forte relação histórica entre PDI e exploração espacial. Em 1964, trabalhos no Jet Propulsion Laboratory (JPL) utilizaram técnicas computacionais para melhorar imagens transmitidas pela Ranger 7, incluindo correções de distorções da câmera de televisão a bordo.

11.2 A imagem da Lua

A Ranger 7 transmitiu imagens da Lua que precisavam ser corrigidas para distorções da câmera. Essas correções foram feitas por computador, marcando o início do PDI como área prática.

11.3 Expansão da área

A partir daí, a área foi crescendo e passou a ser utilizada em:

•
Medicina: tomografia, ressonância, ultrassom.

•
Biologia: microscopia, análise de células.

•
Sensoriamento remoto: satélites, mapeamento.

•
Astronomia: telescópios, sondas espaciais.

•
Geologia: análise de relevo, mineração.

•
Aplicações militares: vigilância, detecção de alvos.

•
Aplicações industriais: inspeção, robótica.

O que lembrar

1964 + Ranger 7 + JPL → marco citado nos slides para processamento de imagens espaciais.

11.4 Evolução até hoje

De 1964 até hoje, a área de processamento digital de imagens tem crescido e se aperfeiçoado continuamente, impulsionada por:

•
Aumento da capacidade de processamento dos computadores.

•
Redução do custo de sensores e memória.

•
Avanço dos algoritmos de visão computacional.

•
Popularização de câmeras digitais e smartphones.




PARTE II — DIGITALIZAÇÃO DE IMAGENS

12. Do sinal contínuo para a imagem digital

12.1 O problema

Os sensores podem produzir sinais contínuos, com infinitos valores possíveis. Para que o computador trabalhe com esses sinais, é necessário digitalizá-los.

12.2 As duas operações fundamentais

Os slides definem duas operações fundamentais:

Amostragem e Quantização.

12.3 A ideia mais simples

Imagine uma música contínua. Para armazená-la digitalmente, você precisa:

1.
Amostrar a música em intervalos regulares (ex.: 44.100 vezes por segundo).

2.
Quantizar cada amostra para um valor discreto (ex.: 16 bits = 65.536 níveis).

Em uma imagem acontece algo equivalente: o espaço e a intensidade são discretizados.

12.4 O processo completo

O processo de digitalização de uma imagem envolve:

1.
Amostragem espacial: discretizar o plano (x,y) em uma grade de pixels.

2.
Quantização de intensidade: discretizar os valores de intensidade em níveis.

3.
Codificação: converter os valores para binário (bits).

12.5 Exemplo visual

Os slides mostram uma imagem contínua (uma forma escura) sendo:

1.
Amostrada em uma grade.

2.
Quantizada em níveis de cinza.

3.
Resultando em uma matriz de números.




13. Amostragem

13.1 Definição

A amostragem discretiza o domínio espacial da imagem nas direções x e y. Ela gera uma matriz de M × N amostras.

13.2 O que a amostragem controla?

Ela está diretamente ligada à quantidade de posições/pixels utilizadas para representar a imagem.

•
Mais amostras = mais pixels = maior resolução espacial.

•
Menos amostras = menos pixels = menor resolução espacial.

13.3 Exemplo prático

Uma imagem de 30 cm × 20 cm amostrada a cada 1 mm:

•
Em x: 300 amostras (30 cm / 1 mm = 300).

•
Em y: 200 amostras (20 cm / 1 mm = 200).

•
Total: 300 × 200 = 60.000 pixels.

Macete

Amostragem = onde estão os pixels.

Se você aumentar a amostragem de forma adequada, terá mais posições para representar detalhes espaciais.

13.4 Limite de Nyquist

Para não perder informação, a taxa de amostragem deve ser pelo menos o dobro da maior frequência do sinal. Isso será detalhado mais adiante.

14. Quantização

14.1 Definição

A quantização escolhe o número de níveis de intensidade ou níveis de cinza permitidos. Nos slides:

L = 2^k

onde:

•
L = número de níveis;

•
k = número de bits por amostra.

14.2 Exemplos

•
1 bit → 2 níveis (preto e branco)

•
2 bits → 4 níveis

•
3 bits → 8 níveis

•
8 bits → 256 níveis

•
9 bits → 512 níveis

•
10 bits → 1024 níveis

14.3 Como funciona a quantização

A escala entre preto e branco é dividida em intervalos numerados por ordem crescente de intensidade.

Por exemplo, para 4 níveis:

•
Nível 0: preto

•
Nível 1: cinza escuro

•
Nível 2: cinza claro

•
Nível 3: branco

Macete

Quantização = quantos tons posso representar?

14.4 Diferença fundamental

Conceito
Pergunta que você deve fazer
Amostragem
Quantos pontos/pixels e em quais posições?
Quantização
Quantos níveis de intensidade?




Se aparecer "pixels", pense primeiro em amostragem/resolução espacial.

Se aparecer "tons de cinza", "níveis de intensidade" ou "bits por pixel", pense em quantização/profundidade.

14.5 Efeito visual da quantização

Os slides mostram o efeito de reduzir o número de níveis de cinza:

•
256 níveis: imagem suave.

•
128 níveis: quase imperceptível.

•
64 níveis: leve posterização.

•
32 níveis: posterização visível.

•
16 níveis: contornos falsos.

•
8 níveis: forte posterização.

•
4 níveis: imagem quase binária.

•
2 níveis: preto e branco.




15. Limite de Nyquist

15.1 O teorema

Os slides alertam que uma amostragem inadequada pode causar perda de informação relevante. A relação apresentada é:

fa ≥ 2fs

onde:

•
fa = frequência de amostragem;

•
fs = frequência do sinal associado à variação da intensidade da cena.

15.2 O que isso significa?

O objetivo é escolher um espaçamento/frequência de amostragem suficiente para recuperar adequadamente a imagem contínua a partir das amostras.

Se a cena tem variações muito rápidas de intensidade (alta frequência), é preciso amostrar com frequência pelo menos duas vezes maior.

15.3 Exemplo prático

Se uma cena tem listras que se repetem 100 vezes por centímetro, a amostragem precisa ser de pelo menos 200 amostras por centímetro para capturar as listras corretamente.

Se amostrarmos menos, ocorre aliasing (nome dado ao efeito de falsas frequências).

Explicação infantil

Se uma coisa está mudando muito rápido e você olha poucas vezes, não consegue acompanhar direito. Você precisa observar com frequência suficiente.

15.4 Prova

Se a questão mencionar frequência do sinal e frequência de amostragem, lembre-se do princípio de Nyquist apresentado no material.

16. Resolução espacial

16.1 Definição

É a medida do menor detalhe discernível em uma imagem.

16.2 Formas de expressar

Os slides mostram que ela pode ser expressa por:

•
Pares de linhas por unidade de distância: ex.: 100 pares de linhas por mm.

•
Pixels nas direções horizontal e vertical: ex.: 800 × 600 pixels.

•
Pixels por unidade de distância (dpi): usado em indústria publicitária e de impressão.

16.3 Exemplos de resolução

•
800 × 600 pixels: resolução típica de monitores antigos.

•
1024 × 768 pixels: resolução típica de monitores intermediários.

•
1920 × 1080 pixels: Full HD.

•
3840 × 2160 pixels: 4K.

16.4 Exemplos de dpi

•
Jornal: 75 dpi.

•
Revista: 133 dpi.

•
Livros: 2400 dpi.

16.5 Atenção

O tamanho da imagem, sozinho, não diz tudo sobre a resolução.

Uma imagem com 1024 × 1024 pixels pode representar uma área física grande ou pequena. Sem conhecer a dimensão espacial capturada, não é possível avaliar completamente a resolução.

16.6 Exemplo dos slides

Os slides mostram uma imagem de um relógio com diferentes resoluções espaciais:

•
3692 × 2812 pixels: detalhes nítidos.

•
213 × 162 pixels: detalhes perdidos.

A mesma imagem, quando reduzida, perde a capacidade de mostrar detalhes finos.

17. Resolução de intensidade / profundidade

17.1 Definição

A resolução de intensidade, ou profundidade da imagem, refere-se à menor alteração discernível nos níveis de intensidade.

Ela está ligada à quantidade de bits usados para representar cada amostra/pixel.

17.2 Exemplos

•
1 bit: 2 níveis (preto e branco).

•
8 bits: 256 níveis.

•
9 bits: 512 níveis.

•
16 bits: 65.536 níveis.

17.3 Efeito de mudar a resolução espacial

Nos slides, mantendo 256 níveis de cinza e diminuindo a resolução espacial de 256×256 para 128×128 e 64×64, ocorre degradação visual e aparência cada vez mais quadriculada.

17.4 Efeito de mudar a profundidade

Mantendo 256×256 pixels e reduzindo os níveis de cinza de 16 para 8 e depois para 2, a imagem perde diferenciação de intensidade.

17.5 Exemplo dos slides

Os slides mostram uma imagem de crânio com diferentes números de níveis de cinza:

•
256 níveis: imagem detalhada.

•
128 níveis: quase imperceptível.

•
64 níveis: leve perda.

•
32 níveis: perda visível.

•
16 níveis: contornos falsos.

•
8 níveis: forte posterização.

•
4 níveis: quase binária.

•
2 níveis: preto e branco.

Macete

Espacial = detalhes de posição.

Intensidade = detalhes de brilho/tons.

18. Imagem matricial x imagem vetorial

18.1 Imagem matricial

A forma é representada por uma matriz de pixels. É a representação trabalhada diretamente no PDI tradicional.

Características:

•
Baseada em pixels.

•
Perde qualidade ao ampliar.

•
Exemplos: JPEG, PNG, BMP, GIF.

18.2 Imagem vetorial

A forma dos objetos é descrita por funções/elementos vetoriais.

Características:

•
Baseada em vetores matemáticos.

•
Não perde qualidade ao ampliar.

•
Exemplos: SVG, AI, CDR, PDF vetorial.

18.3 Comparação

Característica
Matricial (Bitmap)
Vetorial
Representação
Matriz de pixels
Funções matemáticas
Ampliação
Perde qualidade
Não perde qualidade
Tamanho do arquivo
Grande
Pequeno
Aplicações
Fotos, imagens complexas
Logos, desenhos técnicos




Macete

Matricial = pixels.

Vetorial = funções/formas.

19. Cálculo do tamanho da imagem em memória

19.1 Fórmula

Os slides usam a expressão:

Memória = Resolução × Profundidade(bits) / 8

Quando a resolução é dada por largura × altura:

Memória = largura × altura × bits por pixel / 8

19.2 Exemplo dos slides

Imagem de 300 × 200 pixels com 8 bits:

300 × 200 × 8 / 8 = 60.000 bytes

O material converte o resultado para aproximadamente 58 KB.

19.3 Passo a passo

1.
Calcule o número total de pixels (largura × altura).

2.
Multiplique pela profundidade em bits.

3.
Divida por 8 para converter bits em bytes.

4.
Se necessário, divida por 1024 para obter KB.

19.4 Conversões úteis

•
1 byte = 8 bits.

•
1 KB = 1024 bytes.

•
1 MB = 1024 KB.

•
1 GB = 1024 MB.

Erro clássico

Não divida por 8 antes de multiplicar pelos bits. Primeiro calcule a quantidade total de bits.

19.5 Exemplo com 256 níveis

Se a imagem tem 256 níveis de cinza, então 256 = 2^8, logo 8 bits por pixel.

Para uma imagem de 640 × 480:

640 × 480 × 8 / 8 = 307.200 bytes = 300 KB.

20. Tempo de transmissão

20.1 Fórmula

A fórmula base é:

Tempo = Tamanho / Taxa de transmissão

20.2 Atenção às unidades

Se a taxa estiver em bits por segundo e o tamanho estiver em bytes, converta:

1 byte = 8 bits.

20.3 Exemplo do slide

Imagem = 60.000 bytes

Conexão = 56 kbps = 56.000 bits/s

Convertendo para bytes/s:

56.000 / 8 = 7.000 bytes/s

Então:

60.000 / 7.000 ≈ 8,6 s.

20.4 Outro exemplo

Imagem = 274 KB

Conexão = 4 Mbps = 4.000.000 bits/s = 500.000 bytes/s

274 × 1024 = 280.576 bytes

280.576 / 500.000 ≈ 0,56 s (o slide registra aproximadamente 0,5 s).

Macete

Taxa em bits? Converta.

21. Exercício completo de digitalização — padrão dos slides

21.1 O problema

Considere uma imagem de 21 cm × 29,7 cm com resolução espacial de 100 pixels/cm².

21.2 Total de pixels

TP = 21 × 29,7 × 100

TP = 62.370 pixels

21.3 Resolução em pixels

Como 100 pixels/cm² corresponde a 10 pixels/cm em cada direção:

M = 10 × 29,7 = 297

N = 10 × 21 = 210

Logo:

297 × 210 pixels

21.4 Profundidade de 256 níveis

256 = 2^8

Portanto:

8 bits.

Total de bits:

62.370 × 8 = 498.960 bits

Bytes:

498.960 / 8 = 62.370 bytes

O material expressa esse valor como aproximadamente 60 KB.

21.5 Se houver apenas 4 níveis

4 = 2²

Logo:

2 bits por pixel.

Tamanho aproximado:

62.370 × 2 / 8 = 15.592 bytes, aproximadamente 15 KB.

21.6 Transmissão a 1 Mbps

O slide conduz ao resultado de aproximadamente 0,46 s usando a conversão de unidades apresentada.

22. Outro exercício dos slides — scanner

22.1 O problema

Um scanner varre uma imagem de 21 cm × 29,7 cm com 400 pixels/cm².

22.2 Total de pixels

21 × 29,7 × 400 = 249.480 pixels

22.3 Resolução em pixels

A raiz de 400 é 20 pixels/cm. Logo:

N = 20 × 29,7 = 594

M = 20 × 21 = 420

Resolução:

594 × 420 pixels

22.4 Profundidade de 512 níveis

512 = 2^9

Logo:

9 bits.

Tamanho:

594 × 420 × 9 / 8 ≈ 280.665 bytes, aproximadamente 274 KB conforme os slides.

22.5 Transmissão em 4 Mbps

Resultado apresentado no material: aproximadamente 0,5 s.

22.6 O que a prova pode fazer

Ela pode trocar os números, mas a lógica será a mesma:

área × resolução espacial → pixels → bits → bytes → tempo.

PARTE III — PROCESSAMENTO NO DOMÍNIO ESPACIAL

23. O que significa "domínio do espaço"?

23.1 Definição

Os slides definem o domínio espacial como o conjunto de técnicas que manipulam diretamente os pixels ou suas vizinhanças. O termo "espacial" está relacionado à localização direta dos pixels na imagem digital.

23.2 A expressão geral

A forma geral apresentada é:

g(x,y) = T[f(x,y)]

onde:

•
f(x,y) = imagem de entrada;

•
g(x,y) = imagem resultante;

•
T = operador aplicado sobre a imagem ou sobre uma vizinhança.

Em palavras simples

"Pegue a imagem, aplique uma regra e produza uma nova imagem."

23.3 Exemplos de T

•
T pode ser uma transformação pontual: ex.: s = 255 - r.

•
T pode ser uma operação local: ex.: média da vizinhança.

•
T pode ser uma operação global: ex.: equalização de histograma.

23.4 Domínio espacial x domínio da frequência

•
Domínio espacial: trabalha diretamente com pixels e vizinhanças.

•
Domínio da frequência: trabalha com a transformada de Fourier da imagem.

Os dois domínios são equivalentes: uma operação no espaço corresponde a uma operação na frequência.

24. Operações pontuais, locais e globais

24.1 Operação pontual

O valor de saída depende do pixel de entrada correspondente.

um pixel → um pixel

Exemplo: negativo, transformação log, gamma.

Fórmula: s = T(r), onde r é o valor do pixel de entrada e s é o valor de saída.

24.2 Operação local

O valor resultante depende da vizinhança do pixel.

um pixel → vários pixels vizinhos influenciam

Exemplos: filtros de média, mediana, Sobel.

Fórmula: g(x,y) = T[f(x,y), f(x-1,y), f(x+1,y), ...].

24.3 Operação global

O resultado depende de todos os valores da imagem de entrada.

Exemplos: equalização de histograma, transformada de Fourier.

Macete

Pontual = um.

Local = vizinhos.

Global = imagem toda.

24.4 Exemplos visuais

Os slides mostram:

•
Pontual: um ponto de entrada gera um ponto de saída.

•
Local: uma região de entrada gera um ponto de saída.

•
Global: a imagem inteira de entrada gera um ponto de saída.




25. Imagem negativa

25.1 Fórmula

Para uma imagem com níveis de cinza no intervalo [0, L−1], o negativo é calculado por:

s = (L−1) − r

Para L = 256:

s = 255 − r

25.2 Exemplo

r = 40

s = 255 − 40 = 215

25.3 Como interpretar

Valores escuros viram valores claros e vice-versa. É como o negativo de um filme fotográfico.

25.4 Aplicações

•
Radiologia: realçar detalhes em regiões escuras.

•
Análise de mamografias: o negativo pode facilitar a visualização de certas estruturas.

•
Efeitos visuais: criar imagens artísticas.

Macete

Negativo de 8 bits = 255 menos o valor original.

26. Transformação logarítmica

26.1 Fórmula

A fórmula apresentada é:

s = c log(1+r)

com:

•
c = constante;

•
r ≥ 0.

26.2 Objetivo

O material explica que a transformação log mapeia intervalos estreitos de valores baixos de intensidade para intervalos mais largos, enquanto comprime valores altos.

26.3 Interpretação

Log = expande baixos e comprime altos.

Isso pode ser útil quando os valores de baixa intensidade contêm detalhes que precisam ganhar visibilidade.

26.4 Aplicações

•
Espectros de Fourier: a transformação log é usada para visualizar espectros, que têm uma faixa dinâmica muito grande.

•
Imagens médicas: realçar detalhes em regiões escuras.

Tradução

Se a imagem tem muitos pixels escuros e poucos claros, o log ajuda a ver melhor os escuros.

27. Transformação exponencial — correção Gamma

27.1 Fórmula

Fórmula dos slides:

s = c · r^λ

onde c e λ são constantes positivas.

27.2 Explicação

Os slides explicam que vários dispositivos apresentam respostas exponenciais e que imagens não corrigidas podem aparecer muito escuras.

27.3 Relação apresentada nos exemplos

λ < 1 → clareia a imagem.

λ > 1 → escurece a imagem.

O material mostra exemplos de λ = 0,6; 0,4; 0,3 para imagens mais claras e λ = 3; 4; 5 para imagens mais escuras.

27.4 Aplicação em monitores

A resposta intensidade-voltagem dos monitores de tubo de raios catódicos é uma função exponencial com expoente variando entre 1,8 e 2,5.

Para corrigir, aplica-se uma correção gamma de aproximadamente 0,4 (1/2,5).

27.5 Exemplo visual

Os slides mostram uma imagem sendo vista pelo monitor com gamma = 2,5 (escura), depois corrigida com gamma = 0,4 (clara), resultando na imagem final correta.

Macete

Gamma menor que 1 → clareia.

Gamma maior que 1 → escurece.

28. Operações aritméticas entre imagens

28.1 Definição

Os slides mostram que operações aritméticas sobre imagens são realizadas pixel a pixel.

Operações citadas:

•
adição;

•
subtração;

•
multiplicação;

•
divisão.

28.2 Adição

Uma aplicação citada é combinar imagens para obter médias e ajudar na redução de ruído.

Exemplo: se você tira várias fotos da mesma cena com ruído aleatório, a média das fotos reduz o ruído.

Fórmula: g(x,y) = f1(x,y) + f2(x,y).

28.3 Subtração

É apresentada como ferramenta básica em imagens médicas para remover informação estática de fundo.

Exemplo: subtrair uma imagem de fundo de uma imagem com objeto para isolar o objeto.

Fórmula: g(x,y) = f1(x,y) - f2(x,y).

28.4 Multiplicação e divisão

Podem ser utilizadas para corrigir sombreamento/variações de níveis de cinza causadas por iluminação não uniforme ou por características do sensor.

Exemplo: dividir a imagem por uma imagem de fundo uniforme para corrigir iluminação.

Fórmula: g(x,y) = f1(x,y) × f2(x,y) ou g(x,y) = f1(x,y) / f2(x,y).

Ideia essencial

Duas imagens podem ser tratadas como duas matrizes e as operações podem ser feitas posição por posição.

29. Overflow e underflow

29.1 Definição

Tema muito provável em questão conceitual ou cálculo.

Em uma imagem com 256 níveis:

mínimo = 0

máximo = 255

29.2 Overflow

O resultado ultrapassa o máximo.

Exemplo:

200 + 100 = 300

300 não cabe na faixa 0–255.

29.3 Underflow

O resultado fica abaixo do mínimo.

Exemplo:

20 − 50 = −30

−30 está abaixo de 0.

29.4 Tratamento por truncamento

O material apresenta a possibilidade de:

•
valores acima do máximo → 255;

•
valores abaixo do mínimo → 0.

29.5 Tratamento com números negativos

Outra possibilidade é utilizar uma representação de memória que permita números negativos, conforme descrito no slide.

29.6 Exemplo completo

Plain Text


A = [200 100; 100 127]  B = [100 100; 200 255]

A+B = [300 200; 300 382] → truncado: [255 200; 255 255]
A-B = [100 0; -100 -128] → truncado: [100 0; 0 0]



Macete

OVER = passou do teto.

UNDER = caiu abaixo do chão.

30. Operações lógicas

30.1 Definição

As operações lógicas também são aplicadas pixel a pixel e são especialmente úteis para imagens binárias, extração de características e análise de formas.

Operações citadas:

•
NOT;

•
AND;

•
OR;

•
XOR.

30.2 NOT

É unária: usa apenas um operando.

NOT 1 = 0

NOT 0 = 1

30.3 AND

Só resulta em 1 quando os dois operandos são 1.

A
B
A AND B
0
0
0
0
1
0
1
0
0
1
1
1




30.4 OR

Resulta em 1 quando pelo menos um dos operandos é 1.

A
B
A OR B
0
0
0
0
1
1
1
0
1
1
1
1




30.5 XOR

Resulta em 1 quando os operandos são diferentes.

A
B
A XOR B
0
0
0
0
1
1
1
0
1
1
1
0




Macete

AND = os dois.

OR = pelo menos um.

XOR = diferentes.

NOT = inverte.

30.6 Aplicações

•
Máscaras binárias: isolar regiões de interesse.

•
Extração de características: combinar imagens para realçar bordas.

•
Análise de formas: comparar objetos binários.




31. Vizinhanças de pixels

31.1 N4

É a vizinhança formada pelos quatro vizinhos ortogonais:

•
acima;

•
abaixo;

•
esquerda;

•
direita.

Coordenadas: (x-1,y), (x+1,y), (x,y-1), (x,y+1).

31.2 N8

É composta pelos oito pixels ao redor do pixel central, incluindo diagonais.

Coordenadas: N4 + (x-1,y-1), (x+1,y-1), (x-1,y+1), (x+1,y+1).

31.3 N6

Os slides citam que alguns dispositivos podem fazer amostragem hexagonal, produzindo uma vizinhança N6.

31.4 Coordenadas

Os slides indicam:

•
i = colunas;

•
j = linhas.

Em uma questão, não confunda linha com coluna.

31.5 Exemplo visual

Os slides mostram diagramas com o pixel central (x,y) e seus vizinhos N4, ND e N8.

32. Distância métrica

32.1 Propriedades

Os slides apresentam propriedades para uma função de distância D. A ideia é que a distância deve respeitar condições como:

•
não negatividade: D(p,q) ≥ 0.

•
identidade: D(p,q) = 0 somente quando p = q.

•
simetria: D(p,q) = D(q,p).

•
desigualdade triangular: D(p,z) ≤ D(p,q) + D(q,z).

32.2 Importância

Essas propriedades garantem que a função de distância se comporta como esperado geometricamente.

32.3 Três formas de medir

Depois são apresentadas três formas de medir a distância entre pixels:

•
Euclidiana;

•
D4 (city-block);

•
D8 (tabuleiro de xadrez).




33. Distância Euclidiana

33.1 Fórmula

Para p = (i,j) e q = (k,l):

DE(p,q) = √[(i−k)² + (j−l)²]

33.2 Interpretação

É a ideia de distância em linha reta, como se você pudesse voar de um ponto a outro.

33.3 Exemplo

p = (3,5), q = (10,11)

DE = √[(3−10)² + (5−11)²]

= √[(−7)² + (−6)²]

= √(49 + 36)

= √85

≈ 9,22

Macete

Euclidiana = raiz.

34. Distância D4 — City-block

34.1 Fórmula

D4(p,q) = |i−k| + |j−l|

34.2 Interpretação

Os pixels com D4 = 1 são os N4 do pixel.

Imagine uma cidade em que você só pode andar horizontalmente ou verticalmente pelas ruas. Você não corta a esquina na diagonal.

34.3 Exemplo

p = (3,5), q = (10,11)

D4 = |3−10| + |5−11|

= 7 + 6

= 13

Macete

D4 = soma das diferenças absolutas.

35. Distância D8 — tabuleiro de xadrez

35.1 Fórmula

D8(p,q) = max(|i−k|, |j−l|)

35.2 Interpretação

Os pixels com D8 = 1 são os oito vizinhos.

No xadrez, o rei pode andar na diagonal. Por isso a distância considera o maior deslocamento entre as duas coordenadas.

35.3 Exemplo

p = (3,5), q = (10,11)

D8 = max(|3−10|, |5−11|)

= max(7, 6)

= 7

Macete

D8 = pega o maior.

36. Exemplo de distância dos slides

36.1 P = (3,3), Q = (12,8)

D4:

|3−12| + |3−8|

= 9 + 5

= 14

D8:

max(9,5) = 9

Euclidiana:

√(9² + 5²) = √106 ≈ 10 no exemplo apresentado.

36.2 Outro exercício do material

P = (3,5), Q = (10,11)

D8 = max(7,6) = 7

DE = √(7² + 6²) = √85 ≈ 9,22. O slide registra aproximadamente 9.

Para P = (7,6), Q = (6,6):

D4 = 1

D8 = 1

DE = 1

36.3 Tabela comparativa

Distância
Fórmula
Exemplo p(3,5), q(10,11)
D4
|i−k| + |j−l|
13
D8
max(|i−k|, |j−l|)
7
Euclidiana
√[(i−k)² + (j−l)²]
9,22







37. Expressões booleanas em imagens

37.1 Exemplo dos slides

Os slides propõem exercícios com combinações de operadores lógicos, incluindo:

Z = OR(XOR(X,Y), NOT(OR(X,Y)))

37.2 Passo a passo

A regra é aplicar primeiro o operador interno e depois o operador externo.

1.
Calcule XOR(X,Y).

2.
Calcule OR(X,Y).

3.
Faça NOT do resultado do passo 2.

4.
Faça o OR entre os resultados dos passos 1 e 3.

37.3 Tabela de verdade resultante

X
Y
XOR
OR
NOT(OR)
Z
0
0
0
0
1
1
0
1
1
1
0
1
1
0
1
1
0
1
1
1
0
1
0
0




37.4 Interpretação

A expressão resulta em 1 apenas quando X e Y são ambos 0 ou quando são diferentes. Quando ambos são 1, resulta em 0.

PARTE IV — FILTRAGEM DE IMAGENS DIGITAIS

38. O que é filtragem?

38.1 Definição

Os slides definem a filtragem como uma família de técnicas utilizadas para:

•
eliminar elementos com determinada característica;

•
alterar atributos da imagem;

•
detectar características;

•
detectar/reduzir ruído.

38.2 Tipos de filtragem

Há filtragem:

•
no domínio espacial;

•
no domínio da frequência.

E, quanto ao comportamento, os slides classificam filtros em:

•
lineares;

•
não lineares;

•
híbridos.

38.3 Aplicações

•
Suavização: reduzir ruído, borrar detalhes.

•
Realce: destacar bordas, aumentar contraste.

•
Detecção: encontrar bordas, cantos, texturas.




39. Princípio geral da filtragem linear

39.1 Fórmula

Os slides apresentam:

g(x,y) = H[f(x,y)]

onde H é o operador/filtro.

39.2 Linearidade

O operador H é linear quando satisfaz a propriedade de superposição indicada nos slides:

H(a f1 + b f2) = aH(f1) + bH(f2)

ou seja, a combinação linear de entradas produz a mesma combinação linear das respostas.

39.3 Em palavras simples

Um filtro linear respeita a regra de "somar e multiplicar antes ou depois" de forma consistente.

39.4 Exemplos

•
Filtro da média: linear.

•
Filtro da mediana: não linear.

•
Filtro de Sobel: linear.




40. Como funciona uma filtragem espacial com máscara?

40.1 O processo

O processo descrito nos slides é:

1.
definir um ponto central;

2.
considerar a vizinhança ao redor dele;

3.
aplicar uma operação pré-definida sobre os pixels da vizinhança;

4.
calcular o novo valor;

5.
colocar esse valor na posição correspondente ao centro;

6.
mover a máscara;

7.
repetir o processo pela imagem inteira.

40.2 Visualize

Imagine uma janela 3×3 deslizando sobre uma imagem enorme. Para cada posição da janela, você faz um cálculo e escreve o resultado no centro.

Isso é o coração da filtragem espacial.

40.3 Exemplo

Se a máscara é:

Plain Text


1 1 1
1 1 1
1 1 1



E a vizinhança é:

Plain Text


10 10 10
10 90 10
10 10 10



O novo valor é a média: (10×8 + 90)/9 = 170/9 ≈ 18.

41. Tamanho das máscaras

41.1 Fórmula

Os slides apresentam a forma:

m = 2a + 1

n = 2b + 1

com isso, as máscaras utilizadas na formulação apresentada têm tamanho ímpar.

41.2 Exemplos

•
3×3

•
5×5

•
7×7

•
11×11

41.3 Vantagem

A vantagem é permitir um centro bem definido. Máscaras pares não têm um pixel central único.

42. Bordas da imagem

42.1 O problema

Quando a máscara chega à borda, faltam pixels fora da imagem. Os slides apresentam diferentes soluções.

42.2 Opção 1 — Ignorar

Não processar determinadas regiões de borda.

Vantagem: simples.

Desvantagem: perde informação nas bordas.

42.3 Opção 2 — Máscara modificada

Usar uma máscara diferente nessas regiões.

Vantagem: processa todas as regiões.

Desvantagem: mais complexo.

42.4 Opção 3 — Expandir a imagem

Criar uma faixa adicional antes de processar.

As formas de preenchimento apresentadas incluem:

•
Valor fixo: preencher com zeros ou 255.

•
Replicação: copiar os pixels da borda.

•
Simetria: refletir os pixels da borda.

•
Circular: tratar a imagem como função periódica.

Macete

Replicação = copia.

Simetria = reflete.

Circular = dá a volta.

43. Correlação x Convolução

43.1 Correlação

A máscara percorre a imagem e são calculadas somas de produtos. A máscara é utilizada como está.

Fórmula: w(x,y) ∘ f(x,y) = ΣΣ w(s,t) f(x+s, y+t).

43.2 Convolução

O processo é semelhante, mas antes a máscara é rotacionada 180°.

Fórmula: w(x,y) • f(x,y) = ΣΣ w(s,t) f(x−s, y−t).

43.3 Caso especial

Se a máscara for simétrica, não faz diferença prática entre correlação e convolução, conforme destacado pelos slides.

43.4 Exemplo

Máscara:

Plain Text


1 2 3
4 5 6
7 8 9



Rotacionada 180°:

Plain Text


9 8 7
6 5 4
3 2 1



Macete

Correlação = sem giro.

Convolução = gira 180°.

44. Filtro da média

44.1 Definição

O filtro da média é uma forma de suavização.

Para uma máscara 3×3 uniforme, o novo pixel pode ser obtido somando os nove valores e dividindo por 9.

44.2 Exemplo dos slides

A vizinhança contém oito valores 10 e um valor 90:

10 + 10 + 10 + 10 + 90 + 10 + 10 + 10 + 10 = 170

Resultado:

170 / 9 ≈ 18

Esse exemplo mostra como um valor muito diferente pode ser "diluído" pela média da vizinhança.

44.3 Consequência

A média reduz variações abruptas, mas pode borrar bordas.

44.4 Máscara

Plain Text


1/9 × [1 1 1; 1 1 1; 1 1 1]






45. Filtro da média — efeitos

45.1 Vantagens

Os slides associam o filtro de média à:

•
redução de ruído;

•
suavização;

•
redução de transições abruptas;

•
remoção de pequenos detalhes;

•
fechamento de pequenos gaps em linhas ou curvas.

45.2 Desvantagem

Mas existe um efeito colateral importante:

o borramento de bordas.

45.3 Máscara maior

Uma máscara maior considera uma região maior, aumentando a suavização. O material mostra que uma máscara muito grande pode alterar bastante os detalhes e os contornos.

45.4 Exemplo visual

Os slides mostram uma imagem de uma esfera com ruído, filtrada com máscaras 3×3, 5×5, 9×9, 15×15, 35×35. Quanto maior a máscara, mais borrada a imagem.

Regra de prova

Mais suavização = potencialmente mais borramento.

46. Média ponderada

46.1 Definição

Em vez de dar o mesmo peso para todos os pixels, podemos usar uma máscara com pesos diferentes.

46.2 Exemplo apresentado

Plain Text


1 2 1
2 4 2
1 2 1



Normalização:

1/16

O pixel central recebe maior peso.

46.3 Comparação

Média simples: todos os pesos iguais.

Média ponderada: alguns pixels têm mais influência.

46.4 Vantagem

A média ponderada tende a preservar melhor as características centrais da vizinhança.

47. Filtro da mediana

47.1 Definição

O filtro da mediana é não linear.

A lógica é:

1.
selecionar a vizinhança;

2.
organizar os valores em ordem;

3.
localizar a mediana;

4.
substituir o pixel central pela mediana.

47.2 Exemplo simples

Valores:

1, 2, 3, 4, 90, 5, 6, 7, 8

Ordenados:

1, 2, 3, 4, 5, 6, 7, 8, 90

Mediana = 5

O 90, que pode representar um ruído impulsivo, deixa de dominar o resultado.

47.3 Sal e pimenta

Os slides destacam a mediana como adequada para reduzir ruído impulsivo do tipo sal e pimenta.

47.4 Grande vantagem

A mediana tende a preservar contornos melhor do que a média em situações de ruído impulsivo.

Macete

Mediana = ordenar e pegar o meio.

Sal e pimenta = pense em mediana.

48. Como calcular mediana em quantidade par

48.1 Regra

Se a janela tiver um número par de elementos, o material apresenta o cálculo pela média dos dois valores centrais.

48.2 Exemplo citado

0, 1, 1, 2

Os dois centrais são 1 e 1:

(1 + 1)/2 = 1

48.3 Outro exemplo

0, 1, 1, 2, 3, 3

Os dois centrais são 1 e 2:

(1 + 2)/2 = 1,5

O slide registra 1 no exemplo devido ao modo como os valores são tratados na demonstração. Para estudar para a prova, siga exatamente a convenção usada na questão apresentada.

49. Max, Min e Moda

49.1 Max

Substitui o pixel pelo maior valor da vizinhança. O slide explica que isso tende a aumentar a área das regiões claras.

49.2 Min

Substitui pelo menor valor da vizinhança. Isso tende a aumentar a área das regiões escuras.

49.3 Moda

Substitui pelo valor que ocorre com maior frequência na vizinhança.

Macete

MAX → maior.

MIN → menor.

MODA → mais repetido.

49.4 Aplicações

•
Max: remover ruído escuro (pimenta).

•
Min: remover ruído claro (sal).

•
Moda: preservar valores predominantes.




50. Suavização e frequência

50.1 Correspondência

Os slides fazem uma correspondência importante entre os domínios espacial e da frequência.

50.2 Filtros de suavização

Correspondem a passa-baixa no domínio da frequência. Eles atenuam componentes de alta frequência e preservam componentes de baixa frequência.

50.3 Filtros de realce

Correspondem a passa-alta. Eles preservam componentes de alta frequência, associadas a arestas e detalhes abruptos.

50.4 Filtro passa-faixa

Remove uma região selecionada das componentes de frequência. Os slides dizem que é mais usado em restauração de imagens e raramente em realce.

Macete

Passa-baixa → suaviza.

Passa-alta → destaca detalhes/bordas.

51. Frequência espacial

51.1 Definição

A frequência espacial está associada à rapidez com que a intensidade varia na imagem.

51.2 Baixa frequência

Grandes regiões relativamente suaves, com mudanças lentas.

51.3 Alta frequência

Mudanças rápidas, contornos e detalhes abruptos.

51.4 Por que isso ajuda?

Porque ruído, bordas e grandes regiões têm comportamentos diferentes em termos de frequência. Isso permite construir filtros específicos.

52. Detecção de bordas

52.1 Definição

Uma borda aparece onde ocorre uma transição brusca de intensidade.

52.2 Operadores diferenciais

Os slides apresentam operadores diferenciais e a ideia de gradiente para detectar essas mudanças.

O gradiente possui:

•
direção;

•
vetor;

•
magnitude.

52.3 Fórmulas

Vetor: ∇f = [∂f/∂x; ∂f/∂y]

Magnitude: |∇f| = √[(∂f/∂x)² + (∂f/∂y)²]

Direção: θ = tg⁻¹(∇y/∇x)

Em palavras simples

Uma borda é como a fronteira entre "uma coisa" e "outra coisa". Se os valores dos pixels mudam muito de repente, há uma grande chance de existir um contorno ali.

53. Gradiente de Roberts

53.1 Definição

O Roberts é apresentado usando uma vizinhança 2×2.

53.2 Fórmulas

∇d1 f(x,y) = f(x,y) − f(x+1,y+1)

∇d2 f(x,y) = f(x,y+1) − f(x+1,y)

53.3 Característica

Isso é uma ótima associação para memorizar:

Roberts → 2×2.

O princípio continua sendo medir mudanças rápidas de intensidade para destacar bordas.

54. Sobel e operadores de gradiente

54.1 Definição

Os slides apresentam o Sobel como filtro de gradiente ligado à primeira derivada e à detecção de bordas.

54.2 Fórmulas

A expressão vetorial apresentada é:

∇a[m,n] = (hx ⊛ a[m,n]) ix + (hy ⊛ a[m,n]) iy

A ideia essencial é que componentes em diferentes direções podem ser analisadas separadamente.

54.3 Máscaras Sobel

Horizontal:

Plain Text


-1 0 1
-2 0 2
-1 0 1



Vertical:

Plain Text


-1 -2 -1
0 0 0
1 2 1



54.4 Característica

O Sobel pode realçar mudanças em determinadas direções, como horizontal e vertical.

55. Filtros direcionais

55.1 Definição

Os slides mostram filtros voltados para diferentes orientações:

•
horizontal;

•
vertical;

•
45°;

•
−45°.

55.2 Lógica

A lógica é simples: se um filtro foi construído para detectar segmentos horizontais, ele tende a responder mais fortemente a bordas horizontais do que a bordas de outras orientações.

55.3 Como raciocinar

Filtro horizontal → procura estrutura horizontal.

Filtro vertical → procura estrutura vertical.

Filtro diagonal → procura determinada orientação diagonal.

56. Prewitt

56.1 Definição

Os slides apresentam operadores de Prewitt como filtros de gradiente para detecção de contornos.

56.2 Máscaras Prewitt

Horizontal:

Plain Text


-1 -1 -1
0 0 0
1 1 1



Vertical:

Plain Text


-1 0 1
-1 0 1
-1 0 1



56.3 Característica

O importante para a revisão é reconhecer o papel geral:

Prewitt → gradiente → mudanças de intensidade → bordas.

Os slides também trazem exercícios específicos em que o estudante precisa realizar a convolução da imagem com uma máscara de Prewitt.

57. Procedimento geral para resolver uma convolução na prova

57.1 Passo a passo

Se aparecer uma máscara e uma imagem, faça assim:

1.
Identifique o tamanho da máscara.

2.
Localize a região correspondente da imagem.

3.
Se for convolução, lembre que a máscara deve ser girada 180°.

4.
Multiplique cada peso pelo pixel correspondente.

5.
Some os resultados.

6.
O resultado é associado ao pixel central daquela operação.

7.
Desloque a máscara e repita.

57.2 Checklist

GIRAR → MULTIPLICAR → SOMAR → ESCREVER.

57.3 Exemplo

Máscara:

Plain Text


1 1 1
0 0 0
1 1 1



Imagem:

Plain Text


1 2 3
0 1 3
1 1 3



Para o pixel central (2,2), a vizinhança é a própria imagem 3×3.

Cálculo: 1×1 + 2×1 + 3×1 + 0×0 + 1×0 + 3×0 + 1×1 + 1×1 + 3×1 = 1+2+3+0+0+0+1+1+3 = 11.

58. Exemplos de cálculo de convolução presentes nos slides

58.1 Resultados apresentados

Os slides fornecem vários cálculos intermediários. O objetivo deles é mostrar a mecânica do processo. Alguns resultados apresentados são:

•
I(1,1) = 1

•
I(2,1) = 4

•
I(3,1) = 8

•
I(4,1) = 7

•
I(5,1) = 4

•
I(3,2) = 15

•
I(4,2) = 17

•
I(4,4) = 20

58.2 Como estudar

Não tente decorar esses números. Decore o procedimento. A prova pode trocar a matriz e manter o mesmo raciocínio.

59. Filtragem no domínio da frequência

59.1 Base

No domínio da frequência, os slides apresentam como base a obtenção da Transformada Discreta de Fourier da imagem e do filtro, além das transformadas inversas.

59.2 Fórmulas

DFT:

F(kx,ky) = ΣΣ f(x,y) e^(−2πj (kx x + ky y)/(Mx + Ny))

IDFT:

f(x,y) = (1/MN) ΣΣ F(kx,ky) e^(2πj (x/M kx + y/N ky))

Teorema da convolução:

f(x,y) * h(x,y) ↔ F(kx,ky) H(kx,ky)

59.3 Simplificando

No domínio espacial, você pensa:


"Quanto vale este pixel e seus vizinhos?"

No domínio da frequência, você pensa:


"Que componentes de frequência existem nesta imagem?"




60. U, V e Z no domínio da frequência

60.1 Definições

Os slides apresentam:

•
U → frequência horizontal;

•
V → frequência vertical;

•
Z → frequência em uma direção qualquer, como 30°, 45° e 60°.

60.2 Importância

Isso ajuda a compreender que diferentes orientações no espaço podem produzir diferentes componentes no domínio da frequência.

61. Heat map como representação por frequência

61.1 Exemplo

Os slides utilizam um mapa de calor como exemplo didático. No exemplo, as cores indicam a concentração de ocorrências de jogadores em regiões do campo.

61.2 Legenda

•
Verde: ausência ou baixa ocorrência.

•
Azul: poucos jogadores.

•
Magenta: alguns jogadores.

•
Amarelo: maior concentração.

•
Vermelho: muita concentração.

61.3 Interpretação

O exemplo serve para demonstrar uma representação baseada na frequência de ocorrências em regiões.

62. Conexão entre domínio espacial e domínio da frequência

62.1 Tabela comparativa

Domínio
O que observamos?
Exemplos
Espacial
pixels e vizinhança
média, mediana, máscara
Frequência
componentes de frequência
passa-baixa, passa-alta, Fourier




62.2 Correspondência básica

A correspondência básica ensinada pelos slides é:

suavização espacial ↔ passa-baixa

realce/detalhes ↔ passa-alta

62.3 Tipos de filtros

Os slides mostram:

•
(a) Filtro passa-baixa: suaviza.

•
(b) Filtro passa-alta: realça bordas.

•
(c) Filtro passa-banda: remove faixas específicas.




PARTE V — REVISÃO COMPARATIVA PARA A PROVA

63. Amostragem x Quantização

Amostragem

Discretiza o domínio espacial. Está ligada à quantidade e distribuição dos pixels.

Quantização

Escolhe os níveis de intensidade. Está ligada à profundidade em bits.

Macete

Amostragem = espaço.

Quantização = intensidade.

64. Resolução espacial x profundidade

Resolução espacial

Pergunte: "Quanto detalhe espacial consigo distinguir?"

Profundidade

Pergunte: "Quantos níveis de intensidade consigo representar?"

65. CCD x CMOS

CCD
CMOS
alta qualidade no material
maior velocidade no material
menor ruído no material
menor consumo no material
maior consumo
menor preço
maior custo
maior suscetibilidade a ruído conforme o slide







66. Pontual x Local x Global

Pontual: um pixel de entrada influencia o correspondente.

Local: uma vizinhança influencia o resultado.

Global: toda a imagem influencia.

67. Média x Mediana

Média: soma/divide, suaviza e pode borrar bordas.

Mediana: ordena e pega o meio, boa para sal e pimenta e tende a preservar melhor os contornos.

68. Max x Min x Moda

Max → maior valor.

Min → menor valor.

Moda → mais frequente.

69. Correlação x Convolução

Correlação → máscara como está.

Convolução → máscara girada 180°.

Máscara simétrica → não faz diferença prática.

70. D4 x D8 x Euclidiana

D4 → soma.

D8 → máximo.

Euclidiana → raiz.

71. Passa-baixa x Passa-alta

Passa-baixa → suavização.

Passa-alta → bordas e detalhes.

PARTE VI — EXERCÍCIOS DE REVISÃO

72. Questão 1 — Bits e níveis

Uma imagem possui 8 bits por pixel. Quantos níveis de intensidade podem ser representados?

Resposta: 2^8 = 256 níveis.

Como pensar

Sempre que aparecer "bits" e "níveis", use:

L = 2^k.

73. Questão 2 — Amostragem ou quantização?

Uma questão pergunta por qual processo a imagem é discretizada nas direções x e y.

Resposta: Amostragem.

Se perguntar número de níveis de cinza:

Resposta: Quantização.

74. Questão 3 — Negativo

Em uma imagem de 8 bits, um pixel possui valor 80. Qual o negativo?

255 − 80 = 175.

75. Questão 4 — Overflow

Dois pixels têm valores 220 e 80 e são somados em uma imagem de 8 bits.

220 + 80 = 300

Isso gera overflow.

Por truncamento, o resultado seria 255.

76. Questão 5 — Underflow

Um pixel vale 20 e outro 50. Ao subtrair:

20 − 50 = −30

Isso é underflow.

Por truncamento, o resultado seria 0.

77. Questão 6 — D4

P = (3,5)

Q = (10,11)

D4 = |3−10| + |5−11|

= 7 + 6

= 13.

78. Questão 7 — D8

P = (3,5)

Q = (10,11)

D8 = max(7,6) = 7.

79. Questão 8 — Euclidiana

Para os mesmos pontos:

DE = √(7² + 6²)

= √85

≈ 9,22.

80. Questão 9 — Filtro da média

Valores:

Plain Text


10 10 10
10 90 10
10 10 10



Média = 170/9 ≈ 18,89.

O slide apresenta o valor inteiro 18 na demonstração.

81. Questão 10 — Qual filtro usar?

Uma imagem possui ruído impulsivo do tipo sal e pimenta.

Resposta: Filtro da mediana.

82. Questão 11 — Qual filtro procurar?

Uma questão pede um método que diminua ruído e suavize transições, mesmo com possível borramento das bordas.

Resposta: Filtro de média / suavização passa-baixa.

83. Questão 12 — Bordas

Uma técnica precisa destacar mudanças bruscas de intensidade. Qual família de filtros deve ser lembrada?

Resposta: filtros de realce/gradiente, como Sobel, Prewitt e Roberts, conforme os slides.

84. Questão 13 — Correlação ou convolução?

A questão diz: "A máscara é girada 180° antes da operação."

Resposta: Convolução.

85. Questão 14 — Operador lógico

Se a questão disser "o resultado só é 1 quando ambos os pixels são 1", a operação é:

AND.

86. Questão 15 — Operador lógico

Se disser "resultado 1 quando os pixels são diferentes", é:

XOR.

PARTE VII — PEGADINHAS DE PROVA

87. Pegadinha: 8 bits = 8 níveis

❌ Errado.

8 bits = 256 níveis.

88. Pegadinha: quantização controla a quantidade de pixels

❌ Errado.

Quantização controla níveis de intensidade.

89. Pegadinha: amostragem é sobre tons

❌ Errado.

Amostragem está relacionada ao domínio espacial e à formação da matriz de pixels.

90. Pegadinha: mediana é média

❌ Errado.

Mediana depende da ordenação dos valores.

91. Pegadinha: overflow é valor negativo

❌ Errado.

Negativo abaixo de 0 = underflow.

Acima de 255 = overflow, em imagem de 8 bits.

92. Pegadinha: correlação sempre gira a máscara

❌ Errado.

Quem gira a máscara 180° é a convolução.

93. Pegadinha: passa-baixa destaca bordas

❌ No quadro conceitual dos slides, não.

Passa-baixa → suavização.

Passa-alta → realce/detalhes/bordas.

PARTE VIII — GUIA DE ESTUDO PARA A NP1

94. O que você precisa saber MUITO BEM

Nível 1 — memorize e entenda

•
o que é PDI;

•
RGB;

•
pixel;

•
amostragem;

•
quantização;

•
resolução espacial;

•
profundidade;

•
etapas do PDI;

•
CCD x CMOS;

•
operações pontuais, locais e globais;

•
overflow e underflow;

•
operadores lógicos;

•
D4, D8 e Euclidiana;

•
correlação x convolução;

•
média x mediana;

•
Max, Min e Moda;

•
passa-baixa x passa-alta;

•
Roberts, Sobel e Prewitt.

95. Fórmulas que merecem revisão final

Quantização

L = 2^k

Negativo

s = (L−1) − r

Para 8 bits:

s = 255 − r

Gamma

s = c · r^λ

D4

D4 = |i−k| + |j−l|

D8

D8 = max(|i−k|, |j−l|)

Euclidiana

DE = √[(i−k)² + (j−l)²]

Memória

Memória = pixels × bits/pixel ÷ 8

Tempo de transmissão

Tempo = tamanho / taxa

Filtragem espacial

g(x,y) = T[f(x,y)]

96. Como resolver questões numéricas

96.1 Classificação

Quando encontrar um problema de cálculo, NÃO comece substituindo números imediatamente. Faça primeiro uma leitura e classifique o tipo de questão.

96.2 Se aparecer:

bits + níveis → quantização.

largura + altura + bits → memória.

tamanho + Mbps/kbps → transmissão.

coordenadas de pixels → distância.

máscara + imagem → filtragem/convolução.

0 e 1 → operações lógicas.

ruído sal e pimenta → mediana.

bordas → gradiente/Sobel/Prewitt/Roberts.

96.3 Checklist para cálculo

1.
Identifique o que a questão quer.

2.
Anote a fórmula.

3.
Confirme as unidades.

4.
Substitua os valores.

5.
Faça a conta.

6.
Confira se o resultado faz sentido.




97. Como reconhecer uma questão conceitual

Se aparecer "discretizar x e y"

→ Amostragem.

Se aparecer "número de níveis de cinza"

→ Quantização.

Se aparecer "menor detalhe discernível"

→ Resolução espacial.

Se aparecer "bits por pixel"

→ Profundidade/resolução de intensidade.

Se aparecer "máscara e vizinhança"

→ Filtragem espacial.

Se aparecer "girar máscara 180°"

→ Convolução.

Se aparecer "ordenar valores e escolher o meio"

→ Mediana.

Se aparecer "maior frequência"

→ Moda.

Se aparecer "maior valor"

→ Max.

Se aparecer "menor valor"

→ Min.

Se aparecer "reduzir ruído e borrar"

→ Suavização/média.

Se aparecer "sal e pimenta"

→ Mediana.

Se aparecer "borda/contorno"

→ Sobel/Prewitt/Roberts/alta frequência, conforme o contexto.

PARTE IX — MAPA MENTAL COMPLETO

Plain Text


PROCESSAMENTO DE IMAGENS
│
├── FORMAÇÃO DA IMAGEM
│   ├── Cenário
│   ├── Luz
│   └── Sensor
│
├── CORES
│   └── RGB
│       ├── Red
│       ├── Green
│       └── Blue
│
├── AQUISIÇÃO
│   ├── CCD
│   └── CMOS
│
├── DIGITALIZAÇÃO
│   ├── Amostragem
│   │   └── pixels / espaço
│   └── Quantização
│       └── níveis / intensidade
│
├── RESOLUÇÃO
│   ├── Espacial
│   └── Intensidade
│
├── PDI
│   ├── Aquisição
│   ├── Pré-processamento
│   ├── Segmentação
│   ├── Extração
│   └── Reconhecimento
│
├── DOMÍNIO ESPACIAL
│   ├── Pontual
│   ├── Local
│   └── Global
│
├── TRANSFORMAÇÕES
│   ├── Negativo
│   ├── Log
│   └── Gamma
│
├── OPERAÇÕES
│   ├── Aritméticas
│   └── Lógicas
│
├── VIZINHANÇA
│   ├── N4
│   ├── N6
│   └── N8
│
├── DISTÂNCIAS
│   ├── D4
│   ├── D8
│   └── Euclidiana
│
└── FILTRAGEM
    ├── Média
    ├── Média ponderada
    ├── Mediana
    ├── Max
    ├── Min
    ├── Moda
    ├── Roberts
    ├── Sobel
    ├── Prewitt
    └── Frequência
        ├── Passa-baixa
        ├── Passa-alta
        ├── Passa-faixa
        └── Fourier






98. REVISÃO DE EMERGÊNCIA — 5 MINUTOS ANTES DA PROVA

Se você estiver literalmente entrando na sala agora, leia apenas esta parte.

Imagem digital

É uma representação numérica formada por pixels.

RGB

Vermelho, Verde e Azul.

Amostragem

Discretiza o espaço e forma a matriz de pixels.

Quantização

Define os níveis de intensidade.

8 bits

256 níveis.

Resolução espacial

Capacidade de distinguir detalhes espaciais.

Profundidade

Quantidade de níveis de intensidade.

Processo PDI

Aquisição → Pré-processamento → Segmentação → Extração → Reconhecimento.

CCD

Qualidade/baixo ruído, mas maior consumo no material.

🔟 CMOS

Mais rápido, menor consumo e menor custo no material.

Domínio espacial

Trabalha diretamente com pixels.

Pontual

Um pixel.

Local

Vizinhança.

Global

Imagem inteira.

Negativo

255 − r para 8 bits.

Gamma

λ < 1 clareia; λ > 1 escurece, segundo os exemplos dos slides.

Overflow

Passou do máximo.

Underflow

Abaixo do mínimo.

AND

Os dois precisam ser 1.

OR

Pelo menos um 1.

XOR

Diferentes.

NOT

Inverte.

D4

Soma das diferenças absolutas.

D8

Maior diferença.

Euclidiana

Raiz quadrada.

Correlação

Máscara não gira.

Convolução

Máscara gira 180°.

Média

Soma e divide. Suaviza, pode borrar.

Mediana

Ordena e pega o meio. Boa para sal e pimenta.

Max

Maior valor.

Min

Menor valor.

Moda

Mais frequente.

Passa-baixa

Suavização.

Passa-alta

Detalhes/bordas.

Roberts

Vizinhança 2×2.

Sobel e Prewitt

Gradiente/detecção de bordas.

99. CONCLUSÃO

99.1 O fio condutor

O grande fio condutor de todas as aulas é simples:

uma cena real precisa ser capturada → convertida em dados → representada por pixels → processada → analisada.

99.2 O que cada parte explica

•
A digitalização explica como o mundo contínuo vira uma imagem digital.

•
O domínio espacial mostra como atuar diretamente nos pixels.

•
A filtragem mostra como trabalhar sobre vizinhanças, reduzir ruído e realçar características.

•
As operações de distância e lógica fornecem ferramentas para comparar, combinar e analisar pixels e regiões.

99.3 Estratégia para a NP1

Para a NP1, a melhor estratégia é dominar as relações entre os conceitos, porque a mesma ideia pode aparecer em uma questão com palavras diferentes.

99.4 Pares fundamentais

Se você lembrar destes pares, já terá uma base forte:

Amostragem ↔ pixels

Quantização ↔ níveis

Espacial ↔ detalhes

Profundidade ↔ intensidade

Média ↔ suavização

Mediana ↔ sal e pimenta

Correlação ↔ sem giro

Convolução ↔ giro 180°

D4 ↔ soma

D8 ↔ máximo

Euclidiana ↔ raiz

Passa-baixa ↔ suavização

Passa-alta ↔ bordas

Overflow ↔ acima do limite

Underflow ↔ abaixo do limite

AND ↔ ambos

OR ↔ pelo menos um

XOR ↔ diferentes

NOT ↔ inversão


Boa prova! Estude primeiro as associações, depois faça os cálculos e, por último, volte aos exemplos dos slides. Você consegue!

Referências

[1] Material-base: slides das Aulas 0, 1, 2, 3 e 4 fornecidos para esta revisão
Este documento foi reorganizado e revisado editorialmente a partir do material-base fornecido. As fórmulas, exemplos e observações devem ser conferidos com os slides e com as orientações da disciplina quando houver diferença de convenção ou notação.
$pdi_content$;
BEGIN
  SELECT id INTO v_apostila_id
  FROM public.apostilas
  WHERE category ILIKE 'Processamento de Imagem e Visão Computacional'
     OR category ILIKE 'Processamento Digital de Imagens e Visão Computacional'
     OR title ILIKE '%Processamento de Imagem%Visão Computacional%'
     OR title ILIKE '%Processamento Digital de Imagens%Visão Computacional%'
  ORDER BY CASE WHEN title = 'Apostila de Revisão — NP1 — Processamento Digital de Imagens e Visão Computacional' THEN 0 ELSE 1 END, created_at
  LIMIT 1;

  IF v_apostila_id IS NULL THEN
    INSERT INTO public.apostilas (
      title, content, category, semester, source_type, published, status
    ) VALUES (
      'Apostila de Revisão — NP1 — Processamento Digital de Imagens e Visão Computacional',
      v_content,
      'Processamento de Imagem e Visão Computacional',
      6,
      'text',
      true,
      'liberada'
    )
    RETURNING id INTO v_apostila_id;
  ELSE
    UPDATE public.apostilas
    SET title = CASE
          WHEN title IS NULL OR title = '' OR title ILIKE '%placeholder%'
            THEN 'Apostila de Revisão — NP1 — Processamento Digital de Imagens e Visão Computacional'
          ELSE title
        END,
        content = v_content,
        category = 'Processamento de Imagem e Visão Computacional',
        semester = 6,
        published = true,
        status = 'liberada',
        source_type = COALESCE(source_type, 'text'),
        updated_at = now()
    WHERE id = v_apostila_id;
  END IF;

  -- Mantém o conteúdo disponível no leitor estruturado por páginas.
  IF EXISTS (
    SELECT 1 FROM public.apostila_pages
    WHERE apostila_id = v_apostila_id
      AND title = 'Apostila de Revisão — NP1'
  ) THEN
    UPDATE public.apostila_pages
    SET content = v_content, updated_at = now()
    WHERE apostila_id = v_apostila_id
      AND title = 'Apostila de Revisão — NP1';
  ELSE
    INSERT INTO public.apostila_pages (apostila_id, title, content, position)
    VALUES (v_apostila_id, 'Apostila de Revisão — NP1', v_content, 1);
  END IF;
END
$migration$;
