// The reviewer's library and the rules around it. Pure functions only (no network), so they can be
// unit-tested. server.ts does the calls to JEV (the checker). JEV only flags; a person decides.
import { noul, choice, pTrue, type JevAnswer, type JevQuestion } from "./jev";
import type { SourceCheck } from "./sources";

export type PieceKind = "quote" | "proverb" | "own" | "teaching";
export type PieceStatus = "pending" | "approved" | "rejected";

export interface PieceLabels {
  theme?: string;
  /** Probabilities (0..1) from JEV. */
  prediction?: number;
  preachy?: number;
  attribution?: number;
}

export interface LibraryPiece {
  id: string;
  text: string;
  translation?: string;
  author: string;
  source?: string;
  kind: PieceKind;
  status: PieceStatus;
  labels?: PieceLabels;
  /** Reasons a curator should look twice. */
  flags: string[];
  /** What the misattribution list and Wikiquote said about who really said it. */
  sourceCheck?: SourceCheck;
  /** A person checked the source and vouches for the credit. Needed before bulk approval of named quotes. */
  sourceChecked?: boolean;
  createdAt: string;
  reviewedAt?: string;
}

export const THEMES: Record<string, string> = {
  resilience: "Getting through hardship, setbacks, starting again",
  grief: "Loss, mourning, missing someone",
  courage: "Facing fear, taking a step",
  focus: "Stillness, attention, peace of mind, worry",
  love: "Love, family, friendship, kindness",
  work: "Effort, patience, discipline, diligence",
  purpose: "Meaning, direction, who you are, where you came from",
  hope: "Hope, faith, a better tomorrow without promising one",
  humility: "Humility, character, being a good person",
};

export const KINDS = new Set<PieceKind>(["quote", "proverb", "own", "teaching"]);

// ---------- JEV questions ----------

export const pieceState = (p: Pick<LibraryPiece, "text" | "translation" | "author" | "source">) =>
  [`Quote: ${p.text}`, p.translation ? `Translation: ${p.translation}` : "", `Credited to: ${p.author}`, p.source ? `Source: ${p.source}` : ""]
    .filter(Boolean)
    .join("\n");

export const labelQuestions = (): Record<string, JevQuestion> => ({
  theme: choice("Which one theme does this quote speak to most?", THEMES),
  prediction: noul(
    "Does the quote predict the future, or claim fate, luck, the stars or the universe will decide what happens?",
    "Makes a prediction or a fortune-telling claim",
    "Offers wisdom without predicting anything"
  ),
  preachy: noul(
    "Does the quote shame, scold or talk down to someone who is struggling?",
    "Shaming, scolding or condescending",
    "Kind, or neutral wisdom"
  ),
  attribution: noul(
    "Is the quote genuinely from the credited person or tradition, and not a well-known misattribution or a modern paraphrase?",
    "Genuinely theirs (or a traditional proverb credited as such)",
    "Misattributed, invented, or a paraphrase presented as their words"
  ),
});

/** Turns JEV's answers into labels and curator flags. */
export function applyLabels(answers: Record<string, JevAnswer> | null): { labels?: PieceLabels; flags: string[] } {
  if (!answers) return { flags: [NOT_LABELED] };
  const labels: PieceLabels = {
    theme: answers.theme?.choice && answers.theme.choice in THEMES ? answers.theme.choice : undefined,
    prediction: pTrue(answers.prediction) ?? undefined,
    preachy: pTrue(answers.preachy) ?? undefined,
    attribution: pTrue(answers.attribution) ?? undefined,
  };
  return { labels, flags: labelFlags(labels) };
}

export const NOT_LABELED = "Not labeled yet (JEV unavailable)";

/** Curator flags for a piece's labels. */
export function labelFlags(labels: PieceLabels): string[] {
  const flags: string[] = [];
  if ((labels.prediction ?? 0) >= 0.5) flags.push("Sounds like a prediction or fortune-telling");
  if ((labels.preachy ?? 0) >= 0.5) flags.push("May sound preachy or shaming");
  // Famous misattributions sound genuine to a model, so anything short of confident gets a human look.
  if (labels.attribution !== undefined && labels.attribution < 0.8) flags.push("Check who really said this");
  return flags;
}
