-- Restaura seis materiais publicados que continham apenas texto provisório.
-- O mesmo conteúdo é sincronizado em apostilas e apostila_pages para manter
-- compatibilidade entre o leitor clássico, o leitor estruturado e o editor.

with restored(title, content) as (
  values
  (
    'Simulado ENEM — Ciências da Natureza',
    $content$# Simulado ENEM — Ciências da Natureza

## Como usar este simulado

Resolva as questões sem consultar o material e marque o tempo. Depois, confira o gabarito comentado, registre os erros e retome o tópico correspondente. Em Ciências da Natureza, o ENEM valoriza interpretação de situações reais, leitura de gráficos, unidades de medida e aplicação integrada de conceitos.

## Biologia

- Citologia: membrana, organelas, metabolismo e divisão celular.
- Genética e biotecnologia: hereditariedade, DNA, mutações e aplicações.
- Ecologia: cadeias alimentares, ciclos biogeoquímicos, impactos ambientais e sustentabilidade.
- Evolução: seleção natural, adaptação e diversidade biológica.
- Fisiologia humana: sistemas digestório, respiratório, circulatório, nervoso e imunológico.

## Física

- Mecânica: cinemática, dinâmica, trabalho, energia, potência e quantidade de movimento.
- Termologia: temperatura, calorimetria, mudanças de estado e termodinâmica.
- Ondulatória e óptica: som, frequência, reflexão, refração, espelhos e lentes.
- Eletricidade: circuitos, potência, consumo de energia e eletromagnetismo.

## Química

- Estrutura atômica, tabela periódica e ligações químicas.
- Estequiometria, soluções, concentração e gases.
- Termoquímica, cinética, equilíbrio químico, ácidos, bases e eletroquímica.
- Química orgânica: funções, reações, combustíveis, polímeros e química ambiental.

## Estratégia de revisão

1. Identifique o assunto principal antes de calcular.
2. Destaque dados, unidades e o que a questão pede.
3. Elimine alternativas incompatíveis com o texto ou com a ordem de grandeza.
4. Revise cada erro classificando-o como conceito, interpretação ou cálculo.
5. Refaça as questões erradas depois de 24 horas e novamente após uma semana.$content$
  ),
  (
    'Simulado ENEM — Ciências Humanas',
    $content$# Simulado ENEM — Ciências Humanas

## Como usar este simulado

Faça primeiro uma leitura ativa do enunciado, identifique período histórico, espaço geográfico, conceito central e ponto de vista da fonte. O ENEM cobra comparação de processos, interpretação de documentos, mapas, gráficos e relações entre sociedade, política, economia, cultura e ambiente.

## História

- Antiguidade, feudalismo, formação do mundo moderno e revoluções.
- Colonização, escravidão e resistências no Brasil.
- Brasil Império: independência, organização política e crise do trabalho escravo.
- Brasil República: cidadania, industrialização, Era Vargas, ditadura e redemocratização.
- História contemporânea: imperialismo, guerras mundiais, Guerra Fria e globalização.

## Geografia

- Cartografia, escalas, projeções e interpretação de mapas.
- População, migrações, urbanização, redes e desigualdades socioespaciais.
- Industrialização, agropecuária, energia, comércio e globalização.
- Geopolítica, blocos econômicos, conflitos e relações internacionais.
- Clima, biomas, recursos naturais, impactos ambientais e sustentabilidade.

## Filosofia e Sociologia

- Filosofia antiga, moderna e contemporânea; conhecimento, ética e política.
- Cultura, socialização, identidade, instituições e movimentos sociais.
- Trabalho, poder, cidadania, direitos humanos e desigualdade.
- Autores e conceitos devem ser relacionados ao problema apresentado, não apenas memorizados.

## Estratégia de revisão

1. Localize tempo, espaço e agente social.
2. Diferencie fato, interpretação e opinião da fonte.
3. Compare causas, consequências, permanências e mudanças.
4. Registre o tema de cada erro e retome a apostila correspondente.
5. Refaça as questões erradas em ciclos de revisão.$content$
  ),
  (
    'Simulado ENEM — Linguagens, Códigos e suas Tecnologias',
    $content$# Simulado ENEM — Linguagens, Códigos e suas Tecnologias

## Como usar este simulado

Leia o comando antes das alternativas e volte ao texto para localizar evidências. A área de Linguagens avalia interpretação, efeitos de sentido, diversidade cultural e uso das linguagens verbal, visual, corporal, artística e digital.

## Língua Portuguesa

- Interpretação de textos verbais, não verbais e multimodais.
- Gêneros textuais, finalidade comunicativa e relação entre autor, texto e público.
- Coesão, coerência, argumentação, ironia, humor e figuras de linguagem.
- Variação linguística, norma-padrão e adequação ao contexto.
- Gramática aplicada à construção de sentidos, especialmente sintaxe e pontuação.

## Literatura e Artes

- Escolas literárias brasileiras e portuguesas em seu contexto histórico.
- Relações entre forma, tema, linguagem e projeto estético.
- Artes visuais, música, teatro, dança, patrimônio e cultura popular.
- Leitura comparativa entre obras, movimentos e manifestações culturais.

## Língua Estrangeira

- Leitura e interpretação em inglês ou espanhol.
- Vocabulário inferido pelo contexto, cognatos e falsos cognatos.
- Finalidade, público e posicionamento do texto.

## Educação Física e cultura digital

- Corpo, saúde, esporte, lazer, inclusão e práticas corporais.
- Tecnologias da informação, gêneros digitais, segurança, ética e cidadania digital.

## Estratégia de revisão

1. Sublinhe palavras do comando como finalidade, efeito e crítica.
2. Justifique a alternativa correta com um trecho ou elemento visual.
3. Não escolha uma opção apenas por ela repetir palavras do texto.
4. Classifique os erros por habilidade e refaça as questões após revisar o tema.$content$
  ),
  (
    'Simulado ENEM — Matemática e suas Tecnologias',
    $content$# Simulado ENEM — Matemática e suas Tecnologias

## Como usar este simulado

Resolva as questões registrando o raciocínio, as unidades e o tempo. No ENEM, a maior parte dos problemas nasce de situações cotidianas; interpretar corretamente costuma ser tão importante quanto executar a conta.

## Aritmética e proporcionalidade

- Operações, frações, razões, proporções, regra de três e porcentagem.
- Juros, descontos, escalas, conversão de unidades e estimativas.

## Álgebra e funções

- Equações, inequações, sistemas e sequências.
- Funções afim, quadrática, exponencial e logarítmica.
- Leitura de gráficos, taxas de variação, máximos, mínimos e modelagem.

## Geometria

- Geometria plana: ângulos, semelhança, perímetro, área e trigonometria.
- Geometria espacial: prismas, cilindros, pirâmides, cones, esferas, área e volume.
- Geometria analítica: plano cartesiano, distância, reta e circunferência.

## Estatística e probabilidade

- Tabelas e gráficos, média, mediana, moda e medidas de dispersão.
- Princípios de contagem, probabilidade simples e eventos combinados.

## Estratégia de resolução

1. Reescreva o que é dado e o que deve ser encontrado.
2. Padronize as unidades antes de calcular.
3. Use estimativa para eliminar resultados impossíveis.
4. Confira sinal, unidade e ordem de grandeza.
5. Registre se o erro foi de interpretação, fórmula ou cálculo e refaça a questão.$content$
  ),
  (
    'Simulado ENEM — Redação',
    $content$# Simulado ENEM — Redação

## Objetivo

Produza um texto dissertativo-argumentativo em norma-padrão sobre o tema proposto. Defenda uma tese, desenvolva argumentos consistentes e apresente uma proposta de intervenção que respeite os direitos humanos.

## As cinco competências

1. Demonstrar domínio da modalidade escrita formal da língua portuguesa.
2. Compreender a proposta e aplicar conhecimentos de diferentes áreas sem fugir do tema.
3. Selecionar, relacionar e organizar informações, fatos e opiniões para defender um ponto de vista.
4. Usar mecanismos linguísticos de coesão para construir a argumentação.
5. Elaborar proposta de intervenção detalhada e relacionada ao problema discutido.

## Estrutura recomendada

### Introdução

Contextualize o tema, delimite o problema e apresente uma tese clara com os eixos que serão desenvolvidos.

### Desenvolvimento

Construa pelo menos dois parágrafos argumentativos. Cada um deve apresentar uma ideia central, explicação, repertório pertinente e ligação explícita com a tese.

### Conclusão

Retome o problema e apresente a proposta de intervenção com agente, ação, meio de execução, finalidade e detalhamento. A proposta precisa ser viável e respeitar os direitos humanos.

## Lista de verificação

- O texto responde exatamente ao recorte temático?
- A tese aparece na introdução e orienta o desenvolvimento?
- Cada parágrafo possui ideia central e explicação?
- O repertório é pertinente e está ligado ao argumento?
- Há conectivos variados entre frases e parágrafos?
- A intervenção contém agente, ação, meio, finalidade e detalhamento?
- A linguagem está formal, clara e sem marcas de oralidade?

## Prática

Planeje em poucos minutos, escreva a primeira versão, revise a coerência e faça uma última leitura focada em concordância, pontuação, repetição de palavras e legibilidade.$content$
  ),
  (
    'Metodos de Pesquisa',
    $content$# Métodos de Pesquisa

## 1. O que é pesquisa científica

Pesquisa científica é um processo sistemático para formular perguntas, reunir evidências, analisar dados e comunicar conclusões verificáveis. Um bom trabalho explicita o problema, os objetivos, as escolhas metodológicas e os limites dos resultados.

## 2. Tema, problema e objetivos

- **Tema:** área geral de interesse.
- **Delimitação:** recorte de tempo, espaço, população ou tecnologia.
- **Problema de pesquisa:** pergunta clara, investigável e relevante.
- **Objetivo geral:** resultado principal que o estudo pretende alcançar.
- **Objetivos específicos:** etapas observáveis que conduzem ao objetivo geral.

## 3. Hipóteses e justificativa

A hipótese é uma resposta provisória que será confrontada com evidências. Nem todo estudo exige hipótese, mas toda pesquisa precisa justificar sua relevância acadêmica, social ou profissional.

## 4. Revisão de literatura

A revisão identifica o que já foi produzido, conceitos fundamentais, métodos utilizados e lacunas existentes. As fontes devem ser avaliadas quanto à autoria, atualidade, método e relação com o problema. Citações diretas e indiretas precisam ser referenciadas; copiar sem atribuição caracteriza plágio.

## 5. Abordagens e tipos de pesquisa

- **Qualitativa:** interpreta significados, experiências e processos.
- **Quantitativa:** mede variáveis e analisa relações numéricas.
- **Mista:** integra dados qualitativos e quantitativos.
- **Exploratória:** amplia a compreensão inicial do problema.
- **Descritiva:** caracteriza uma população ou fenômeno.
- **Explicativa:** investiga causas e relações entre variáveis.

## 6. Procedimentos de coleta

Podem ser usados pesquisa bibliográfica, pesquisa documental, estudo de caso, experimento, levantamento, entrevista, questionário e observação. O instrumento deve estar alinhado aos objetivos e ser testado antes da aplicação.

## 7. Amostra, ética e proteção de dados

Defina população, critérios de inclusão, tamanho e forma de seleção da amostra. Pesquisas com pessoas exigem consentimento, proteção da identidade, armazenamento seguro e uso responsável dos dados. Colete apenas o necessário e informe como os dados serão tratados.

## 8. Análise dos dados

Dados quantitativos podem ser organizados com tabelas, gráficos e estatísticas. Dados qualitativos podem ser examinados por categorias, temas e padrões. Em ambos os casos, a análise deve responder ao problema sem extrapolar o que as evidências permitem concluir.

## 9. Estrutura do trabalho

Uma estrutura comum inclui introdução, referencial teórico, metodologia, resultados, discussão, conclusão e referências. A introdução apresenta problema e objetivos; a metodologia permite compreender e reproduzir o percurso; a conclusão responde ao problema e reconhece limitações.

## 10. Checklist de qualidade

1. O problema está formulado como pergunta investigável?
2. Os objetivos correspondem ao problema?
3. O método explica participantes, materiais, procedimentos e análise?
4. As fontes são confiáveis e foram citadas corretamente?
5. Resultados e interpretação estão claramente separados?
6. Limitações e aspectos éticos foram informados?
7. A conclusão responde aos objetivos sem introduzir dados novos?$content$
  )
), updated as (
  update public.apostilas a
  set content = restored.content,
      updated_at = now()
  from restored
  where a.title = restored.title
  returning a.id, a.title
)
update public.apostila_pages p
set content = restored.content,
    updated_at = now()
from updated
join restored on restored.title = updated.title
where p.apostila_id = updated.id;
