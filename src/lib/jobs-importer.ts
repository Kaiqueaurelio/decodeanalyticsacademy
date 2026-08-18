import { supabase } from "@/integrations/supabase/client";

/**
 * Utilitário para parsear conteúdo Markdown de vagas de emprego.
 * Espera um formato onde cada vaga começa com um título H2 (##) ou similar.
 * 
 * Exemplo de formato suportado:
 * ## Desenvolvedor React
 * **Empresa:** Decode Analytics
 * **Local:** Remoto
 * **Tipo:** Efetivo
 * **Link:** https://exemplo.com/vaga
 * **Salário:** R$ 5.000 - R$ 8.000
 * 
 * Descrição da vaga...
 */
export async function parseAndImportJobsFromMd(content: string, useAi: boolean = false) {
  if (useAi) {
    try {
      const { data, error } = await supabase.functions.invoke('ella-chat', {
        body: { 
          message: `Extraia as vagas de emprego do seguinte texto Markdown e retorne estritamente um JSON array de objetos com as chaves: title, company_name, location, type (apenas 'job' ou 'internship'), application_link, salary_range, description. Se não houver link, use '#'.\n\nTexto:\n${content}`,
          mode: 'json'
        }
      });

      if (error) throw error;
      
      const jobs = Array.isArray(data?.response) ? data.response : [];
      const importedJobs = [];

      for (const jobData of jobs) {
        if (jobData.title && jobData.application_link !== '#') {
          const { data: inserted, error: insertErr } = await supabase.from('jobs').insert([{
            ...jobData,
            is_active: true,
            published_at: new Date().toISOString()
          }]).select();
          if (!insertErr && inserted) importedJobs.push(inserted[0]);
        }
      }
      return importedJobs;
    } catch (err) {
      console.error('Erro na extração via IA:', err);
      // Fallback para regex se a IA falhar
    }
  }

  const jobBlocks = content.split(/^##\s+/m).filter(block => block.trim().length > 0);
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
      company_name: companyMatch ? companyMatch[1].trim() : 'Empresa não informada',
      location: locationMatch ? locationMatch[1].trim() : 'Remoto',
      type: (typeMatch?.[1].toLowerCase().includes('estágio') ? 'internship' : 'job') as 'job' | 'internship',
      application_link: linkMatch ? linkMatch[1].trim() : '#',
      salary_range: salaryMatch ? salaryMatch[1].trim() : null,
      description: body.trim(),
      is_active: true,
      published_at: new Date().toISOString()
    };

    if (jobData.title && jobData.application_link !== '#') {
      const { data, error } = await supabase.from('jobs').insert([jobData]).select();
      if (!error && data) {
        importedJobs.push(data[0]);
      }
    }
  }

  return importedJobs;
}
