import { supabase } from "../src/integrations/supabase/client";
import audioAsset from "../src/assets/Como_os_robos_e_videogames_pensam.m4a.asset.json";
import imageAsset from "../src/assets/Guia_Visual_de_Teoria_Computacional.png.asset.json";

const APOSTILA_ID = 'd3a7a3cb-d89a-418a-a084-971e9fa4e896';

async function injectMediaContent() {
  console.log("Iniciando injeção de mídia...");

  // 1. Verificar se a página já existe ou criar uma nova para a aula interativa
  const { data: pages, error: fetchError } = await supabase
    .from('apostila_pages')
    .select('id, position')
    .eq('apostila_id', APOSTILA_ID)
    .order('position', { ascending: false });

  if (fetchError) {
    console.error("Erro ao buscar páginas:", fetchError);
    return;
  }

  const nextPosition = pages && pages.length > 0 ? pages[0].position + 1 : 1;

  const content = `
# 🤖 Aula Interativa: Como os robôs e videogames pensam

Nesta seção, exploraremos a aplicação prática dos conceitos de Teoria da Computação em robótica e desenvolvimento de jogos.

### 🎧 Áudio-Aula: Autômatos na Prática
Ouça a aula abaixo para entender como máquinas de estados regem o comportamento de NPCs em jogos e sensores em robôs.

<div class="audio-player-container my-6 p-4 bg-slate-900/50 rounded-xl border border-cyan-500/30">
  <audio src="${audioAsset.url}" controls class="w-full"></audio>
  <p class="text-xs text-cyan-400 mt-2 italic text-center">Referência: Como os robôs e videogames pensam (v1.0)</p>
</div>

### 🖼️ Guia Visual: Teoria Computacional
Confira o infográfico abaixo que resume a hierarquia de Chomsky e a complexidade de algoritmos modernos.

<div class="image-container my-8 flex flex-col items-center">
  <img src="${imageAsset.url}" alt="Guia Visual de Teoria Computacional" class="rounded-lg shadow-2xl border-2 border-purple-500/50 max-w-full h-auto" />
  <p class="text-sm text-slate-400 mt-3">Infográfico: Mapeamento de Complexidade e Linguagens</p>
</div>

---

### 📝 Desafio Rápido
Baseado no áudio acima, como você descreveria a diferença entre um Autômato Finito e uma Máquina de Turing na visão de um desenvolvedor de IA para jogos?
  `;

  const { data: newPage, error: insertError } = await supabase
    .from('apostila_pages')
    .insert([
      {
        apostila_id: APOSTILA_ID,
        title: "Aula Interativa: Robótica e Games",
        content: content,
        position: nextPosition
      }
    ])
    .select();

  if (insertError) {
    console.error("Erro ao inserir nova página:", insertError);
  } else {
    console.log("Sucesso! Aula interativa injetada na posição:", nextPosition);
  }
}

injectMediaContent();
