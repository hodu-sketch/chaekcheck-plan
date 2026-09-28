// chaekcheck-plan PreToolUse guard: exit 2 blocks the tool call and sends stderr to Claude.
import { readFileSync, existsSync } from 'node:fs';
import { basename } from 'node:path';

const input = JSON.parse(readFileSync(0, 'utf8') || '{}');
const tool = input.tool_name ?? '';
const cmd = input.tool_input?.command ?? '';
const file = (input.tool_input?.file_path ?? '').replace(/\\/g, '/');
const block = (msg) => { process.stderr.write(msg + '\n'); process.exit(2); };

// 1. The dev project is read-only from here (backs up the deny rules in settings.json)
if (tool !== 'Bash' && /\/chaekcheck-dev(\/|$)/i.test(file))
  block('Blocked: chaekcheck-dev is read-only from the plan project. Put the change in docs/current/handoff.md for the dev session instead.');
if (tool === 'Bash' && /chaekcheck-dev/i.test(cmd)
    && /(>|\btee\b|\bsed\s+-i|\b(rm|mv|cp|mkdir|touch|git)\b|Set-Content|Add-Content|Out-File|New-Item|Remove-Item|Move-Item|Copy-Item)/i.test(cmd))
  block('Blocked: shell commands must not write to chaekcheck-dev. Reading it with the Read tool is fine.');

// 2. Accepted ADRs are immutable: write a new ADR that supersedes it
if (tool !== 'Bash' && /\/docs\/adr\/\d{4}-[^/]+\.md$/.test(file) && existsSync(file)) {
  const body = readFileSync(file, 'utf8');
  if (/^Status:\s*Accepted\b/m.test(body)) {
    const next = input.tool_input?.new_string ?? '';
    const prev = input.tool_input?.old_string ?? '';
    const onlyStatus = tool === 'Edit' && /^Status:\s*Accepted$/.test(prev.trim()) && /^Status:\s*(Superseded by \d{4}|Deprecated)$/.test(next.trim());
    if (!onlyStatus)
      block(`Blocked: ${basename(file)} is Accepted and must not change. Create a new ADR, then only change this file's status line to "Status: Superseded by NNNN" (or "Status: Deprecated" if nothing replaces it).`);
  }
}
process.exit(0);
