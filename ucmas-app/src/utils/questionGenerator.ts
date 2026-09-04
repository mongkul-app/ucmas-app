import type { Question, Operation } from '../types/exercise';
import type { LevelConfig } from '../data/levelConfig';

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[randInt(0, arr.length - 1)];
}

/**
 * Generates a single UCMAS-style vertical arithmetic question for a given level.
 *
 * The first number is always positive (no leading operation). Every subsequent
 * number gets a random operation from the level's allowed operations. The running
 * total is tracked as each operation is applied; for beginner levels we avoid the
 * running total dropping below the level's configured floor so results stay
 * age-appropriate, while higher levels permit deeper negative swings.
 */
export function generateQuestion(config: LevelConfig): Question {
  const opCount = randInt(config.minOperations, config.maxOperations);
  const numbers: number[] = [];
  const operations: Operation[] = [];

  const first = randInt(config.minNumber, config.maxNumber);
  numbers.push(first);
  let runningTotal = first;

  for (let i = 0; i < opCount; i++) {
    let op = pick(config.allowedOperations);
    let value = randInt(config.minNumber, config.maxNumber);

    // If subtracting would push the running total below the allowed floor,
    // and negative intermediates aren't allowed (or we're already at the floor),
    // force an addition instead so the exercise stays solvable and appropriate.
    if (op === '-' && runningTotal - value < config.minRunningTotal) {
      op = '+';
    }
    // Occasionally clamp subtraction so it never exceeds the current running total
    // for the very earliest levels (foundation), keeping results friendly for kids.
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
 * Generates `count` unique, non-duplicate questions for a level, in randomized order.
 */
export function generateQuestionSet(config: LevelConfig, count: number): Question[] {
  const questions: Question[] = [];
  const seen = new Set<string>();
  let attempts = 0;
  const maxAttempts = count * 40;

  while (questions.length < count && attempts < maxAttempts) {
    attempts++;
    const q = generateQuestion(config);
    const sig = signature(q);
    if (seen.has(sig)) continue;
    seen.add(sig);
    questions.push(q);
  }
  // Fallback: if we somehow can't find enough unique combos (tiny ranges), allow repeats.
  while (questions.length < count) {
    questions.push(generateQuestion(config));
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
