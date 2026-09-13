import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const activeRef = 'wxkkpjpqyrygglbuogsd';
const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('active Supabase invariant', () => {
  it('pins the frontend, MCP source, generated artifact and Lovable manifest to production', () => {
    const files = [
      read('src/integrations/supabase/client.ts'),
      read('src/lib/mcp/index.ts'),
      read('supabase/functions/mcp/index.ts'),
      read('.lovable/mcp/manifest.json'),
      read('supabase/config.toml'),
    ];

    expect(files.join('\n')).toContain(activeRef);
    expect(read('.lovable/mcp/manifest.json')).toContain(
      `https://${activeRef}.supabase.co/auth/v1`,
    );
    expect(files.join('\n')).not.toMatch(
      /gynguskgysompgcajunc|qwnblxmlgcpjuhdzslju|project-ref-unset/,
    );
  });
});
