export type Operation = '+' | '-';

export interface Question {
  id: string;
  numbers: number[];       // absolute values shown to the student, in order
  operations: Operation[]; // operation applied to numbers[1..]; numbers[0] has no leading operation
  answer: number;
}

export type ExerciseMode =
  | 'practice'
  | 'timed-test'
  | 'speed-training'
  | 'random-challenge'
  | 'worksheet'
  | 'mental-arithmetic';

export interface QuestionAttempt {
  question: Question;
  studentAnswer: number | null;
  correct: boolean;
  timeSpentSec: number;
}

export interface ExerciseResult {
  id: string;
  studentId: string;
  level: string;
  mode: ExerciseMode;
  totalQuestions: number;
  correct: number;
  wrong: number;
  unanswered: number;
  accuracy: number;
  score: number;
  timeUsed: number; // seconds
  completedAt: string;
  difficulty: string;
}
