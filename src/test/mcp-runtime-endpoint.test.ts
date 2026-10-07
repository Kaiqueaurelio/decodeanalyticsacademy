import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('endpoint MCP em runtime', () => {
  it('usa o Supabase canônico e não deriva um projeto a partir do domínio Lovable', () => {
    const syncButton = readFileSync('src/components/dashboard/McpSyncButton.tsx', 'utf8');
    const settings = readFileSync('src/components/admin/McpSettings.tsx', 'utf8');

    for (const source of [syncButton, settings]) {
      expect(source).toContain('SUPABASE_URL');
      expect(source).toContain('${SUPABASE_URL}/functions/v1/mcp');
      expect(source).not.toContain("replace(/\\.lovable\\.app$/, '.supabase.co')");
    }
  });
});
