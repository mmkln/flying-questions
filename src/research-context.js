export const MAX_RESEARCH_CONTEXT_THOUGHTS = 12;

function asReference(value) {
  if (!value || typeof value.id !== 'string' || !value.id.trim()) return null;

  return {
    id: value.id,
    text: String(value.text || '').trim(),
    kind: typeof value.kind === 'string' ? value.kind : 'thought',
    revision: Number.isInteger(value.revision) ? value.revision : 0,
    created_at: typeof value.created_at === 'string' ? value.created_at : null,
  };
}

export function normalizeResearchContext(value = {}) {
  const note = typeof value.note === 'string' ? value.note : '';
  const seen = new Set();
  const thoughts = [];

  for (const candidate of Array.isArray(value.thoughts) ? value.thoughts : []) {
    const reference = asReference(candidate);
    if (!reference || seen.has(reference.id)) continue;

    seen.add(reference.id);
    thoughts.push(reference);
    if (thoughts.length === MAX_RESEARCH_CONTEXT_THOUGHTS) break;
  }

  return { note, thoughts };
}

export function researchContextFromWorkflow(workflow) {
  return normalizeResearchContext({
    note: workflow?.research_note || '',
    thoughts: workflow?.context_thoughts || [],
  });
}

export function hasResearchContext(value) {
  const context = normalizeResearchContext(value);
  return Boolean(context.note.trim() || context.thoughts.length);
}
