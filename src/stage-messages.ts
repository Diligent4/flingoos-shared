/**
 * User-facing stage progress messages
 *
 * Maps internal stage codes (A, B, C, D, E, F, U) to fun, randomized messages
 * that hide implementation details from users.
 *
 * Each stage has multiple message variants - one is selected randomly each time
 * to keep the UX fresh and engaging.
 */

export type StageCode = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'U';

export interface StageMessageMap {
  [key: string]: string[];
}

/**
 * Stage display messages - banana-themed monkey workflow
 *
 * Stage meanings:
 * - A: Data collection (gathering)
 * - B: Segmentation (sorting)
 * - C: LLM prep (preparation)
 * - D: LLM analysis (inspection) - supports {n}/{N} for progress within stage
 * - E: Workflow synthesis (packing)
 * - F: Quality assessment (final check)
 * - U: Upload (delivery)
 */
export const STAGE_MESSAGES: StageMessageMap = {
  A: [
    "Monkey's out hunting bananas",
    "Scouting every tree for gold",
    "Hunting for the next ripe bunch",
    "Gathering bananas from the forest",
    "Climbing trees for the best fruit"
  ],
  B: [
    "Sorting bananas into piles",
    "Stacking the bunches neatly",
    "Lining up the bananas by size",
    "Organizing the harvest",
    "Arranging bananas by ripeness"
  ],
  C: [
    "Peeling data down to core",
    "Blending bananas into shape",
    "Getting the mix just right",
    "Preparing the perfect blend",
    "Mashing bananas for smoothness"
  ],
  D: [
    "Inspecting banana {n}/{N}",
    "Checking banana {n}/{N}",
    "Reviewing bunch {n}/{N}",
    "Examining banana {n}/{N}",
    "Quality checking {n}/{N}"
  ],
  E: [
    "Packing the best bananas",
    "Arranging the final bunch",
    "Tying the basket together",
    "Bundling up the harvest",
    "Assembling the perfect bunch"
  ],
  F: [
    "Monkey double-check",
    "No banana left behind",
    "Final monkey inspection",
    "One last quality pass",
    "Making sure everything's perfect"
  ],
  U: [
    "Swinging off with the loot",
    "Carrying the basket to the cloud",
    "Job done — bananas secured",
    "Delivering the goods",
    "Uploading to banana heaven"
  ]
};

/**
 * Get a random display message for a given stage
 *
 * @param stage - The stage code (A-F, U)
 * @param n - Current item number (for stages that support {n}/{N} like stage D)
 * @param total - Total items (for stages that support {n}/{N} like stage D)
 * @returns A user-friendly progress message
 *
 * @example
 * getStageMessage('A') // "Scouting every tree for gold"
 * getStageMessage('D', 3, 10) // "Inspecting banana 3/10"
 */
export function getStageMessage(
  stage: StageCode,
  n?: number,
  total?: number
): string {
  const messages = STAGE_MESSAGES[stage];
  if (!messages || messages.length === 0) {
    return `Processing stage ${stage}...`;
  }

  // Pick a random message from the array
  const randomMessage = messages[Math.floor(Math.random() * messages.length)];

  // Replace placeholders if provided
  if (n !== undefined && total !== undefined) {
    return randomMessage
      .replace('{n}', n.toString())
      .replace('{N}', total.toString());
  }

  return randomMessage;
}

/**
 * Get all possible messages for a stage (useful for testing/preview)
 *
 * @param stage - The stage code
 * @returns Array of all messages for that stage
 */
export function getAllStageMessages(stage: StageCode): string[] {
  return STAGE_MESSAGES[stage] || [];
}

/**
 * Validate that a stage code is supported
 *
 * @param stage - The stage code to validate
 * @returns true if stage is supported
 */
export function isValidStageCode(stage: string): stage is StageCode {
  return stage in STAGE_MESSAGES;
}

/**
 * Clear technical labels for stages (used in admin UI)
 * 
 * These provide transparent, professional descriptions of what's happening
 * during each processing stage.
 */
export const STAGE_LABELS: Record<StageCode, string> = {
  A: "Uploading data",
  B: "Extracting content", 
  C: "Segmenting timeline",
  D: "Normalizing data",
  E: "LLM interpretation",
  F: "Structuring workflow",
  U: "Finalizing output"
};

/**
 * Get the technical label for a stage
 *
 * @param stage - The stage code (A-F, U)
 * @returns A clear, professional label for the stage
 *
 * @example
 * getStageLabel('A') // "Uploading data"
 * getStageLabel('E') // "LLM interpretation"
 */
export function getStageLabel(stage: StageCode): string {
  return STAGE_LABELS[stage] || `Stage ${stage}`;
}

/**
 * Get stage number from code (A=1, B=2, ..., U=7)
 *
 * @param stage - The stage code
 * @returns The stage number (1-7)
 *
 * @example
 * getStageNumber('A') // 1
 * getStageNumber('U') // 7
 */
export function getStageNumber(stage: StageCode): number {
  const map: Record<StageCode, number> = {
    A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, U: 7
  };
  return map[stage] || 0;
}

/**
 * Get all stage codes in order
 *
 * @returns Array of all stage codes in processing order
 */
export function getAllStageCodes(): StageCode[] {
  return ['A', 'B', 'C', 'D', 'E', 'F', 'U'];
}
