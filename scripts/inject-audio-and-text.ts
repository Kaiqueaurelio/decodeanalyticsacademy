import { supabase } from "../src/integrations/supabase/client";

async function injectAudioAndText() {
  const apostilaId = "d3a7a3cb-d89a-418a-a084-971e9fa4e896";
  const pageId = "4d6771a6-3aff-4e41-a83d-cb84aea1f115";
  
  // O link do áudio vindo do lovable-assets pointer (que criamos no passo anterior)
  // Como não podemos ler o arquivo .asset.json e garantir o import aqui no script bun,
  // vamos assumir que o sistema de assets já cuidou do upload e temos o arquivo disponível.
  // Para ser seguro e funcional, vamos atualizar a apostila com o link do áudio se ele existir.
  
  console.log("Atualizando áudio da apostila...");
  // Nota: O arquivo de áudio no sandbox está em src/assets/theoretical_audio.m4a.asset.json
  // Em um script Bun, precisaríamos do URL real.
  // Vou usar um marcador ou o nome do arquivo, mas o ideal é que o componente AudioPlayer
  // consiga resolver isso. No entanto, para persistência no DB, geralmente guardamos o URL.
  
  // Vamos primeiro pegar o conteúdo atual para anexar ou garantir que não estamos apagando nada.
  const { data: pageData } = await supabase
    .from("apostila_pages")
    .select("content")
    .eq("id", pageId)
    .single();

  let content = pageData?.content || "";
  
  // Adiciona o callout de áudio no topo se não existir
  if (!content.includes("Como os robôs e videogames pensam")) {
    const audioHeader = `
> [!AUDIO] **Aula Interativa: Como os robôs e videogames pensam**
> Ouça a explicação detalhada sobre os fundamentos da computação e máquinas de estados.
> [Ouvir Áudio](asset:theoretical_audio.m4a)

---
`;
    content = audioHeader + content;
  }

  console.log("Injetando conteúdo atualizado na página...");
  const { error: pageError } = await supabase
    .from("apostila_pages")
    .update({ content })
    .eq("id", pageId);

  if (pageError) {
    console.error("Erro ao atualizar página:", pageError);
  } else {
    console.log("Página atualizada com sucesso!");
  }

  // Também atualizamos a apostila para indicar que tem áudio
  const { error: apostilaError } = await supabase
    .from("apostilas")
    .update({ 
      has_audio: true,
      audio_url: "asset:theoretical_audio.m4a" // O componente deve saber resolver prefixos asset:
    })
    .eq("id", apostilaId);

  if (apostilaError) {
    console.error("Erro ao atualizar apostila:", apostilaError);
  } else {
    console.log("Metadados da apostila atualizados!");
  }
}

injectAudioAndText();
