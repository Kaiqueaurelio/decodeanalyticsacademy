UPDATE public.apostilas 
SET category = 'Pesquisa Operacional' 
WHERE id = 'b132f212-5ede-4522-92d3-b0ead2cd8ce2';

UPDATE public.apostilas 
SET category = 'Processamento de Imagem e Visão Computacional' 
WHERE id = 'd6a6e733-eabd-47a3-a3c6-2e8fffa11784';

-- Garantindo que as disciplinas existam na lógica de mapeamento ou no banco
-- (O frontend agrupa por 'category', então basta garantir que o nome da categoria esteja correto)