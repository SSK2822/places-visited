// Reading a backup file into today's schema.
//
// Backups exist in two shapes. The pre-Firestore exports carry a single shared
// `notes` string and no per-editor comments; the current ones carry
// ykComment/acComment plus their timestamps. Normalise both to today's schema
// so a restore can accept either, and so the old `notes` — which nothing in the
// app reads any more — isn't silently dropped on the floor.
export function normalizeBackup(json) {
  const places = Array.isArray(json) ? json : json?.places
  if (!Array.isArray(places)) {
    throw new Error('Not a places backup — expected a "places" array')
  }
  return places
    .filter((p) => p && typeof p.id === 'string')
    .map((p) => ({
      id: p.id,
      name: p.name ?? p.id,
      yk: p.yk ?? null,
      ac: p.ac ?? null,
      // Legacy `notes` was written before ratings were per-editor, so it is
      // attributed on restore rather than guessed at read time.
      ykComment: String(p.ykComment ?? p.notes ?? '').trim(),
      acComment: String(p.acComment ?? '').trim(),
    }))
}

// A human summary of what a restore plan will do, for the confirm step.
export function describePlan(plan) {
  const ratings = plan.fills.filter((f) => 'yk' in f.patch || 'ac' in f.patch).length
  const comments = plan.fills.filter((f) => 'ykComment' in f.patch || 'acComment' in f.patch).length
  return { ratings, comments, places: plan.fills.length }
}
