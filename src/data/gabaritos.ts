export type GabaritoQuestion = {
  question: number;
  answer: string;
  response?: string;
  prompt?: string;
  note?: string;
};

export type GabaritoUnit = {
  title: string;
  questions: GabaritoQuestion[];
  summary: string;
  notes?: string[];
};

export type GabaritoSubject = {
  code: string;
  name: string;
  keys: string[];
  units: GabaritoUnit[];
};

type Row = [number, string, string?, string?];

const unit = (title: string, summary: string, answers: Row[], notes?: string[]): GabaritoUnit => ({
  title,
  summary,
  notes,
  questions: answers.map(([question, answer, response, prompt]) => ({ question, answer, response, prompt })),
});

export const GABARITOS: GabaritoSubject[] = [
  {
    code: 'D90E_13701_R_20262',
    name: 'Ciência da Computação Interdisciplinar',
    keys: ['cienciadacomputacaointerdisciplinar', 'cienciadacomputacaointerdis'],
    units: [
      unit('Questionário Unidade I', '1-B, 2-E, 3-B, 4-E, 5-C, 6-B, 7-D, 8-B, 9-A, 10-C', [
        [1, 'B', 'Os resistores.', 'Componentes eletrônicos universalmente utilizados que oferecem oposição à passagem da corrente elétrica por meio da composição de seu material. Estamos definindo?'],
        [2, 'E', 'I, II e III.', 'Sobre a Lei de Ohm: I. relaciona tensão, corrente e resistência; II. remonta ao trabalho de Georg Ohm a partir de 1825; III. sua fórmula básica. Estão corretas apenas:'],
        [3, 'B', 'Ambas as asserções estão corretas e a segunda não justifica a primeira.', 'I. Um resistor sempre apresentará aquecimento, mesmo que imperceptível, quando submetido a uma corrente. PORQUE II. Ele se apresenta ao circuito como um estreitamento em uma estrada, produzindo "congestionamento" de elétrons.'],
        [4, 'E', 'Apenas a III está incorreta.', 'Sobre resistores fixos: I. os de carvão alteram gradualmente seu valor com o uso; II. os de filme (carbono ou metal) têm a mesma estrutura básica, variando o material resistivo; III. resistores de fio de valor ôhmico muito alto não são práticos por serem muito pequenos.'],
        [5, 'C', 'Potenciômetro.', 'Formados por uma pista resistiva (linear ou rotativa) sobre a qual desliza um elemento cursor, feita em carbono ou em fio níquel-cromo. A qual tipo de resistor nos referimos?'],
        [6, 'B', 'Apenas I e III.', 'Sobre os LDRs: I. são fotossensores simples e de baixo custo; II. no escuro apresentam baixa resistência e, iluminados, a resistência aumenta; III. são fabricados com sulfeto de cádmio ou de chumbo.'],
        [7, 'D', 'Série, corrente, soma.', 'Complete: "Quando associamos resistores em ___ , a ___ elétrica atravessa todos os resistores da malha, sempre a mesma, perfazendo uma resistência resultante como uma ___ dos valores de todos os resistores".'],
        [8, 'B', 'Associação de três resistores de 150 Ω, conforme a cópia pública.', 'Ohmildo precisa de um resistor de 500 Ω e só possui resistores de 150 Ω. Qual seria a melhor associação para obter o valor necessário?'],
        [9, 'A', 'Divisor de tensão.', 'É o circuito mais simples que há, podendo ser construído apenas com alguns resistores e uma bateria. Estamos definindo:'],
        [10, 'C', 'A queda de tensão sobre R1 será seis vezes maior do que sobre R2.', 'Em um circuito com dois resistores em série, R1 é seis vezes maior que R2. Marque a informação correta.'],
      ], ['Q8: as cópias públicas apresentam duplicidade/erro de formatação; compare a ordem das alternativas no enunciado atual.']),
      unit('Questionário Unidade II', '1-E, 2-C, 3-C, 4-B, 5-D, 6-A, 7-C, 8-E, 9-D, 10-A', [
        [1, 'E', 'Garrafas.', 'Antes da padronização e da medição em Farads, qual era a unidade adotada para expressar o valor dos capacitores?'],
        [2, 'C', 'Capacitância, Coulomb, Volt.', '"A ______ de um capacitor será de 1 Farad quando uma carga de 1 ______ produzir uma diferença de potencial de 1 ______ entre duas placas metálicas isoladas entre si".'],
        [3, 'C', 'Somente a III está incorreta (I e II corretas).', 'Sobre a construção dos capacitores: I. toda peça tem duas armaduras separadas por dielétrico; II. papel, poliéster, cerâmica, mica ou ar podem ser dielétricos; III. as armaduras usam fio de níquel-cromo.'],
        [4, 'B', 'J = 5%, K = 10% e M = 20%.', 'Para os capacitores, quais são os valores de tolerância representados pelas letras J, K e M?'],
        [5, 'D', '120 nF com tolerância de 20%.', 'Para um capacitor identificado com o código 124M, quais são os valores de capacitância e tolerância?'],
        [6, 'A', 'Ambas corretas e a II justifica a I.', 'I. Quando carregado, o capacitor comporta-se como uma chave aberta. PORQUE II. Uma vez carregado, não permite passagem de corrente, algo possível apenas quando descarregado.'],
        [7, 'C', 'Apenas a III está incorreta.', 'Capacitores em corrente alternada: I. ficam em ciclo constante de carga e descarga; II. reatância capacitiva é a oposição à corrente alternada; III. não apresentam nenhuma oposição à circulação da corrente.'],
        [8, 'E', 'I, II e III corretas.', 'Uso de capacitores como filtros: I. são usados em fontes de alimentação; II. tornam plana a ondulação da corrente contínua pulsante na saída do retificador; III. eletrolíticos acima de uma centena de microfarads são adequados.'],
        [9, 'D', 'Apenas a IV está incorreta.', 'Sobre capacitores: I. poliéster de capacitância muito alta é grande demais; II. cerâmicos podem ter isolação acima de 1.000 V; III. eletrolíticos exigem polaridade; IV. capacitores de papel conservam-se muito bem ao longo do tempo.'],
        [10, 'A', 'Dificuldade na troca posterior do circuito integrado.', 'Na montagem "Ilhas Manhattan", qual a principal desvantagem de montar um circuito integrado pelo método dead bug?'],
      ], ['Q2 a Q5 e Q7 a Q9: as cópias públicas duplicam alternativas; confira a ordem das letras no enunciado atual.']),
    ],
  },
  {
    code: 'D01F_13701_R_20262',
    name: 'Ciência de Dados',
    keys: ['cienciadedados'],
    units: [
      unit('Questionário Unidade I', '1-C, 2-B, 3-B, 4-A, 5-E, 6-D, 7-E, 8-C, 9-D, 10-B', [
        [1, 'C', 'Modelagem.', 'Empresa que deseja prever a demanda futura de produtos: etapa em que são desenvolvidos os modelos de mineração de dados.'],
        [2, 'B', 'Underfitting.', 'Modelo muito simples, com dificuldade de capturar padrões e desempenho insatisfatório já nos dados de treinamento.'],
        [3, 'B', 'Ajustar os parâmetros do modelo para minimizar a função de perda.', 'Qual é o objetivo do treinamento de um modelo de aprendizado de máquina?'],
        [4, 'A', 'As variáveis são independentes umas das outras ao fazer previsões.', 'Qual suposição é feita pelos algoritmos de Naive Bayes?'],
        [5, 'E', 'Selecionar características relevantes, escolher o algoritmo, ajustar hiperparâmetros e avaliar rigorosamente.', 'Quais parâmetros são necessários para obter bons resultados em uma tarefa de classificação?'],
        [6, 'D', 'A automática baseia-se em regras/algoritmos; a manual, na interpretação humana.', 'Qual a diferença entre sumarização automática e sumarização manual?'],
        [7, 'E', 'Dados de validação/teste e métricas como acurácia, precisão, recall e F1-score.', 'O que é necessário para avaliar o desempenho de um modelo?'],
        [8, 'C', 'Limpeza, transformação e redução de dados brutos para torná-los adequados à análise.', 'Qual é a definição de pré-processamento de dados?'],
        [9, 'D', 'Volume, Velocidade e Variedade.', 'Quais são as características de Big Data segundo Laney?'],
        [10, 'B', 'Regressão Logística.', 'Modelo de classificação binária que estima a probabilidade por meio de uma função logística.'],
      ]),
      unit('Questionário Unidade II', '1-D, 2-C, 3-B, 4-E, 5-A, 6-C, 7-E, 8-D, 9-A, 10-B', [
        [1, 'D', 'Coleta de dados.', 'Etapa do processo de análise de dados que envolve obter as informações necessárias.'],
        [2, 'C', 'Normalização Z-score.', 'Técnica que transforma os dados para média zero e desvio-padrão um.'],
        [3, 'B', 'Permite uma avaliação justa e imparcial do desempenho do modelo.', 'Principal vantagem da validação cruzada em relação ao split tradicional de treino e teste.'],
        [4, 'E', 'Todas as alternativas estão corretas.', 'Qual a importância do benchmarking em Ciência de Dados?'],
        [5, 'A', 'Reduzir a dimensionalidade do texto.', 'Qual o objetivo da remoção de stopwords em Processamento de Linguagem Natural?'],
        [6, 'C', 'Vigilância por vídeo.', 'Qual aplicação está associada à visão computacional?'],
        [7, 'E', 'Quando a variável de resposta é categórica e binária.', 'Em qual situação a regressão logística é mais apropriada?'],
        [8, 'D', 'A acurácia não fornece uma medida geral adequada do desempenho.', 'Qual é a limitação da acurácia na avaliação de modelos?'],
        [9, 'A', 'Melhorar a precisão do diagnóstico por meio da análise de registros médicos eletrônicos.', 'Como o PLN é utilizado na área da saúde?'],
        [10, 'B', 'Economizar tempo e recursos usando recursos de IA pré-criados.', 'Qual a principal vantagem do uso de APIs de inteligência artificial?'],
      ], ['Q2: a fonte pública indica C apesar da proximidade entre normalização e padronização.', 'Q6: diagnóstico por imagem também é visão computacional, mas a fonte registra vigilância por vídeo.']),
    ],
  },
  {
    code: 'D84G_13701_D_20262',
    name: 'Educação Ambiental',
    keys: ['educacaoambiental'],
    units: [
      unit('Questionário Unidade I', '1-D, 2-A, 3-A, 4-A, 5-C, 6-C, 7-A, 8-D, 9-B, 10-D', [
        [1, 'D', 'Conscientizar e tornar aptos a agir para a resolução de problemas ambientais.', 'A Educação Ambiental é uma dimensão dada ao conteúdo e à prática da Educação, orientada à solução de problemas concretos. Segundo os órgãos oficiais, ela deve:'],
        [2, 'A', 'Ocorreu a Primeira Conferência sobre o Meio Ambiente, em Estocolmo.', 'A década de 1970 foi importante para o meio ambiente porque:'],
        [3, 'A', 'Por meio da conscientização pública para a preservação do meio ambiente.', 'Podemos afirmar que a educação ambiental deve ser oferecida:'],
        [4, 'A', 'A legislação brasileira garante presença em ambiente formal e não formal.', 'A educação ambiental deve estar presente em todos os níveis educacionais. Podemos dizer que:'],
        [5, 'C', 'São os processos por meio dos quais se constroem valores sociais voltados à conservação do meio ambiente.', 'No âmbito da Política Nacional de Educação Ambiental, podemos afirmar que:'],
        [6, 'C', 'Está voltada aos problemas prementes de hoje e prepara o mundo para os desafios do próximo século.', 'Em relação à Agenda 21, podemos afirmar que:'],
        [7, 'A', 'Década de 1960.', 'Os alertas de ambientalistas aos governos sobre a crise ambiental iniciaram em qual década?'],
        [8, 'D', 'Porque a sociedade mudou a forma de organizar-se social e economicamente.', 'Após a Revolução Industrial houve aumento da poluição e início da crise ambiental. Por que isso ocorreu?'],
        [9, 'B', 'Entendeu-se que as desigualdades sociais se relacionam com os problemas ambientais.', 'A Conferência da ONU sobre meio ambiente e desenvolvimento (RIO-92) foi importante pois, pela primeira vez:'],
        [10, 'D', 'Rio de Janeiro, 1992.', 'O slogan "pensar globalmente e agir localmente" foi criado a partir de qual conferência?'],
      ]),
      unit('Questionário Unidade II', '1-A, 2-B, 3-E, 4-A, 5-B, 6-D, 7-E, 8-D, 9-B, 10-D', [
        [1, 'A', 'Constante – natural – multidisciplinar – atitudes.', 'Educação ambiental é um processo que envolve aprendizado ______ sobre o mundo ______, com abordagens baseadas no conhecimento ______, resultando em ______ e estratégias de ação.'],
        [2, 'B', 'Tbilisi, 1977.', 'Conferência em que foram delineados os eixos norteadores da Educação Ambiental e o meio ambiente passou a ser definido como conjunto de sistemas naturais e sociais.'],
        [3, 'E', 'Integração entre a natureza selvagem e as paisagens modernas.', 'Pensando nas relações entre homem e natureza, assinale a alternativa correta.'],
        [4, 'A', 'Acreditar que há apenas uma resposta correta fragmenta a complexidade e encerra o problema em disciplinas.', 'Sobre a interdisciplinaridade e o texto "O mundo da vida não cabe em gavetas", Carvalho (1998) afirma que:'],
        [5, 'B', 'Segmentação da totalidade.', 'Qual alternativa NÃO faz parte da interdisciplinaridade?'],
        [6, 'D', 'I e III corretas.', 'I. A interdisciplinaridade articula disciplinas para alcançar a visão do todo; II. dialogar com outras formas de conhecimento não deve ser incentivado sem esse hábito; III. decorre mais do encontro de indivíduos do que de disciplinas.'],
        [7, 'E', 'Satisfazer as necessidades presentes sem afetar as próximas gerações.', 'Desenvolvimento sustentável relaciona-se ao progresso com preservação do ambiente. Podemos afirmar que:'],
        [8, 'D', 'Concentrar-se nas situações atuais ignorando a perspectiva histórica.', 'Dentro dos conceitos de Educação Ambiental, podemos afirmar que ela NÃO deve:'],
        [9, 'B', 'A utilização predatória e a geração de resíduos alteram a qualidade do meio ambiente.', 'Do ponto de vista do uso dos recursos naturais, podemos afirmar que:'],
        [10, 'D', 'I, II e III corretas; IV falsa.', 'Legislação brasileira de educação ambiental: I. surge de reuniões intragovernamentais e internacionais; II. assume compromissos com humanidade e planeta; III. é rica e completa; IV. dificulta ações específicas.'],
      ], ['Q3, Q6, Q7, Q8, Q9 e Q10: as cópias públicas deslocam a ordem das alternativas; confira a letra correspondente ao texto no AVA atual.']),
    ],
  },
  {
    code: 'D50E_13701_D_20262',
    name: 'Geometria Analítica',
    keys: ['geometriaanalitica'],
    units: [
      unit('Questionário Unidade I', '1-B, 2-A, 3-B, 4-A, 5-conferir, 6-E, 7-conferir, 8-C, 9-B, 10-B', [
        [1, 'B', 'Força, velocidade e aceleração.', 'Assinale a alternativa que apresenta apenas grandezas vetoriais.'],
        [2, 'A', 'Apenas I e II.', 'Segmentos orientados: I. são paralelos quando têm a mesma direção; II. são colineares quando estão na mesma reta; III. em um segmento não nulo, origem e extremidade coincidem.'],
        [3, 'B', 'I, II e III.', 'Vetor unitário tem módulo 1; versor tem mesma direção/sentido e módulo 1; vetores iguais têm mesmo módulo, direção e sentido.'],
        [4, 'A', 'Apenas I e II.', 'Soma pela regra do polígono: colocar os vetores em sequência; vários vetores podem ser somados; a soma não se limita a dois vetores.'],
        [5, '—', 'A fonte pública ficou truncada antes de preservar o enunciado/imagem.'],
        [6, 'E', 'Apenas III.'],
        [7, '—', 'A fonte pública ficou truncada antes de preservar o enunciado/imagem.'],
        [8, 'C', 'I, II e III.', 'Módulo de um vetor: é o comprimento do vetor, calculado pela fórmula indicada, e resulta em um escalar.'],
        [9, 'B', 'Apenas I e III.', 'Soma de vetores: feita coordenada a coordenada; os métodos gráfico e algébrico dão o mesmo resultado; a soma indicada é o vetor nulo.'],
        [10, 'B', 'Apenas I e III.', 'Dependência linear: vetores são LD quando paralelos à mesma reta; a afirmação de LI para vetores paralelos é falsa; a condição algébrica indicada torna-os LD.'],
      ], ['Q5 e Q7: não foram preenchidas com letra para evitar inventar resposta sem o enunciado visual atual.']),
      unit('Questionário Unidade II', '1-A, 2-B, 3-C, 4-A, 5-E, 6-C, 7-C, 8-C, 9-D, 10-A', [
        [1, 'A', 'Produto escalar igual a 1 na cópia pública.', 'Dados os vetores exibidos como imagem, calcule o produto escalar.'],
        [2, 'B', 'I, II e III.', 'Produto escalar: o resultado é escalar; o produto de vetores perpendiculares é zero; a ordem dos fatores não altera o resultado.'],
        [3, 'C', 'Vetores perpendiculares.', 'Dados os vetores exibidos como imagem, classifique a relação entre eles.'],
        [4, 'A', 'Vetores paralelos e de mesmo sentido.', 'Dados os vetores exibidos como imagem, classifique a relação entre eles.'],
        [5, 'E', 'Produto escalar maior que zero.', 'Dados os vetores exibidos como imagem, indique a conclusão correta.'],
        [6, 'C', 'Vetores perpendiculares.', 'Dados os vetores exibidos como imagem, classifique a relação entre eles.'],
        [7, 'C', 'I, II e III.', 'Dependência linear, paralelismo e igualdade entre o módulo do produto vetorial e o produto dos módulos.'],
        [8, 'C', 'I, II e III.', 'Projeção ortogonal: decomposição em parcela paralela e perpendicular; a projeção paralela é um escalar vezes o vetor; a parcela perpendicular é a diferença.'],
        [9, 'D', 'Apenas II e III.', 'Produto vetorial: não é escalar; é um vetor perpendicular ao plano dos vetores; é anticomutativo.'],
        [10, 'A', 'Apenas I e II.', 'Vetores paralelos, de mesmo sentido ou opostos, têm produto vetorial nulo; a terceira afirmação trata da área do triângulo.'],
      ], ['Q1: os vetores foram ocultados na extração pública; confira a operação no enunciado atual.', 'Q7: a tentativa pública registra pontuação parcial; requer conferência.']),
    ],
  },
  {
    code: 'D60E_13701_D_20262',
    name: 'Lógica Matemática',
    keys: ['logicamatematica'],
    units: [
      unit('Questionário Unidade I', '1-C, 2-B, 3-C, 4-B, 5-C, 6-C, 7-B, 8-D, 9-D, 10-B', [
        [1, 'C', 'A disjunção de duas proposições falsas é falsa; a II é falsa.', 'Análise de afirmações com atribuição de valores lógicos 1/0.'],
        [2, 'B', 'A conjunção indicada é falsa e a III é falsa.', 'Análise de afirmações com atribuição de valores lógicos.'],
        [3, 'C', 'Princípios da lógica: identidade, não contradição e terceiro excluído.', 'A proposição indicada é simples; "2 é par ou ímpar" é composta.'],
        [4, 'B', '"5 é par ou ímpar" é verdadeira; "15 é primo ou composto" é verdadeira; "2 é ímpar e primo" é falsa.', 'Avaliação do valor lógico de proposições compostas.'],
        [5, 'C', 'A afirmação II é falsa; o número de linhas para n proposições é 2ⁿ (para três, 8).', 'Sobre tabelas-verdade.'],
        [6, 'C', '"Se 2 é par, então é primo" é falsa.', 'Sobre a condicional p → q e sua tabela-verdade.'],
        [7, 'B', 'Com p=1 e q=0, a III é falsa.', 'Expressão p ∧ q ∨ r com duas parentetizações diferentes.'],
        [8, 'D', 'As três afirmações são avaliadas como verdadeiras.', 'Sobre a negação de p.'],
        [9, 'D', 'Todas as afirmações estão corretas.', 'Lógica dedutiva, indutiva e o marco aristotélico.'],
        [10, 'B', 'A pergunta sobre a capital de São Paulo não é proposição.', 'Proposição é uma sentença declarativa; identifique as frases declarativas.'],
      ]),
      unit('Questionário Unidade II', '1-D, 2-D, 3-D, 4-B, 5-C, 6-D, 7-B, 8-D, 9-B, 10-A', [
        [1, 'D', 'I, II e III verdadeiras.', 'Equivalência lógica: bicondicional tautológica; tautologias/contradições equivalentes; relação reflexiva, simétrica e transitiva.'],
        [2, 'D', 'I verdadeira; II e III falsas.', 'Sentenças e formulações matemáticas parcialmente perdidas na extração pública.'],
        [3, 'D', 'I, II e III verdadeiras.', 'Uma tabela-verdade pode resultar em contingência, contradição ou tautologia; a II define tautologia.'],
        [4, 'B', 'I e II verdadeiras; III falsa.', 'Operações lógicas ajudam a analisar argumentos; um argumento reúne premissas e conclusão.'],
        [5, 'C', 'I e III verdadeiras; II falsa.', 'Premissas verdadeiras não garantem a conclusão; a validade é propriedade da forma.'],
        [6, 'D', 'I, II e III verdadeiras.', 'Argumento: "se é dia de semana, João vai à escola; não foi; logo é domingo".'],
        [7, 'B', 'I e II verdadeiras; III falsa.', 'Argumento sobre trabalhar, estudar e aprovação.'],
        [8, 'D', 'I, II e III verdadeiras.', 'Contradição é sempre falsa; contingência não é tautologia nem contradição.'],
        [9, 'B', 'I e II verdadeiras; III falsa.', 'Enunciado truncado na cópia pública.'],
        [10, 'A', 'I e II falsas; III verdadeira.', 'Formulações truncadas na cópia pública.'],
      ]),
    ],
  },
  {
    code: 'D105_13701_R_20262',
    name: 'Métodos de Pesquisa',
    keys: ['metodosdepesquisa', 'metodospesquisa'],
    units: [
      unit('Questionário Unidade I', '1-E, 2-D, 3-A, 4-D, 5-B, 6-A, 7-A, 8-C, 9-D, 10-E', [
        [1, 'E', 'A escolha das técnicas deve considerar o objetivo e os recursos materiais, temporais e pessoais.', 'Sobre métodos de pesquisa, assinale a alternativa correta.'],
        [2, 'D', 'I, II e III incorretas.', 'Etapa do trabalho científico em pesquisa qualitativa: I. análise quantitativa confirmando hipóteses; II. objetividade por lógica formal e neutralidade; III. validação por processos dedutivos matemáticos.'],
        [3, 'A', 'Corretas apenas I e II.', 'Relatório técnico: I. descreve fatos verificados por investigação; II. divulga e registra dados técnicos; III. serviria principalmente para registrar oposição de ideias.'],
        [4, 'D', 'Grupo focal e observação participante são instrumentos qualitativos.', 'Sobre instrumentos qualitativos e quantitativos de coleta de dados.'],
        [5, 'B', 'Corretas I e II.', 'Revisão de literatura: I. subsidia hipóteses e correlações; II. informa trabalhos recentes; III. define objetivos geral e específicos.'],
        [6, 'A', 'Corretas I e II.', 'Etapas do trabalho acadêmico: I. a amostra usa técnicas estatísticas; II. a tabulação organiza dados; III. a conclusão não precisa apoiar-se em dados comprovados.'],
        [7, 'A', 'Corretas I e II.', 'Observação: I. a não participante mantém o observador como espectador; II. pode ser espontânea ou planejada; III. quanto mais inespecífica, melhor.'],
        [8, 'C', 'Corretas I e III.', 'Pesquisa qualitativa: I. trabalha com universo de significados e valores; II. não há complementaridade com a quantitativa; III. a diferença é de natureza, não hierárquica.'],
        [9, 'D', 'Corretas I e III.', 'Procedimentos qualitativos: I. observação participante e entrevista aberta; II. roteiro aberto dá menos liberdade; III. a pesquisa-ação soma intervenção.'],
        [10, 'E', 'Estudo etnográfico.', 'Pesquisa em que o pesquisador interage para identificar cotidiano, valores e práticas culturais.'],
      ]),
      unit('Questionário Unidade II', '1-D, 2-D, 3-C, 4-A, 5-C, 6-E, 7-A, 8-A, 9-D, 10-C', [
        [1, 'D', 'Escolher e delimitar um tema.', 'Qual é a primeira etapa antes de escrever um trabalho científico?'],
        [2, 'D', 'Somente a IV está incorreta.', 'Hipóteses: I. respostas provisórias; II. direcionam a investigação; III. avaliam pressupostos; IV. não requerem reflexão prévia.'],
        [3, 'C', 'Cronograma de execução.', 'Qual etapa responde à pergunta "quando pesquisar?".'],
        [4, 'A', 'Definição do problema, hipóteses, base teórica e conceitual.', 'Qual etapa responde à pergunta "o que pesquisar?".'],
        [5, 'C', 'Objetivos do estudo, propósitos.', 'Qual etapa responde à pergunta "para que pesquisar?".'],
        [6, 'E', 'Orçamento.', 'Qual etapa responde à pergunta "com que recursos pesquisar?".'],
        [7, 'A', 'Justificativa da escolha do problema.', 'Qual etapa responde à pergunta "por que pesquisar?".'],
        [8, 'A', 'O projeto pode ser modificado, adaptando-se a novas contingências.', 'Sobre o projeto de pesquisa, assinale a alternativa correta.'],
        [9, 'D', 'Projeto de pesquisa.', 'Documento elaborado na fase de planejamento e preparação da pesquisa.'],
        [10, 'C', 'Benefícios gerados pelos resultados da pesquisa.', 'Qual item NÃO precisa ser considerado no projeto de pesquisa?'],
      ]),
    ],
  },
  {
    code: 'D96B_13701_D_20262',
    name: 'Tópicos de Matemática Aplicada',
    keys: ['topicosdematematicaaplicada', 'topicosdematematica', 'matematicaaplicada'],
    units: [
      unit('Questionário Unidade I', '1-D, 2-B, 3-B, 4-D, 5-C, 6-C, 7-C, 8-C, 9-C, 10-D', [
        [1, 'D', 'Ambas verdadeiras e a II justifica a I.', 'f(x) = 3x é crescente porque o coeficiente angular é positivo.'],
        [2, 'B', 'I, II e III.', 'f(x) = x + 1 é função de 1º grau, tem coeficiente angular 1 e cruza o eixo y em 1.'],
        [3, 'B', 'I, II e III.', 'f(x) = 2x + 1 e g(x) = 2x − 1 são de 1º grau, retas paralelas e crescentes.'],
        [4, 'D', 'Ambas verdadeiras e a II justifica a I.', 'y₁ = x + 4 e y₂ = −x − 1 são perpendiculares porque o produto dos coeficientes angulares é −1.'],
        [5, 'C', 'I, II e III.', 'g(x) = (m − 3)x + 1: com m = 3 é constante; m = 4 crescente; m = 0 decrescente.'],
        [6, 'C', 'I, II e III.', 'f(x) = x² é de 2º grau, função par e passa por (0,0).'],
        [7, 'C', 'I, II e III.', 'Função de 2º grau: discriminante positivo gera duas raízes reais distintas; zero, uma raiz; negativo, nenhuma real.'],
        [8, 'C', 'I, II e III.', 'Vértice: mínimo se a > 0; máximo se a < 0; sobre o eixo x quando Δ = 0.'],
        [9, 'C', 'Raiz igual a 1.', 'Qual é a raiz de f(x) = 10x − 10?'],
        [10, 'D', 'Coeficientes angular e linear iguais a 1 e 0.', 'Função de 1º grau com f(0) = 0 e f(2) = 2: quais são os coeficientes?'],
      ]),
      unit('Questionário Unidade II', '1-D, 2-E, 3-B, 4-C, 5-D, 6-B, 7-C, 8-A, 9-C, 10-A', [
        [1, 'D', 'A é uma matriz 2×3.', 'Considerando a matriz A exibida como imagem, analise a afirmação sobre sua ordem.'],
        [2, 'E', 'B é uma matriz 3×2.', 'Considerando a matriz B exibida como imagem, analise a afirmação sobre sua ordem.'],
        [3, 'B', 'x = 1, y = 0 e z = 0.', 'Igualdade matricial exibida como imagem: determine x, y e z.'],
        [4, 'C', 'AB resulta em uma matriz quadrada.', 'A é 2×3 e B é 3×2. O que se pode afirmar sobre o produto AB?'],
        [5, 'D', 'A deve ser de ordem 20×30.', 'B é 30×20; para que AB seja quadrada, qual deve ser a ordem de A?'],
        [6, 'B', 'Soma das matrizes exibidas como imagem.', 'Calcule a soma das matrizes apresentadas no enunciado.'],
        [7, 'C', 'Matriz transposta.', 'Determine a transposta da matriz exibida como imagem.'],
        [8, 'A', 'Matriz oposta.', 'Determine a matriz oposta da matriz exibida como imagem.'],
        [9, 'C', 'Determinante igual a −11.', 'Calcule o determinante da matriz exibida como imagem.'],
        [10, 'A', 'Matriz dos coeficientes.', 'Sistema linear exibido como imagem: identifique a matriz dos coeficientes.'],
      ], ['Q6, Q7, Q8 e Q10: as imagens das matrizes não foram preservadas na extração pública; confira as matrizes no enunciado atual.']),
    ],
  },
];

export const normalizeSubjectKey = (value: string) => value
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]/g, '');

export const findGabaritoSubject = (value: string) => {
  const key = normalizeSubjectKey(value);
  if (key.length < 5) return undefined;

  // 1) Match exato por nome, código ou chave declarada
  const exact = GABARITOS.find((subject) =>
    normalizeSubjectKey(subject.name) === key ||
    normalizeSubjectKey(subject.code) === key ||
    subject.keys.includes(key),
  );
  if (exact) return exact;

  // 2) Match parcial controlado (evita falsos positivos com chaves curtas)
  return GABARITOS.find((subject) =>
    subject.keys.some((candidate) => candidate.length >= 8 && (key.includes(candidate) || candidate.includes(key))),
  );
};
