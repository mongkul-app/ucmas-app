import type { Question, Operation } from '../types/exercise';
import type { LevelConfig } from '../data/levelConfig';

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[randInt(0, arr.length - 1)];
}

/**
 * Decomposes a single-digit value (0-9) into what it looks like on one
 * abacus rod: 1 heaven bead worth 5 (hv: 0 or 1) plus up to 4 earth beads
 * worth 1 each (ev: 0-4).
 */
function decomposeDigit(v: number): { hv: number; ev: number } {
  const hv = v >= 5 ? 1 : 0;
  return { hv, ev: v - 5 * hv };
}

/**
 * Generates a Foundation-style question where every +/- is a *direct* bead
 * move on a single abacus rod — no "friend/complement" borrowing technique
 * (that's introduced at higher levels). Given the rod's current state
 * (h heaven beads, e earth beads), adding v is only legal if there's room to
 * move the beads for v *toward* the bar without first clearing others out of
 * the way, and subtracting v is only legal if those beads are already down.
 * This is stricter than simply keeping the running total within 0-9 — e.g.
 * 5+4 is blocked even though both digits and the total (9) are individually
 * fine, because it requires swapping the heaven bead for four earth beads.
 */
function generateAbacusDirectQuestion(rowsCount: number): Question {
  const first = randInt(1, 9);
  let { hv: h, ev: e } = decomposeDigit(first);
  const numbers: number[] = [first];
  const operations: Operation[] = [];

  for (let i = 1; i < rowsCount; i++) {
    const preferAdd = Math.random() < 0.55;
    const order: Operation[] = preferAdd ? ['+', '-'] : ['-', '+'];
    let placed = false;

    for (const op of order) {
      const candidates: number[] = [];
      for (let v = 1; v <= 9; v++) {
        const d = decomposeDigit(v);
        if (op === '+') {
          if (h + d.hv <= 1 && e + d.ev <= 4) candidates.push(v);
        } else if (d.hv <= h && d.ev <= e) {
          candidates.push(v);
        }
      }
      if (candidates.length) {
        const v = pick(candidates);
        const d = decomposeDigit(v);
        if (op === '+') {
          h += d.hv;
          e += d.ev;
        } else {
          h -= d.hv;
          e -= d.ev;
        }
        numbers.push(v);
        operations.push(op);
        placed = true;
        break;
      }
    }

    if (!placed) {
      // Safety net only — analytically this never triggers: subtracting the
      // rod's current total, or adding to an empty rod, is always legal.
      const total = h * 5 + e;
      if (total > 0) {
        numbers.push(total);
        operations.push('-');
        h = 0;
        e = 0;
      } else {
        const v = randInt(1, 9);
        const d = decomposeDigit(v);
        h += d.hv;
        e += d.ev;
        numbers.push(v);
        operations.push('+');
      }
    }
  }

  return {
    id: `q_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    numbers,
    operations,
    answer: h * 5 + e,
  };
}

// Largest running total a mixed-operation question may reach. Without a cap,
// chains of × grow explosively (20 rows of ×2-9 reaches the quadrillions),
// which is useless on a worksheet and overflows the 2cm answer box.
const MIXED_TOTAL_CAP = 9999;

/** Values that operation `op` may legally use on the current running total. */
function mixedCandidates(op: Operation, total: number): number[] {
  const values: number[] = [];
  if (op === '+') {
    for (let v = 1; v <= 9; v++) if (total + v <= MIXED_TOTAL_CAP) values.push(v);
  } else if (op === '-') {
    // Leave at least 1 so the total never reaches 0 (× and ÷ on 0 are pointless).
    for (let v = 1; v <= Math.min(9, total - 1); v++) values.push(v);
  } else if (op === '×') {
    if (total > 0) for (let v = 2; v <= 9; v++) if (total * v <= MIXED_TOTAL_CAP) values.push(v);
  } else if (total > 0) {
    // '÷': only divisors of the current total, so answers stay whole numbers.
    for (let v = 2; v <= 9; v++) if (total % v === 0) values.push(v);
  }
  return values;
}

/**
 * Generates a question whose operations are drawn from an explicit list that
 * may include multiplication (×) and/or division (÷), in addition to +/-.
 * This is a separate, simpler engine from the abacus/running-total logic
 * above: operands are single digits, every answer is a whole number
 * (division only uses exact divisors), the running total never goes below 0
 * and never exceeds MIXED_TOTAL_CAP.
 *
 * Each row picks a random allowed operation; if that operation has no legal
 * value right now (e.g. × would exceed the cap, ÷ has no exact divisor), the
 * other allowed operations are tried. If none fit, the row falls back to
 * "+" on an empty total, otherwise "×1" (leaves the total unchanged and keeps
 * the requested number of rows) — this mostly happens with pure
 * multiplication and many rows.
 *
 * Used only when the caller explicitly picks an operation type (see the
 * Worksheet page's dropdown) — the default +/- behavior, including
 * Foundation's abacus-direct rules, is untouched otherwise.
 */
function generateMixedChain(rowsCount: number, allowedOps: Operation[]): Question {
  const first = randInt(2, 9);
  const numbers: number[] = [first];
  const operations: Operation[] = [];
  let total = first;

  for (let i = 1; i < rowsCount; i++) {
    // Try the allowed operations in random order, take the first that fits.
    const order = [...allowedOps].sort(() => Math.random() - 0.5);
    let chosenOp: Operation | null = null;
    let value = 0;
    for (const op of order) {
      const values = mixedCandidates(op, total);
      if (values.length > 0) {
        chosenOp = op;
        value = pick(values);
        break;
      }
    }

    if (chosenOp === null) {
      if (total === 0) {
        chosenOp = '+';
        value = randInt(1, 9);
      } else {
        chosenOp = '×';
        value = 1;
      }
    }

    numbers.push(value);
    operations.push(chosenOp);
    if (chosenOp === '+') total += value;
    else if (chosenOp === '-') total -= value;
    else if (chosenOp === '×') total *= value;
    else total /= value;
  }

  return {
    id: `q_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    numbers,
    operations,
    answer: total,
  };
}

/**
 * Generates a single UCMAS-style vertical arithmetic question for a given level.
 *
 * The first number is always positive (no leading operation). Every subsequent
 * number gets a random operation from the level's allowed operations. The running
 * total is tracked as each operation is applied; for beginner levels we avoid the
 * running total dropping below the level's configured floor so results stay
 * age-appropriate, while higher levels permit deeper negative swings.
 *
 * `allowedOpsOverride`, when given, replaces the level's own behavior with the
 * mixed-operation engine (needed for × and ÷).
 */
export function generateQuestion(
  config: LevelConfig,
  operationsOverride?: number,
  allowedOpsOverride?: Operation[]
): Question {
  const opCount =
    operationsOverride && operationsOverride > 0
      ? operationsOverride
      : randInt(config.minOperations, config.maxOperations);

  // An explicit operation-type choice takes priority over everything,
  // including Foundation's abacus-direct rules.
  if (allowedOpsOverride && allowedOpsOverride.length > 0) {
    return generateMixedChain(opCount + 1, allowedOpsOverride);
  }

  if (config.abacusDirect) {
    return generateAbacusDirectQuestion(opCount + 1);
  }

  const numbers: number[] = [];
  const operations: Operation[] = [];

  const first = randInt(config.minNumber, config.maxNumber);
  numbers.push(first);
  let runningTotal = first;

  for (let i = 0; i < opCount; i++) {
    let op = pick(config.allowedOperations);
    let value = randInt(config.minNumber, config.maxNumber);

    // If subtracting would push the running total below the allowed floor,
    // force an addition instead so the exercise stays solvable.
    if (op === '-' && runningTotal - value < config.minRunningTotal) {
      op = '+';
    }
    // For the earliest levels, never subtract more than the running total.
    if (!config.negativeIntermediateAllowed && op === '-' && value > runningTotal) {
      if (runningTotal <= 0) {
        op = '+';
        value = randInt(config.minNumber, config.maxNumber);
      } else {
        value = randInt(1, runningTotal);
      }
    }

    numbers.push(value);
    operations.push(op);
    runningTotal = op === '+' ? runningTotal + value : runningTotal - value;
  }

  return {
    id: `q_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    numbers,
    operations,
    answer: runningTotal,
  };
}

/** Produces a signature string used to detect duplicate questions within a single set. */
function signature(q: Question): string {
  return q.numbers.map((n, i) => (i === 0 ? `${n}` : `${q.operations[i - 1]}${n}`)).join('|');
}

/**
 * Generates `count` unique, non-duplicate questions for a level.
 * `operationsOverride`, when set, fixes the number of operations per question
 * (i.e. rows - 1). `allowedOpsOverride`, when set, picks which operations
 * (+ - × ÷) the questions may use.
 */
export function generateQuestionSet(
  config: LevelConfig,
  count: number,
  operationsOverride?: number,
  allowedOpsOverride?: Operation[]
): Question[] {
  const questions: Question[] = [];
  const seen = new Set<string>();
  let attempts = 0;
  const maxAttempts = count * 40;

  while (questions.length < count && attempts < maxAttempts) {
    attempts++;
    const q = generateQuestion(config, operationsOverride, allowedOpsOverride);
    const sig = signature(q);
    if (seen.has(sig)) continue;
    seen.add(sig);
    questions.push(q);
  }
  // Fallback: if we can't find enough unique combos (tiny ranges), allow repeats.
  while (questions.length < count) {
    questions.push(generateQuestion(config, operationsOverride, allowedOpsOverride));
  }
  return questions;
}

/** Renders a question as the display lines used in the vertical worksheet layout. */
export function questionToLines(q: Question): string[] {
  return q.numbers.map((n, i) => {
    if (i === 0) return `${n}`;
    const op = q.operations[i - 1];
    return `${op}${n}`;
  });
}
