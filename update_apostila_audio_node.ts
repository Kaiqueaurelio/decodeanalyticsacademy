
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("Missing Supabase environment variables");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const APOSTILA_ID = 'bb649bd0-724f-4311-bd2c-d5e0d414181d';
const AUDIO_URL = '/__l5e/assets-v1/0f45444d-3d58-48cc-920c-01df5f74c897/Como_os_robôs_e_videogames_pensam.m4a';

async function updateApostila() {
  const { data: current, error: fetchError } = await supabase
    .from('apostilas')
    .select('content')
    .eq('id', APOSTILA_ID)
    .single();

  if (fetchError || !current) {
    console.error("Apostila not found or error fetching:", fetchError);
    return;
  }

  const audioSection = `
---

### 🎙️ Audioaula: Como os robôs e videogames pensam
![Áudio explicativo](${AUDIO_URL})

> **Atenção:** Abaixo deste áudio, você encontrará material interativo e prático para reforçar o aprendizado.

---
`;

  let newContent = current.content;
  const lines = newContent.split('\n');
  let insertPos = -1;
  
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('## 1.')) {
        insertPos = i;
        break;
    }
  }

  if (insertPos !== -1) {
      lines.splice(insertPos, 0, audioSection);
      newContent = lines.join('\n');
  } else {
      newContent = newContent + audioSection;
  }

  const { error: updateError } = await supabase
    .from('apostilas')
    .update({ content: newContent })
    .eq('id', APOSTILA_ID);

  if (updateError) {
    console.error("Error updating apostila:", updateError);
  } else {
    console.log("Apostila updated successfully with audio section");
  }
}

updateApostila();
