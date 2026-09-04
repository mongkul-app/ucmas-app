export interface LevelProgress {
  level: string;
  exercisesCompleted: number;
  bestAccuracy: number;
  bestScore: number;
  averageAccuracy: number;
  totalQuestionsAnswered: number;
  totalCorrect: number;
  totalTimeSec: number;
  progressPercent: number; // 0-100, derived heuristic
  lastPracticedAt: string | null;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  emoji: string;
  unlockedAt: string | null;
}
