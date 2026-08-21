export type GabaritoQuestion = {
  question: number;
  answer: string;
  response?: string;
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

const unit = (title: string, summary: string, answers: Array<[number, string, string?]>, notes?: string[]): GabaritoUnit => ({
  title,
  summary,
  notes,
  questions: answers.map(([question, answer, response]) => ({ question, answer, response })),
});

export const GABARITOS: GabaritoSubject[] = [
  {
    code: 'D90E_13701_R_20262',
    name: 'Ciência da Computação Interdisciplinar',
    keys: ['cienciadacomputacaointerdisciplinar', 'cienciadacomputacaointerdis'],
    units: [
      unit('Questionário Unidade I', '1-B, 2-E, 3-B, 4-E, 5-C, 6-B, 7-D, 8-B, 9-A, 10-C', [
        [1, 'B', 'Resistores.'], [2, 'E', 'I, II e III sobre a Lei de Ohm.'], [3, 'B', 'Ambas as asserções estão corretas e a segunda não justifica a primeira.'], [4, 'E', 'Apenas a III está incorreta.'], [5, 'C', 'Potenciômetro.'], [6, 'B', 'Apenas I e III.'], [7, 'D', 'Série, corrente, soma.'], [8, 'B', 'Três resistores de 150 Ω em paralelo, conforme a cópia pública.'], [9, 'A', 'Divisor de tensão.'], [10, 'C', 'A queda de tensão em R1 é seis vezes maior que em R2.'],
      ], ['Q8: as cópias públicas apresentam duplicidade/erro de formatação; compare a ordem das alternativas no enunciado atual.']),
      unit('Questionário Unidade II', '1-E, 2-C, 3-C, 4-B, 5-D, 6-A, 7-C, 8-E, 9-D, 10-A', [
        [1, 'E', 'Garrafas.'], [2, 'C', 'Capacitância, Coulomb, Volt.'], [3, 'C', 'I e II apenas.'], [4, 'B', '5%, 10% e 20%.'], [5, 'D', '120 nF, 20%.'], [6, 'A', 'Ambas corretas e II justifica I.'], [7, 'C', 'III apenas incorreta.'], [8, 'E', 'I, II e III.'], [9, 'D', 'IV apenas incorreta.'], [10, 'A', 'Dificuldade na troca posterior do circuito integrado.'],
      ]),
    ],
  },
  {
    code: 'D01F_13701_R_20262',
    name: 'Ciência de Dados',
    keys: ['cienciadedados'],
    units: [
      unit('Questionário Unidade I', '1-C, 2-B, 3-B, 4-A, 5-E, 6-D, 7-E, 8-C, 9-D, 10-B', [
        [1, 'C', 'Modelagem.'], [2, 'B', 'Underfitting.'], [3, 'B', 'Ajustar os parâmetros do modelo para minimizar a função de perda.'], [4, 'A', 'As variáveis são independentes umas das outras ao fazer suas previsões.'], [5, 'E', 'Selecionar características relevantes, escolher o algoritmo, ajustar hiperparâmetros e avaliar rigorosamente.'], [6, 'D', 'Sumarização automática baseada em regras/algoritmos, enquanto a manual depende da interpretação humana.'], [7, 'E', 'Dados de validação/teste e métricas como acurácia, precisão, recall e F1-score.'], [8, 'C', 'Limpeza, transformação e redução de dados brutos para análise.'], [9, 'D', 'Volume, Velocidade e Variedade.'], [10, 'B', 'Regressão Logística.'],
      ]),
      unit('Questionário Unidade II', '1-D, 2-C, 3-B, 4-E, 5-A, 6-C, 7-E, 8-D, 9-A, 10-B', [
        [1, 'D', 'Coleta de dados.'], [2, 'C', 'Normalização Z-score.'], [3, 'B', 'Usa diferentes partes dos dados alternadamente para treinamento e validação.'], [4, 'E', 'Todas as alternativas estão corretas.'], [5, 'A', 'Reduzir a dimensionalidade do texto.'], [6, 'C', 'Vigilância por vídeo.'], [7, 'E', 'Quando a variável de resposta é categórica e binária.'], [8, 'D', 'A acurácia isolada não fornece uma medida geral adequada do desempenho.'], [9, 'A', 'Melhorar a precisão do diagnóstico por meio da análise de registros médicos eletrônicos.'], [10, 'B', 'Economizar tempo e recursos usando recursos de IA pré-criados.'],
      ], ['Q2: a fonte pública indica C apesar da proximidade entre normalização e padronização.', 'Q6: a fonte confirma C, embora diagnóstico por imagem também seja aplicação de visão computacional.']),
    ],
  },
  {
    code: 'D84G_13701_D_20262',
    name: 'Educação Ambiental',
    keys: ['educacaoambiental'],
    units: [
      unit('Questionário Unidade I', '1-D, 2-A, 3-A, 4-A, 5-C, 6-C, 7-A, 8-D, 9-B, 10-D', [
        [1, 'D', 'Conscientizar e tornar aptos a agir para resolução de problemas ambientais.'], [2, 'A', 'Primeira Conferência sobre o Meio Ambiente, em Estocolmo.'], [3, 'A', 'Por meio da conscientização pública para preservação do meio ambiente.'], [4, 'A', 'A legislação garante presença em ambiente formal e não formal.'], [5, 'C', 'Processos que constroem valores sociais voltados à conservação do meio ambiente.'], [6, 'C', 'A Agenda 21 trata dos problemas atuais e prepara para os desafios do próximo século.'], [7, 'A', 'Década de 1960.'], [8, 'D', 'A sociedade mudou sua forma de organização social e econômica.'], [9, 'B', 'Desigualdades sociais relacionam-se com problemas ambientais.'], [10, 'D', 'Rio de Janeiro, 1992.'],
      ]),
      unit('Questionário Unidade II', '1-A, 2-B, 3-E, 4-A, 5-B, 6-D, 7-E, 8-D, 9-B, 10-D', [
        [1, 'A', 'Constante, natural, multidisciplinar, atitudes.'], [2, 'B', 'Tbilisi, 1977.'], [3, 'E', 'Integração entre natureza selvagem e paisagens modernas.'], [4, 'A', 'Uma única resposta fragmenta a complexidade e a encerra em disciplinas.'], [5, 'B', 'Segmentação da totalidade.'], [6, 'D', 'I e III.'], [7, 'E', 'Satisfazer necessidades presentes sem afetar as próximas gerações.'], [8, 'D', 'Não se concentrar nas situações atuais ignorando a perspectiva histórica.'], [9, 'B', 'O uso predatório e a geração de resíduos alteram a qualidade ambiental.'], [10, 'D', 'I, II e III apenas.'],
      ]),
    ],
  },
  {
    code: 'D50E_13701_D_20262',
    name: 'Geometria Analítica',
    keys: ['geometriaanalitica'],
    units: [
      unit('Questionário Unidade I', '1-B, 2-A, 3-B, 4-A, 5-conferir, 6-E, 7-conferir, 8-C, 9-B, 10-B', [
        [1, 'B', 'Força, velocidade e aceleração.'], [2, 'A', 'Apenas I e II.'], [3, 'B', 'I, II e III.'], [4, 'A', 'Apenas I e II.'], [5, '—', 'A fonte pública ficou truncada antes de preservar o enunciado/imagem.'], [6, 'E', 'Apenas III.'], [7, '—', 'A fonte pública ficou truncada antes de preservar o enunciado/imagem.'], [8, 'C', 'I, II e III.'], [9, 'B', 'Apenas I e III.'], [10, 'B', 'Apenas I e III.'],
      ], ['Q5 e Q7: não foram preenchidas com letra para evitar inventar resposta sem o enunciado visual atual.']),
      unit('Questionário Unidade II', '1-A, 2-B, 3-C, 4-A, 5-E, 6-C, 7-C, 8-C, 9-D, 10-A', [
        [1, 'A', 'A fonte confirma A, mas os vetores/expressões foram ocultados; confira a conta no enunciado atual.'], [2, 'B', 'I, II e III.'], [3, 'C', 'Vetores perpendiculares.'], [4, 'A', 'Vetores paralelos e de mesmo sentido.'], [5, 'E', 'Produto escalar maior que zero.'], [6, 'C', 'Vetores perpendiculares.'], [7, 'C', 'I, II e III.'], [8, 'C', 'I, II e III.'], [9, 'D', 'Apenas II e III.'], [10, 'A', 'Apenas I e II.'],
      ], ['Q1: os vetores foram ocultados na extração pública; confira a operação no enunciado atual.']),
    ],
  },
  {
    code: 'D60E_13701_D_20262',
    name: 'Lógica Matemática',
    keys: ['logicamatematica'],
    units: [
      unit('Questionário Unidade I', '1-C, 2-B, 3-C, 4-B, 5-C, 6-C, 7-B, 8-D, 9-D, 10-B', [
        [1, 'C'], [2, 'B'], [3, 'C'], [4, 'B'], [5, 'C'], [6, 'C'], [7, 'B'], [8, 'D'], [9, 'D'], [10, 'B'],
      ]),
      unit('Questionário Unidade II', '1-D, 2-D, 3-D, 4-B, 5-C, 6-D, 7-B, 8-D, 9-B, 10-A', [
        [1, 'D', 'I, II e III verdadeiras.'], [2, 'D', 'I verdadeira; II e III falsas.'], [3, 'D', 'I, II e III verdadeiras.'], [4, 'B', 'I e II verdadeiras; III falsa.'], [5, 'C', 'I e III verdadeiras; II falsa.'], [6, 'D', 'I, II e III verdadeiras.'], [7, 'B', 'I e II verdadeiras; III falsa.'], [8, 'D', 'I, II e III verdadeiras.'], [9, 'B', 'I e II verdadeiras; III falsa.'], [10, 'A', 'I e II falsas; III verdadeira.'],
      ]),
    ],
  },
  {
    code: 'D105_13701_R_20262',
    name: 'Métodos de Pesquisa',
    keys: ['metodosdepesquisa', 'metodospesquisa'],
    units: [
      unit('Questionário Unidade I', '1-E, 2-D, 3-A, 4-D, 5-B, 6-A, 7-A, 8-C, 9-D, 10-E', [
        [1, 'E', 'Escolha das técnicas considerando o objetivo e os recursos disponíveis.'], [2, 'D', 'I, II e III incorretas.'], [3, 'A', 'I e II corretas.'], [4, 'D', 'Grupo focal e observação participante são instrumentos qualitativos.'], [5, 'B', 'I e II.'], [6, 'A', 'I e II apenas.'], [7, 'A', 'I e II apenas.'], [8, 'C', 'I e III.'], [9, 'D', 'I e III.'], [10, 'E', 'Estudo etnográfico.'],
      ]),
      unit('Questionário Unidade II', '1-D, 2-D, 3-C, 4-A, 5-C, 6-E, 7-A, 8-A, 9-D, 10-C', [
        [1, 'D', 'Escolher e delimitar um tema.'], [2, 'D', 'Somente IV está incorreta.'], [3, 'C', 'Cronograma de execução.'], [4, 'A', 'Definição do problema, hipóteses, base teórica e conceitual.'], [5, 'C', 'Objetivos do estudo, propósitos.'], [6, 'E', 'Orçamento.'], [7, 'A', 'Justificativa da escolha do problema.'], [8, 'A', 'O projeto pode ser modificado conforme novas contingências.'], [9, 'D', 'Projeto de pesquisa.'], [10, 'C', 'Benefícios gerados pelos resultados da pesquisa.'],
      ]),
    ],
  },
  {
    code: 'D96B_13701_D_20262',
    name: 'Tópicos de Matemática Aplicada',
    keys: ['topicosdematematicaaplicada', 'topicosdematematica', 'matematicaaplicada'],
    units: [
      unit('Questionário Unidade I', '1-D, 2-B, 3-B, 4-D, 5-C, 6-C, 7-C, 8-C, 9-C, 10-D', [
        [1, 'D', 'Ambas verdadeiras e II justifica I.'], [2, 'B', 'I, II e III.'], [3, 'B', 'I, II e III.'], [4, 'D', 'Ambas verdadeiras e II justifica I.'], [5, 'C', 'I, II e III.'], [6, 'C', 'I, II e III.'], [7, 'C', 'I, II e III.'], [8, 'C', 'I, II e III.'], [9, 'C', 'Raiz igual a 1.'], [10, 'D', 'Coeficientes angular e linear iguais a 1 e 0.'],
      ]),
      unit('Questionário Unidade II', '1-D, 2-E, 3-B, 4-C, 5-D, 6-B, 7-C, 8-A, 9-C, 10-A', [
        [1, 'D', 'A é uma matriz 2×3.'], [2, 'E', 'B é uma matriz 3×2.'], [3, 'B', 'x=1, y=0 e z=0.'], [4, 'C', 'AB resulta em uma matriz quadrada.'], [5, 'D', 'A deve ser de ordem 20×30.'], [6, 'B', 'Soma das matrizes; a matriz foi exibida como imagem na fonte.'], [7, 'C', 'Matriz transposta; a matriz foi exibida como imagem na fonte.'], [8, 'A', 'Matriz oposta; a matriz foi exibida como imagem na fonte.'], [9, 'C', 'Determinante igual a −11.'], [10, 'A', 'Matriz dos coeficientes; a expressão foi exibida como imagem na fonte.'],
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
