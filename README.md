# UCMAS Mental Math Trainer

A complete, working UCMAS-style mental arithmetic training web app: React + TypeScript + Vite + Tailwind CSS, fully functional with LocalStorage persistence (no backend required).

## 1. Install & Run

Requires Node.js 18+.

```bash
npm install
npm run dev
```

Open the printed local URL (usually `http://localhost:5173`). The app seeds realistic demo data on first load so the Dashboard isn't empty.

## 2. Build for production

```bash
npm run build
npm run preview   # optional: preview the production build locally
```

The build output lands in `dist/`.

## 3. Deploy

**Vercel**
1. Push this project to a GitHub repo.
2. Import it in Vercel — framework preset "Vite" is auto-detected.
3. Build command: `npm run build`, output directory: `dist`. Deploy.

**GitHub Pages**
1. `npm run build`.
2. Because the app uses `HashRouter` and a relative `base: './'` in `vite.config.ts`, the contents of `dist/` can be served from any subpath (including `https://<user>.github.io/<repo>/`) with no extra config.
3. Push the `dist/` folder to a `gh-pages` branch (e.g. via the `gh-pages` npm package or GitHub Actions), or use GitHub's "Deploy from a branch" pointed at `dist`.

## 4. How the question generator works

`src/utils/questionGenerator.ts` builds a UCMAS-style vertical arithmetic problem from a level's `LevelConfig`:

1. Picks a random first number (always positive, no leading operation) within `[minNumber, maxNumber]`.
2. For each subsequent step (a random count between `minOperations` and `maxOperations`), picks a random operation from `allowedOperations` and a random value within range.
3. Tracks a running total as it goes. If a level has `negativeIntermediateAllowed: false` (Foundation), subtraction is adjusted so the running total never goes below `minRunningTotal` — this keeps early questions friendly for beginners, matching the paper worksheet's style (e.g. `3 +1 +5 = 9`, `9 -6 +5 = 8`).
4. Higher levels permit deeper negative swings and larger numbers via their own `minRunningTotal`/`minNumber`/`maxNumber`.
5. `generateQuestionSet()` calls this repeatedly, tracking a signature (`numbers + operations`) per question in a `Set` to guarantee no duplicate questions within one exercise, then falls back to allowing repeats only if it can't find enough unique combinations (extremely small ranges).

Every generated question is mathematically verified by construction — the `answer` field is the actual running total, not a separately computed value, so it can never drift out of sync.

## 5. How to modify each level's difficulty

Everything lives in one file: **`src/data/levelConfig.ts`**. Each level is a `LevelConfig` object:

```ts
{
  id: 'level-3',
  minNumber: 1,
  maxNumber: 20,
  minOperations: 5,
  maxOperations: 7,
  allowedOperations: ['+', '-'],
  negativeIntermediateAllowed: true,
  minRunningTotal: -20,
  questionCount: 20,
  defaultTimeLimitSec: 480,
  presentationSpeedMs: 1300,
  difficulty: 'Normal',
  topics: ['1-2 digit addition', '1-2 digit subtraction'],
}
```

Change any field and every page (LevelHome, Practice, Timed Test, Worksheet, etc.) picks it up automatically — nothing else needs to change. To add a brand-new level, add another object to the `LEVELS` array with a unique `id`, `order`, and a Lucide icon name.

## 6. How to add Supabase later

The app never touches `localStorage` directly outside of **`src/utils/storage.ts`**. That file exports a fixed set of functions (`getStudent`, `saveStudent`, `getResults`, `saveResult`, `getProgress`, `getAchievements`, `getSettings`, `saveSettings`, etc.) that every page and hook calls instead.

To move to Supabase:
1. Create a Supabase project and tables mirroring `Student`, `ExerciseResult`, and settings/achievements shapes (see `src/types/`).
2. Re-implement each function in `storage.ts` to call the Supabase client (`supabase.from('results').select()...`) instead of `localStorage`.
3. Keep the same function names and return types — no other file in the app needs to change, since everything already goes through this abstraction.
4. For `ExerciseResult`, you'll likely want `saveResult` to `await` an insert; `useExerciseSession.ts` already calls `saveResult` in a place where making it `async` is a small, contained change.

## 7. Project structure

```
src/
  components/    Reusable UI: Sidebar, Header, cards, Timer, NumericKeypad,
                 QuestionDisplay, WorksheetGrid, Abacus/AbacusBead, ResultSummary, charts
  pages/         Dashboard, LevelHome (mode selection for any level), Practice
                 (handles practice/timed-test/speed-training/random-challenge/
                 mental-arithmetic via one shared runner), Results, History,
                 Settings, Worksheet (generator + printable + online check)
  data/          levelConfig.ts — the single source of truth for all 11 levels
  utils/         questionGenerator.ts, scoring.ts, storage.ts
  hooks/         useExerciseSession.ts — shared timer/scoring/session logic
  types/         exercise.ts, student.ts, progress.ts
```

**Design note on levels:** rather than 11 near-duplicate page files (`Level1.tsx`...`Level10.tsx`), the app uses one dynamic route `/level/:levelId` plus the central `levelConfig.ts`. This avoids the duplicate-code anti-pattern the spec explicitly warns against, while still giving every level (Foundation through Level 10) its own distinct difficulty curve, icon, color, and sidebar entry.

## 8. Feature checklist (all functional, not placeholders)

- Collapsible, responsive sidebar with hamburger menu on mobile
- Dashboard with live stats, SVG line/bar charts (no external chart library — zero extra network dependency), achievements, recent history, "Continue Practice"
- Foundation + 10 numbered levels, each with its own generated difficulty
- Practice, Timed Test, Speed Training, Random Challenge, Mental Arithmetic (sequential number reveal), and Worksheet modes
- Numeric keypad + full keyboard input (0-9, `-`, Backspace, Enter, Escape-to-pause in Practice)
- Accurate countdown timer with pause/resume and auto-submit at zero; session state persisted to `sessionStorage` so an accidental refresh can recover the in-progress question set
- Configurable scoring formula (accuracy weighted above speed) in `scoring.ts`
- Results page with motivational messaging, missed-question review, and three follow-up actions
- Practice history with level/mode/date filtering
- Per-level progress bars and stats
- Achievement badges that unlock based on real stored results
- Functional virtual soroban abacus (tap beads to move them)
- Worksheet generator: question count / time / difficulty controls, printable via `@media print`, plus inline "Check Answers" scoring
- Settings: sound toggles, dark mode, presentation speed, font size, language (English / Khmer scaffold)
- Everything persists via a storage-service abstraction so Supabase can be swapped in without touching UI code
