
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const AUDIO_URL = '/__l5e/assets-v1/0f45444d-3d58-48cc-920c-01df5f74c897/Como_os_robôs_e_videogames_pensam.m4a';

async function listAndUpdate() {
  const { data: apostilas, error } = await supabase
    .from('apostilas')
    .select('id, title, content');

  if (error) {
    console.error("Error listing apostilas:", error);
    return;
  }

  console.log("Found", apostilas?.length, "apostilas");
  
  const target = apostilas?.find(a => a.title.includes('Aspectos'));
  
  if (!target) {
    console.log("Target not found by search");
    return;
  }

  console.log("Updating:", target.title, "(", target.id, ")");

  const audioSection = `
---

### 🎙️ Audioaula: Como os robôs e videogames pensam
![Áudio explicativo](${AUDIO_URL})

> **Atenção:** Abaixo deste áudio, você encontrará material interativo e prático para reforçar o aprendizado.

---
`;

  let newContent = target.content;
  if (!newContent.includes('Audioaula: Como os robôs e videogames pensam')) {
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
      .eq('id', target.id);

    if (updateError) {
      console.error("Error updating:", updateError);
    } else {
      console.log("Success!");
    }
  } else {
    console.log("Already exists.");
  }
}

listAndUpdate();
