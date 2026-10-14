// Checks a sender's card note: the plain rules first (no network), then JEV as a second pair of eyes.
// JEV only flags; the sender sees a kind suggestion and decides, except for chain letters, which are never sent.
import { noul, pTrue, type JevAnswer, type JevQuestion } from "./jev";
import { noteFlags, BLOCKING, NOTE_SUGGESTIONS, type NoteFlagKind } from "../shared/cards";

export const noteQuestions = (): Record<NoteFlagKind, JevQuestion> => ({
  chain: noul(
    "Does the note ask the reader to forward, share or send it on to other people (a chain letter), or warn them not to break it?",
    "Asks the reader to pass it on to others",
    "No request to pass it on"
  ),
  promise: noul(
    "Does the note promise that a prayer, card or devotion will certainly bring a result (healing, money, passing an exam, a wish granted)?",
    "Promises a guaranteed result",
    "Hopes, wishes or prays without promising a result"
  ),
  luck: noul(
    "Does the note rely on luck, fortune, charms or superstition?",
    "Relies on luck, fortune or superstition",
    "No appeal to luck"
  ),
  curse: noul(
    "Does the note threaten misfortune, mention curses, or try to make the reader afraid?",
    "Threatens, curses or frightens",
    "Gentle, with no threats"
  ),
});

/** Plain-rule flags plus whatever JEV is fairly sure of (0.6 or more). */
export function combineFlags(note: string, jev: Record<string, JevAnswer> | null): NoteFlagKind[] {
  const flags = new Set(noteFlags(note));
  if (jev) for (const k of Object.keys(NOTE_SUGGESTIONS) as NoteFlagKind[]) if ((pTrue(jev[k]) ?? 0) >= 0.6) flags.add(k);
  return (Object.keys(NOTE_SUGGESTIONS) as NoteFlagKind[]).filter((k) => flags.has(k));
}

export const describeFlags = (flags: NoteFlagKind[]) => ({
  flags: flags.map((kind) => ({ kind, message: NOTE_SUGGESTIONS[kind] })),
  blocked: flags.some((f) => BLOCKING.includes(f)),
});
