import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { generateQuestionSet } from '../utils/questionGenerator';
import { calculateAccuracy, calculateScore } from '../utils/scoring';
import { getStudent, saveResult, unlockAchievement } from '../utils/storage';
import type { LevelConfig } from '../data/levelConfig';
import type { ExerciseMode, Question, QuestionAttempt } from '../types/exercise';

export type SessionPhase = 'running' | 'finished';

interface UseExerciseSessionOptions {
  config: LevelConfig;
  mode: ExerciseMode;
  questionCount?: number;
  timeLimitSec?: number | null; // null = untimed (Practice mode)
}

export interface SessionResultSummary {
  totalQuestions: number;
  correct: number;
  wrong: number;
  unanswered: number;
  accuracy: number;
  score: number;
  timeUsed: number;
  attempts: QuestionAttempt[];
}

const STORAGE_KEY_PREFIX = 'ucmas_session_';

export function useExerciseSession({ config, mode, questionCount, timeLimitSec }: UseExerciseSessionOptions) {
  const count = questionCount ?? config.questionCount;
  const limit = timeLimitSec === undefined ? config.defaultTimeLimitSec : timeLimitSec;

  const sessionKey = `${STORAGE_KEY_PREFIX}${config.id}_${mode}`;

  const [questions] = useState<Question[]>(() => {
    // Try to recover an in-progress session (e.g. after an accidental refresh).
    try {
      const raw = sessionStorage.getItem(sessionKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.questions?.length === count) return parsed.questions;
      }
    } catch {
      /* ignore */
    }
    return generateQuestionSet(config, count);
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [attempts, setAttempts] = useState<QuestionAttempt[]>([]);
  const [phase, setPhase] = useState<SessionPhase>('running');
  const [elapsedSec, setElapsedSec] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [result, setResult] = useState<SessionResultSummary | null>(null);

  const startTimeRef = useRef<number>(Date.now());
  const questionStartRef = useRef<number>(Date.now());
  const pausedAccumRef = useRef<number>(0);
  const pauseStartRef = useRef<number | null>(null);

  // Persist minimal recoverable state.
  useEffect(() => {
    try {
      sessionStorage.setItem(sessionKey, JSON.stringify({ questions, startedAt: startTimeRef.current }));
    } catch {
      /* ignore */
    }
  }, [questions, sessionKey]);

  const finish = useCallback(
    (finalAttempts: QuestionAttempt[]) => {
      const correct = finalAttempts.filter((a) => a.correct).length;
      const answered = finalAttempts.filter((a) => a.studentAnswer !== null).length;
      const wrong = answered - correct;
      const unanswered = finalAttempts.length - answered;
      const totalQuestions = questions.length;
      const timeUsed = Math.round((Date.now() - startTimeRef.current - pausedAccumRef.current) / 1000);
      const accuracy = calculateAccuracy(correct, totalQuestions);
      const score = calculateScore({
        correct,
        wrong,
        unanswered,
        totalQuestions,
        timeUsedSec: timeUsed,
        timeLimitSec: limit ?? timeUsed,
      });

      const summary: SessionResultSummary = {
        totalQuestions,
        correct,
        wrong,
        unanswered,
        accuracy,
        score,
        timeUsed,
        attempts: finalAttempts,
      };

      const student = getStudent();
      saveResult({
        id: `result_${Date.now()}`,
        studentId: student.id,
        level: config.id,
        mode,
        totalQuestions,
        correct,
        wrong,
        unanswered,
        accuracy,
        score,
        timeUsed,
        completedAt: new Date().toISOString(),
        difficulty: config.difficulty,
      });

      if (limit && timeUsed <= limit * 0.6 && accuracy >= 80) {
        unlockAchievement('speed-master');
      }

      try {
        sessionStorage.removeItem(sessionKey);
      } catch {
        /* ignore */
      }

      setResult(summary);
      setPhase('finished');
    },
    [config.difficulty, config.id, limit, mode, questions.length, sessionKey]
  );

  const submitAnswer = useCallback(
    (value: number | null) => {
      if (phase !== 'running') return;
      const q = questions[currentIndex];
      const timeSpentSec = Math.round((Date.now() - questionStartRef.current) / 1000);
      const attempt: QuestionAttempt = {
        question: q,
        studentAnswer: value,
        correct: value !== null && value === q.answer,
        timeSpentSec,
      };
      const nextAttempts = [...attempts, attempt];
      setAttempts(nextAttempts);

      if (currentIndex + 1 >= questions.length) {
        finish(nextAttempts);
      } else {
        setCurrentIndex((i) => i + 1);
        questionStartRef.current = Date.now();
      }
    },
    [attempts, currentIndex, finish, phase, questions]
  );

  const skipRemaining = useCallback(() => {
    if (phase !== 'running') return;
    const remaining = questions.slice(currentIndex).map((q) => ({
      question: q,
      studentAnswer: null,
      correct: false,
      timeSpentSec: 0,
    }));
    finish([...attempts, ...remaining]);
  }, [attempts, currentIndex, finish, phase, questions]);

  const togglePause = useCallback(() => {
    setIsPaused((p) => {
      if (!p) {
        pauseStartRef.current = Date.now();
      } else if (pauseStartRef.current) {
        pausedAccumRef.current += Date.now() - pauseStartRef.current;
        pauseStartRef.current = null;
      }
      return !p;
    });
  }, []);

  // Elapsed-time ticker.
  useEffect(() => {
    if (phase !== 'running' || isPaused) return;
    const interval = setInterval(() => {
      setElapsedSec(Math.floor((Date.now() - startTimeRef.current - pausedAccumRef.current) / 1000));
    }, 250);
    return () => clearInterval(interval);
  }, [phase, isPaused]);

  // Auto-submit when the overall time limit is reached.
  useEffect(() => {
    if (!limit || phase !== 'running' || isPaused) return;
    if (elapsedSec >= limit) {
      skipRemaining();
    }
  }, [elapsedSec, limit, phase, isPaused, skipRemaining]);

  const remainingSec = useMemo(() => (limit ? Math.max(0, limit - elapsedSec) : null), [limit, elapsedSec]);

  return {
    questions,
    currentQuestion: questions[currentIndex],
    currentIndex,
    totalQuestions: questions.length,
    attempts,
    phase,
    elapsedSec,
    remainingSec,
    isPaused,
    result,
    submitAnswer,
    skipRemaining,
    togglePause,
  };
}
