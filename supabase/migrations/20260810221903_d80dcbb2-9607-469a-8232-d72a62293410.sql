-- Garante que as matérias do 6º semestre estejam visíveis (published=true) e com status 'liberada'
UPDATE public.apostilas 
SET published = true, 
    status = 'liberada' 
WHERE semester = 6 
   OR title ILIKE '%Sistemas Operacionais e Mobile%'
   OR title ILIKE '%Calculo Numerico%'
   OR title ILIKE '%Pesquisa Operacional%'
   OR title ILIKE '%Aspectos Teoricos%';

-- Registra a alteração no changelog se possível (opcional via SQL se houver tabela, mas vamos focar na visibilidade)
