
import { supabase } from "./src/integrations/supabase/client.ts";

const APOSTILA_ID = 'bb649bd0-724f-4311-bd2c-d5e0d414181d';
const AUDIO_URL = '/__l5e/assets-v1/0f45444d-3d58-48cc-920c-01df5f74c897/Como_os_robôs_e_videogames_pensam.m4a';

async function updateApostila() {
  const { data: current } = await supabase
    .from('apostilas')
    .select('content')
    .eq('id', APOSTILA_ID)
    .single();

  if (!current) {
    console.error("Apostila not found");
    return;
  }

  const audioSection = `
---

### 🎙️ Audioaula: Como os robôs e videogames pensam
[Áudio explicativo](${AUDIO_URL})

> **Material Interativo:** Abaixo você encontrará conteúdos práticos, simuladores e atividades para aprofundar os conceitos discutidos.

---
`;

  // Insert after the first header and intro paragraph
  let newContent = current.content;
  const lines = newContent.split('\n');
  let insertPos = 0;
  
  // Find a good place after the introduction
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('## 1.')) {
        insertPos = i;
        break;
    }
  }

  if (insertPos > 0) {
      lines.splice(insertPos, 0, audioSection);
      newContent = lines.join('\n');
  } else {
      newContent = newContent + audioSection;
  }

  const { error } = await supabase
    .from('apostilas')
    .update({ content: newContent })
    .eq('id', APOSTILA_ID);

  if (error) {
    console.error("Error updating apostila:", error);
  } else {
    console.log("Apostila updated successfully with audio section");
  }
}

updateApostila();
