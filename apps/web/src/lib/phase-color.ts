/**
 * Maps a Phase category enum value to its CSS variable for the accent border
 * used across phase headers (WO Detail snapshot, workflow Tabella/Card views).
 * Tokens are defined in `apps/web/src/styles/tokens.css`.
 */
export const PHASE_COLOR: Record<string, string> = {
  inbound: 'var(--c-inbound)',
  setup: 'var(--c-setup)',
  production: 'var(--c-production)',
  quality_control: 'var(--c-qc)',
  outbound: 'var(--c-outbound)',
  teardown: 'var(--c-teardown)',
}

/** Resolves the accent color for a phase category, falling back to ink-3. */
export function phaseColor(category: string | null | undefined): string {
  if (!category) return 'var(--ink-3)'
  return PHASE_COLOR[category] ?? 'var(--ink-3)'
}
