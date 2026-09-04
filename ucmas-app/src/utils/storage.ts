import type { Student } from '../types/student';
import type { ExerciseResult } from '../types/exercise';
import type { LevelProgress, Achievement } from '../types/progress';
import { LEVELS } from '../data/levelConfig';

/**
 * Storage service abstraction.
 *
 * Every read/write in the app goes through this module instead of touching
 * localStorage directly. Today it's backed by localStorage; later it can be
 * swapped for Supabase (or any API) by re-implementing the functions below
 * with the same signatures — nothing else in the app needs to change.
 */

const KEYS = {
  student: 'ucmas_student',
  results: 'ucmas_results',
  achievements: 'ucmas_achievements',
  settings: 'ucmas_settings',
};

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // localStorage unavailable (e.g. private browsing quota) — fail silently.
  }
}

// ---------- Student ----------

export function getStudent(): Student {
  const existing = read<Student | null>(KEYS.student, null);
  if (existing) return existing;
  const fresh: Student = {
    id: 'student_local',
    name: 'Demo Student',
    currentLevel: 'foundation',
    createdAt: new Date().toISOString(),
  };
  write(KEYS.student, fresh);
  return fresh;
}

export function saveStudent(student: Student): void {
  write(KEYS.student, student);
}

// ---------- Results ----------

export function getResults(): ExerciseResult[] {
  return read<ExerciseResult[]>(KEYS.results, []);
}

export function saveResult(result: ExerciseResult): void {
  const all = getResults();
  all.unshift(result);
  write(KEYS.results, all);
  checkAndUnlockAchievements(all);
}

export function getResultsForLevel(level: string): ExerciseResult[] {
  return getResults().filter((r) => r.level === level);
}

// ---------- Progress ----------

export function getProgress(): LevelProgress[] {
  const results = getResults();
  return LEVELS.map((level) => {
    const levelResults = results.filter((r) => r.level === level.id);
    if (levelResults.length === 0) {
      return {
        level: level.id,
        exercisesCompleted: 0,
        bestAccuracy: 0,
        bestScore: 0,
        averageAccuracy: 0,
        totalQuestionsAnswered: 0,
        totalCorrect: 0,
        totalTimeSec: 0,
        progressPercent: 0,
        lastPracticedAt: null,
      };
    }
    const bestAccuracy = Math.max(...levelResults.map((r) => r.accuracy));
    const bestScore = Math.max(...levelResults.map((r) => r.score));
    const averageAccuracy = Math.round(
      levelResults.reduce((sum, r) => sum + r.accuracy, 0) / levelResults.length
    );
    const totalQuestionsAnswered = levelResults.reduce((sum, r) => sum + r.totalQuestions, 0);
    const totalCorrect = levelResults.reduce((sum, r) => sum + r.correct, 0);
    const totalTimeSec = levelResults.reduce((sum, r) => sum + r.timeUsed, 0);
    // Heuristic mastery: blends volume of practice with best accuracy achieved.
    const volumeScore = Math.min(1, levelResults.length / 15);
    const progressPercent = Math.round(volumeScore * 40 + (bestAccuracy / 100) * 60);

    return {
      level: level.id,
      exercisesCompleted: levelResults.length,
      bestAccuracy,
      bestScore,
      averageAccuracy,
      totalQuestionsAnswered,
      totalCorrect,
      totalTimeSec,
      progressPercent,
      lastPracticedAt: levelResults[0].completedAt,
    };
  });
}

// ---------- Achievements ----------

const ACHIEVEMENT_DEFS: Omit<Achievement, 'unlockedAt'>[] = [
  { id: 'first-practice', title: 'First Practice', description: 'Complete your first exercise', emoji: '🏆' },
  { id: 'five-day-streak', title: '5 Day Streak', description: 'Practice on 5 different days', emoji: '🔥' },
  { id: 'speed-master', title: 'Speed Master', description: 'Finish a test in under 60% of the time limit', emoji: '⚡' },
  { id: 'accuracy-master', title: 'Accuracy Master', description: 'Achieve 100% accuracy on a test', emoji: '🎯' },
  { id: 'foundation-champion', title: 'Foundation Champion', description: 'Complete 10 Foundation exercises', emoji: '🏅' },
];

export function getAchievements(): Achievement[] {
  const unlocked = read<Record<string, string>>(KEYS.achievements, {});
  return ACHIEVEMENT_DEFS.map((def) => ({ ...def, unlockedAt: unlocked[def.id] ?? null }));
}

function unlock(id: string, unlockedMap: Record<string, string>) {
  if (!unlockedMap[id]) unlockedMap[id] = new Date().toISOString();
}

function checkAndUnlockAchievements(allResults: ExerciseResult[]) {
  const unlockedMap = read<Record<string, string>>(KEYS.achievements, {});

  if (allResults.length >= 1) unlock('first-practice', unlockedMap);

  const uniqueDays = new Set(allResults.map((r) => r.completedAt.slice(0, 10)));
  if (uniqueDays.size >= 5) unlock('five-day-streak', unlockedMap);

  if (allResults.some((r) => r.accuracy === 100)) unlock('accuracy-master', unlockedMap);

  const foundationCount = allResults.filter((r) => r.level === 'foundation').length;
  if (foundationCount >= 10) unlock('foundation-champion', unlockedMap);

  write(KEYS.achievements, unlockedMap);
}

export function unlockAchievement(id: string): void {
  const unlockedMap = read<Record<string, string>>(KEYS.achievements, {});
  unlock(id, unlockedMap);
  write(KEYS.achievements, unlockedMap);
}

// ---------- Settings ----------

export interface AppSettings {
  soundEnabled: boolean;
  darkMode: boolean;
  timerSound: boolean;
  transitionSound: boolean;
  presentationSpeedMultiplier: number; // 1 = default, <1 faster, >1 slower
  fontSize: 'sm' | 'md' | 'lg';
  language: 'en' | 'km';
}

const DEFAULT_SETTINGS: AppSettings = {
  soundEnabled: true,
  darkMode: false,
  timerSound: true,
  transitionSound: true,
  presentationSpeedMultiplier: 1,
  fontSize: 'md',
  language: 'en',
};

export function getSettings(): AppSettings {
  return read<AppSettings>(KEYS.settings, DEFAULT_SETTINGS);
}

export function saveSettings(settings: AppSettings): void {
  write(KEYS.settings, settings);
}

// ---------- Demo data seeding ----------

export function seedDemoDataIfEmpty(): void {
  const existing = getResults();
  if (existing.length > 0) return;

  const now = Date.now();
  const demo: ExerciseResult[] = [];
  const demoLevels = [
    { level: 'foundation', count: 15, acc: 92, score: 190 },
    { level: 'level-1', count: 8, acc: 87, score: 175 },
    { level: 'level-2', count: 4, acc: 78, score: 150 },
  ];

  demoLevels.forEach(({ level, count, acc }, levelIdx) => {
    for (let i = 0; i < count; i++) {
      const daysAgo = count - i + levelIdx;
      const accuracy = Math.max(50, Math.min(100, acc + Math.round((Math.random() - 0.5) * 16)));
      const total = 20;
      const correct = Math.round((accuracy / 100) * total);
      const wrong = total - correct;
      const timeUsed = 180 + Math.round(Math.random() * 120);
      demo.push({
        id: `demo_${level}_${i}`,
        studentId: 'student_local',
        level,
        mode: i % 3 === 0 ? 'timed-test' : 'practice',
        totalQuestions: total,
        correct,
        wrong,
        unanswered: 0,
        accuracy,
        score: Math.round(correct * 10 * (accuracy / 100) + accuracy * 0.4),
        timeUsed,
        completedAt: new Date(now - daysAgo * 86400000).toISOString(),
        difficulty: level === 'foundation' ? 'Easy' : 'Normal',
      });
    }
  });

  demo.sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
  write(KEYS.results, demo);
}
