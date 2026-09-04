export interface ScoreInput {
  correct: number;
  wrong: number;
  unanswered: number;
  totalQuestions: number;
  timeUsedSec: number;
  timeLimitSec: number;
}

/** Central, tweakable scoring formula. Accuracy is weighted above raw speed. */
export const SCORING_CONFIG = {
  pointsPerCorrect: 10,
  accuracyBonusMax: 40, // awarded at 100% accuracy, scaled down linearly
  speedBonusMax: 20, // awarded for finishing well under the time limit
  speedBonusThreshold: 0.6, // finishing at or under 60% of the time limit gets full speed bonus
};

export function calculateAccuracy(correct: number, totalQuestions: number): number {
  if (totalQuestions === 0) return 0;
  return Math.round((correct / totalQuestions) * 100);
}

export function calculateScore(input: ScoreInput): number {
  const { correct, totalQuestions, timeUsedSec, timeLimitSec } = input;
  if (totalQuestions === 0) return 0;

  const base = correct * SCORING_CONFIG.pointsPerCorrect;
  const accuracy = calculateAccuracy(correct, totalQuestions) / 100;
  const accuracyBonus = Math.round(accuracy * SCORING_CONFIG.accuracyBonusMax);

  let speedBonus = 0;
  if (timeLimitSec > 0) {
    const ratio = timeUsedSec / timeLimitSec;
    if (ratio <= SCORING_CONFIG.speedBonusThreshold) {
      speedBonus = SCORING_CONFIG.speedBonusMax;
    } else if (ratio < 1) {
      const remainingRange = 1 - SCORING_CONFIG.speedBonusThreshold;
      const position = (1 - ratio) / remainingRange;
      speedBonus = Math.round(SCORING_CONFIG.speedBonusMax * Math.max(0, position));
    }
  }

  // Accuracy dominates: speed bonus is only fully applied when accuracy is reasonably high.
  const speedWeight = accuracy >= 0.5 ? 1 : accuracy;
  return base + accuracyBonus + Math.round(speedBonus * speedWeight);
}

export function maxPossibleScore(totalQuestions: number): number {
  return totalQuestions * SCORING_CONFIG.pointsPerCorrect + SCORING_CONFIG.accuracyBonusMax + SCORING_CONFIG.speedBonusMax;
}

export function motivationalMessage(accuracy: number): string {
  if (accuracy >= 90) return 'Excellent! Your calculation skills are improving rapidly!';
  if (accuracy >= 75) return 'Great job! Keep practicing to improve your speed.';
  if (accuracy >= 50) return 'Good effort! Practice a little more.';
  return 'Keep practicing. Accuracy comes first!';
}

export function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = Math.floor(totalSeconds % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}
