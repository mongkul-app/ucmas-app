import type { Operation } from '../types/exercise';
import type { LevelConfig } from '../data/levelConfig';

/**
 * Options shown on a level's page (Practice, Timed Test, Speed Training,
 * Random Challenge, Mental Arithmetic, Flash) — the same choices as the
 * Worksheet page, remembered in the browser between visits.
 *
 * For question count and time, 0 means "use the level's own default", so
 * nothing changes for anyone until they pick something.
 */

export const ROWS_OPTIONS = [0, ...Array.from({ length: 48 }, (_, i) => i + 3)]; // 0 = level default, 3..50
export const QUESTION_COUNT_OPTIONS = [0, ...Array.from({ length: 20 }, (_, i) => (i + 1) * 10)]; // 0 = level default, 10..200
export const TIME_OPTIONS = [0, ...Array.from({ length: 20 }, (_, i) => i + 1)]; // 0 = level default, 1..20 minutes
export const DIFFICULTY_OPTIONS = ['Easy', 'Normal', 'Hard'] as const;
export type Difficulty = (typeof DIFFICULTY_OPTIONS)[number];

// `ops: null` means "use the level's own addition/subtraction behavior"
// (including Foundation's abacus bead rules). Every other choice uses the
// mixed-operation engine with exactly these operations.
export interface OperationType {
  value: string;
  label: string;
  ops: Operation[] | null;
}

export const OPERATION_TYPES: OperationType[] = [
  { value: 'add', label: 'Addition', ops: ['+'] },
  { value: 'add_sub', label: 'Addition & Subtraction', ops: null },
  { value: 'mul', label: 'Multiplication', ops: ['×'] },
  { value: 'mul_add', label: 'Multiplication & Addition', ops: ['×', '+'] },
  { value: 'mul_div', label: 'Multiplication & Division', ops: ['×', '÷'] },
  { value: 'add_mul_div', label: 'Addition, Multiplication & Division', ops: ['+', '×', '÷'] },
  { value: 'mul_sub', label: 'Multiplication & Subtraction', ops: ['×', '-'] },
];

// With an explicit operation type, "Level Default" rows would be the level's
// long +/- chains (up to 15 rows), which makes little sense for × and ÷.
export const DEFAULT_ROWS_FOR_MIXED = 4;

export interface PracticeSettings {
  opType: string;
  rows: number; // 0 = level default
  questionCount: number; // 0 = level default
  timeMinutes: number; // 0 = level default
  difficulty: Difficulty;
}

const STORAGE_KEY = 'ucmas_practice_settings';
const LEGACY_APP_SETTINGS_KEY = 'ucmas_settings'; // older "rows per question" lived here

const DEFAULTS: PracticeSettings = {
  opType: 'add_sub',
  rows: 0,
  questionCount: 0,
  timeMinutes: 0,
  difficulty: 'Normal',
};

function readJson(key: string): Record<string, unknown> | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

function pickNumber(value: unknown, allowed: number[], fallback: number): number {
  return typeof value === 'number' && allowed.includes(value) ? value : fallback;
}

export function getPracticeSettings(): PracticeSettings {
  const saved = readJson(STORAGE_KEY);

  // Keep a "rows per question" choice made before this screen existed.
  const legacyRows = readJson(LEGACY_APP_SETTINGS_KEY)?.rowsOverride;
  const rowsFallback = pickNumber(legacyRows, ROWS_OPTIONS, DEFAULTS.rows);

  const opType =
    typeof saved?.opType === 'string' && OPERATION_TYPES.some((o) => o.value === saved.opType)
      ? saved.opType
      : DEFAULTS.opType;
  const difficulty = DIFFICULTY_OPTIONS.find((d) => d === saved?.difficulty) ?? DEFAULTS.difficulty;

  return {
    opType,
    rows: pickNumber(saved?.rows, ROWS_OPTIONS, rowsFallback),
    questionCount: pickNumber(saved?.questionCount, QUESTION_COUNT_OPTIONS, DEFAULTS.questionCount),
    timeMinutes: pickNumber(saved?.timeMinutes, TIME_OPTIONS, DEFAULTS.timeMinutes),
    difficulty,
  };
}

export function savePracticeSettings(settings: PracticeSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // localStorage unavailable (private mode / quota) — choices just won't persist.
  }
}

export function getOperationType(value: string): OperationType {
  return OPERATION_TYPES.find((o) => o.value === value) ?? OPERATION_TYPES[1];
}

/** Same difficulty scaling the Worksheet page uses for +/- levels. */
export function applyDifficulty(config: LevelConfig, difficulty: Difficulty): LevelConfig {
  const multiplier = difficulty === 'Easy' ? 0.7 : difficulty === 'Hard' ? 1.4 : 1;
  return {
    ...config,
    maxNumber: Math.max(config.minNumber + 1, Math.round(config.maxNumber * multiplier)),
    maxOperations: Math.max(config.minOperations, Math.round(config.maxOperations * multiplier)),
  };
}

export interface GenerationParams {
  config: LevelConfig;
  operationsOverride?: number;
  allowedOps?: Operation[];
}

/** Turns the saved choices into the arguments `generateQuestionSet` expects. */
export function buildGenerationParams(settings: PracticeSettings, level: LevelConfig): GenerationParams {
  const opType = getOperationType(settings.opType);
  const allowedOps = opType.ops ?? undefined;
  const operationsOverride =
    settings.rows > 0 ? settings.rows - 1 : allowedOps ? DEFAULT_ROWS_FOR_MIXED - 1 : undefined;
  return {
    config: applyDifficulty(level, settings.difficulty),
    operationsOverride,
    allowedOps,
  };
}

/** The chosen number of questions, or `fallback` when set to "Level Default". */
export function resolveQuestionCount(settings: PracticeSettings, fallback: number): number {
  return settings.questionCount > 0 ? settings.questionCount : fallback;
}

/** The chosen time limit in seconds, or `fallback` when set to "Level Default". */
export function resolveTimeLimitSec(settings: PracticeSettings, fallback: number): number {
  return settings.timeMinutes > 0 ? settings.timeMinutes * 60 : fallback;
}
