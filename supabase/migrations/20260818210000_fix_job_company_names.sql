-- Migration: fix_job_company_names
-- Description: Updates jobs with generic names like 'Decode Analytics Partner' to their correct company names extracted from content, and ensures structured formatting.

UPDATE public.jobs
SET company = 'Honda'
WHERE (company ILIKE '%Decode Analytics Partner%' OR company ILIKE '%Confidencial%' OR company IS NULL)
  AND (title ILIKE '%Honda%' OR description ILIKE '%Honda%');

UPDATE public.jobs
SET company = 'J.P. Morgan Chase'
WHERE (company ILIKE '%Decode Analytics Partner%' OR company ILIKE '%Confidencial%' OR company IS NULL)
  AND (title ILIKE '%J.P. Morgan%' OR description ILIKE '%J.P. Morgan%');

UPDATE public.jobs
SET company = 'Nubank'
WHERE (company ILIKE '%Decode Analytics Partner%' OR company ILIKE '%Confidencial%' OR company IS NULL)
  AND (title ILIKE '%Nubank%' OR description ILIKE '%Nubank%');

UPDATE public.jobs
SET company = 'Banco Mercantil / DOMO'
WHERE (company ILIKE '%Decode Analytics Partner%' OR company ILIKE '%Confidencial%' OR company IS NULL)
  AND (title ILIKE '%DOMO%' OR title ILIKE '%Mercantil%' OR description ILIKE '%Banco Mercantil%');

UPDATE public.jobs
SET company = 'FGC'
WHERE (company ILIKE '%Decode Analytics Partner%' OR company ILIKE '%Confidencial%' OR company IS NULL)
  AND (title ILIKE '%FGC%' OR description ILIKE '%FGC%');

UPDATE public.jobs
SET company = 'AlmapBBDO'
WHERE (company ILIKE '%Decode Analytics Partner%' OR company ILIKE '%Confidencial%' OR company IS NULL)
  AND (title ILIKE '%AlmapBBDO%' OR description ILIKE '%AlmapBBDO%');

UPDATE public.jobs
SET company = 'Instituto Eldorado'
WHERE (company ILIKE '%Decode Analytics Partner%' OR company ILIKE '%Confidencial%' OR company IS NULL)
  AND (title ILIKE '%Eldorado%' OR description ILIKE '%Eldorado%');

UPDATE public.jobs
SET company = 'Finnet'
WHERE (company ILIKE '%Decode Analytics Partner%' OR company ILIKE '%Confidencial%' OR company IS NULL)
  AND (title ILIKE '%Finnet%' OR description ILIKE '%Finnet%');

UPDATE public.jobs
SET company = 'TOTVS'
WHERE (company ILIKE '%Decode Analytics Partner%' OR company ILIKE '%Confidencial%' OR company IS NULL)
  AND (title ILIKE '%TOTVS%' OR description ILIKE '%TOTVS%');
