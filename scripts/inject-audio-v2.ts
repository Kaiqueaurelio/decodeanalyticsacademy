import { supabase } from "../src/integrations/supabase/client";

async function injectAudioV2() {
  const apostilaId = "d3a7a3cb-d89a-418a-a084-971e9fa4e896";
  const pageId = "4d6771a6-3aff-4e41-a83d-cb84aea1f115";
  
  // Como 'audio_url' não existe na tabela 'apostilas', vamos injetar o áudio diretamente no Markdown da página.
  // O componente do leitor de apostilas geralmente renderiza o player se encontrar a sintaxe adequada.
  
  const { data: pageData } = await supabase
    .from("apostila_pages")
    .select("content")
    .eq("id", pageId)
    .single();

  let content = pageData?.content || "";
  
  // Garantimos que o áudio está no topo com a marcação correta para o player
  const audioTag = `\n<audio-player src="asset:theoretical_audio.m4a" title="Como os robôs e videogames pensam" />\n\n`;
  
  if (!content.includes("audio-player")) {
    content = audioTag + content;
  }

  const { error } = await supabase
    .from("apostila_pages")
    .update({ content })
    .eq("id", pageId);

  if (error) {
    console.error("Erro:", error);
  } else {
    console.log("Áudio injetado na página com sucesso!");
  }
}

injectAudioV2();
