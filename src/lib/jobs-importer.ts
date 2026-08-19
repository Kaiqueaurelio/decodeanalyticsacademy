import { supabase } from "@/integrations/supabase/client";

/**
 * Utilitário para parsear conteúdo Markdown de vagas de emprego.
 * Suporta tanto formato estruturado (com ## Título) quanto textos gerais ou análises.
 */
export async function parseAndImportJobsFromMd(content: string, useAi: boolean = false) {
  if (useAi) {
    try {
      const { data, error } = await supabase.functions.invoke('ella-chat', {
        body: { 
          message: `Extraia as oportunidades ou vagas de emprego do seguinte texto Markdown e retorne estritamente um JSON array de objetos com as chaves: title, company_name, location, type (apenas 'job' ou 'internship'), application_link, salary_range, description. Se não houver link explícito, crie um link padrão de busca como 'https://www.linkedin.com/jobs/search/?keywords=' concatenando o título da vaga. Garanta que o array seja retornado.\n\nTexto:\n${content}`,
          mode: 'json'
        }
      });

      if (error) throw error;
      
      const jobs = Array.isArray(data?.response) ? data.response : (Array.isArray(data) ? data : []);
      const importedJobs = [];

      for (const jobData of jobs) {
        if (jobData.title) {
          const { data: inserted, error: insertErr } = await supabase.from('jobs').insert([{
            title: jobData.title,
            company_name: jobData.company_name || 'Oportunidade Recomendada',
            location: jobData.location || 'Remoto / Híbrido',
            type: jobData.type === 'internship' ? 'internship' : 'job',
            application_link: jobData.application_link || `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(jobData.title)}`,
            salary_range: jobData.salary_range || null,
            description: jobData.description || jobData.title,
            is_active: true,
            published_at: new Date().toISOString()
          }]).select();
          if (!insertErr && inserted) importedJobs.push(inserted[0]);
        }
      }

      if (importedJobs.length > 0) return importedJobs;
    } catch (err) {
      console.error('Erro na extração via IA:', err);
    }
  }

  // Fallback inteligente: tenta extrair blocos com ## ou parágrafos importantes
  let jobBlocks = content.split(/^##\s+/m).filter(block => block.trim().length > 0);
  
  // Se não encontrou blocos com ## (como no texto enviado pelo usuário que continha sumário), 
  // vamos extrair títulos e seções relevantes ou criar uma vaga padrão com o resumo
  if (jobBlocks.length === 0 || (jobBlocks.length === 1 && !jobBlocks[0].includes('Empresa') && !jobBlocks[0].includes('Link'))) {
    // Trata o texto colado como um relatório de vagas e extrai headings menores ou cria vagas genéricas a partir das linhas principais
    const lines = content.split('\n');
    let currentTitle = "Oportunidade em Tecnologia";
    let currentDesc = "";
    let extracted = [];

    for (const line of lines) {
      if (line.startsWith('#') || line.match(/^\d+\.\s+/)) {
        if (currentDesc.trim().length > 20) {
          extracted.push({ title: currentTitle, description: currentDesc });
        }
        currentTitle = line.replace(/^[#\d\.\s]+/g, '').trim() || "Oportunidade Tech";
        currentDesc = "";
      } else {
        currentDesc += line + "\n";
      }
    }
    if (currentDesc.trim().length > 20) {
      extracted.push({ title: currentTitle, description: currentDesc });
    }

    if (extracted.length === 0) {
      // Se ainda assim nada foi estruturado, cria uma vaga com o conteúdo todo
      extracted.push({
        title: "Relatório de Oportunidades e Vagas Analisadas",
        description: content
      });
    }

    const importedJobs = [];
    for (const item of extracted) {
      const jobData = {
        title: item.title.slice(0, 100),
        company_name: 'Decode Analytics Partner',
        location: 'Brasil (Remoto / Presencial)',
        type: 'job' as const,
        application_link: 'https://www.linkedin.com/jobs/',
        salary_range: 'A combinar',
        description: item.description.trim(),
        is_active: true,
        published_at: new Date().toISOString()
      };

      const { data, error } = await supabase.from('jobs').insert([jobData]).select();
      if (!error && data) {
        importedJobs.push(data[0]);
      }
    }
    return importedJobs;
  }

  const importedJobs = [];
  for (const block of jobBlocks) {
    const lines = block.split('\n');
    const title = lines[0].trim();
    const body = lines.slice(1).join('\n');

    const companyMatch = body.match(/\*\*Empresa:\*\*\s*(.*)/i) || body.match(/Empresa:\s*(.*)/i);
    const locationMatch = body.match(/\*\*Local:\*\*\s*(.*)/i) || body.match(/Local:\s*(.*)/i);
    const typeMatch = body.match(/\*\*Tipo:\*\*\s*(.*)/i) || body.match(/Tipo:\s*(.*)/i);
    const linkMatch = body.match(/\*\*Link:\*\*\s*(https?:\/\/[^\s]+)/i) || body.match(/Link:\s*(https?:\/\/[^\s]+)/i);
    const salaryMatch = body.match(/\*\*Salário:\*\*\s*(.*)/i) || body.match(/Salário:\s*(.*)/i);

    const jobData = {
      title,
      company_name: companyMatch ? companyMatch[1].trim() : 'Decode Analytics Partner',
      location: locationMatch ? locationMatch[1].trim() : 'Remoto',
      type: (typeMatch?.[1].toLowerCase().includes('estágio') ? 'internship' : 'job') as 'job' | 'internship',
      application_link: linkMatch ? linkMatch[1].trim() : 'https://www.linkedin.com/jobs/',
      salary_range: salaryMatch ? salaryMatch[1].trim() : null,
      description: body.trim() || title,
      is_active: true,
      published_at: new Date().toISOString()
    };

    if (jobData.title) {
      const { data, error } = await supabase.from('jobs').insert([jobData]).select();
      if (!error && data) {
        importedJobs.push(data[0]);
      }
    }
  }

  return importedJobs;
}
