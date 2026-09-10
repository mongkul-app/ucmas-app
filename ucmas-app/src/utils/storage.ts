import type { Student } from '../types/student';
import type { ExerciseResult } from '../types/exercise';
import type { LevelProgress, Achievement } from '../types/progress';
import { LEVELS } from '../data/levelConfig';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

/**
 * Storage service abstraction.
 *
 * Every read/write in the app goes through this module instead of touching
 * localStorage directly. Reads stay synchronous (backed by a localStorage
 * cache) so existing pages don't need to change — but when a Supabase
 * account is signed in, writes are also pushed to Supabase in the background,
 * and `syncFromSupabase()` pulls an account's data down into that same local
 * cache right after login. That's what makes progress follow a student
 * across devices while every page keeps reading `getX()` synchronously.
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

// ---------- Auth identity ----------
// Set once by App.tsx whenever the Supabase session changes. When null, the
// app behaves exactly as it always did: a local-only "Demo Student".

let currentUserId: string | null = null;

export function setAuthIdentity(userId: string | null): void {
  currentUserId = userId;
}

export function getCurrentUserId(): string | null {
  return currentUserId;
}

// ---------- Student ----------

export function getStudent(): Student {
  const existing = read<Student | null>(KEYS.student, null);
  const id = currentUserId ?? existing?.id ?? 'student_local';
  if (existing && existing.id === id) return existing;
  const fresh: Student = {
    id,
    name: existing?.name ?? 'Demo Student',
    currentLevel: existing?.currentLevel ?? 'foundation',
    createdAt: existing?.createdAt ?? new Date().toISOString(),
  };
  write(KEYS.student, fresh);
  return fresh;
}

export function saveStudent(student: Student): void {
  write(KEYS.student, student);
  if (supabase && currentUserId) {
    supabase
      .from('profiles')
      .upsert({ id: currentUserId, name: student.name, current_level: student.currentLevel })
      .then(
        () => {},
        () => {}
      );
  }
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

  if (supabase && currentUserId) {
    supabase
      .from('results')
      .insert({
        id: result.id,
        user_id: currentUserId,
        level: result.level,
        mode: result.mode,
        total_questions: result.totalQuestions,
        correct: result.correct,
        wrong: result.wrong,
        unanswered: result.unanswered,
        accuracy: result.accuracy,
        score: result.score,
        time_used: result.timeUsed,
        completed_at: result.completedAt,
        difficulty: result.difficulty,
      })
      .then(
        () => {},
        () => {}
      );
  }
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
  rowsOverride: number; // 0 = use each level's own default; otherwise 3-20 rows per question
}

const DEFAULT_SETTINGS: AppSettings = {
  soundEnabled: true,
  darkMode: false,
  timerSound: true,
  transitionSound: true,
  presentationSpeedMultiplier: 1,
  fontSize: 'md',
  language: 'en',
  rowsOverride: 0,
};

export function getSettings(): AppSettings {
  return { ...DEFAULT_SETTINGS, ...read<Partial<AppSettings>>(KEYS.settings, {}) };
}

export function saveSettings(settings: AppSettings): void {
  write(KEYS.settings, settings);
}

// ---------- Demo data seeding ----------

export function seedDemoDataIfEmpty(): void {
  // Real accounts start clean — only seed friendly demo data in local-only mode.
  if (isSupabaseConfigured && currentUserId) return;

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

// ---------- Supabase sync ----------

/**
 * Pulls an account's profile + results down from Supabase into the local
 * cache right after sign-in, so every existing synchronous page immediately
 * sees that account's real data. Called once from App.tsx when the session
 * becomes available.
 */
export async function syncFromSupabase(userId: string, fallbackName: string): Promise<void> {
  if (!supabase) return;
  setAuthIdentity(userId);

  const [{ data: profile }, { data: resultRows }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
    supabase.from('results').select('*').eq('user_id', userId).order('completed_at', { ascending: false }),
  ]);

  if (!profile) {
    // First time this account has ever signed in — create its profile row.
    await supabase.from('profiles').upsert({ id: userId, name: fallbackName, current_level: 'foundation' });
  }

  const student: Student = {
    id: userId,
    name: profile?.name ?? fallbackName,
    currentLevel: profile?.current_level ?? 'foundation',
    createdAt: profile?.created_at ?? new Date().toISOString(),
    isAdmin: profile?.is_admin ?? false,
  };
  write(KEYS.student, student);

  const results: ExerciseResult[] = (resultRows ?? []).map((r: Record<string, any>) => ({
    id: r.id,
    studentId: r.user_id,
    level: r.level,
    mode: r.mode,
    totalQuestions: r.total_questions,
    correct: r.correct,
    wrong: r.wrong,
    unanswered: r.unanswered,
    accuracy: r.accuracy,
    score: r.score,
    timeUsed: r.time_used,
    completedAt: r.completed_at,
    difficulty: r.difficulty,
  }));
  write(KEYS.results, results);

  // Recompute achievements from this account's real history, not whatever
  // happened to be cached on this device before signing in.
  write(KEYS.achievements, {});
  checkAndUnlockAchievements(results);
}

/** Resets the local cache back to a fresh anonymous "Demo Student" on sign-out. */
export function clearLocalIdentity(): void {
  setAuthIdentity(null);
  write<Student>(KEYS.student, {
    id: 'student_local',
    name: 'Demo Student',
    currentLevel: 'foundation',
    createdAt: new Date().toISOString(),
  });
  write(KEYS.results, []);
  write(KEYS.achievements, {});
}
