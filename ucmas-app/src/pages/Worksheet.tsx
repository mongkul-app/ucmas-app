import { useMemo, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { Printer, CheckCircle2, RefreshCw } from 'lucide-react';
import { LEVELS, getLevelConfig, type LevelConfig } from '../data/levelConfig';
import { generateQuestionSet } from '../utils/questionGenerator';
import { calculateAccuracy, calculateScore } from '../utils/scoring';
import { getStudent, saveResult } from '../utils/storage';
import WorksheetGrid from '../components/WorksheetGrid';
import type { Question } from '../types/exercise';

const QUESTION_COUNT_OPTIONS = [10, 20, 50, 100];
const TIME_OPTIONS = [5, 8, 10, 15];
const DIFFICULTY_OPTIONS: Array<'Easy' | 'Normal' | 'Hard'> = ['Easy', 'Normal', 'Hard'];

function applyDifficulty(config: LevelConfig, difficulty: 'Easy' | 'Normal' | 'Hard'): LevelConfig {
  const multiplier = difficulty === 'Easy' ? 0.7 : difficulty === 'Hard' ? 1.4 : 1;
  return {
    ...config,
    maxNumber: Math.max(config.minNumber + 1, Math.round(config.maxNumber * multiplier)),
    maxOperations: Math.max(config.minOperations, Math.round(config.maxOperations * multiplier)),
  };
}

export default function Worksheet() {
  const { levelId } = useParams();
  const isValidLevel = !!levelId && LEVELS.some((l) => l.id === levelId);
  const safeLevelId = isValidLevel ? (levelId as string) : LEVELS[0].id;
  const baseConfig = getLevelConfig(safeLevelId);

  const [questionCount, setQuestionCount] = useState(20);
  const [timeMinutes, setTimeMinutes] = useState(8);
  const [difficulty, setDifficulty] = useState<'Easy' | 'Normal' | 'Hard'>('Normal');
  const [questions, setQuestions] = useState<Question[]>(() =>
    generateQuestionSet(applyDifficulty(baseConfig, 'Normal'), 20)
  );
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState(false);

  const effectiveConfig = useMemo(() => applyDifficulty(baseConfig, difficulty), [baseConfig, difficulty]);

  const regenerate = () => {
    setQuestions(generateQuestionSet(effectiveConfig, questionCount));
    setAnswers({});
    setChecked(false);
  };

  const summary = useMemo(() => {
    if (!checked) return null;
    let correct = 0;
    let answered = 0;
    questions.forEach((q) => {
      const raw = answers[q.id];
      if (raw !== undefined && raw !== '' && raw !== '-') {
        answered += 1;
        if (parseInt(raw, 10) === q.answer) correct += 1;
      }
    });
    const wrong = answered - correct;
    const unanswered = questions.length - answered;
    const accuracy = calculateAccuracy(correct, questions.length);
    const score = calculateScore({
      correct,
      wrong,
      unanswered,
      totalQuestions: questions.length,
      timeUsedSec: timeMinutes * 60,
      timeLimitSec: timeMinutes * 60,
    });
    return { correct, wrong, unanswered, accuracy, score };
  }, [checked, questions, answers, timeMinutes]);

  const handleCheck = () => {
    setChecked(true);
    let correct = 0;
    let answered = 0;
    questions.forEach((q) => {
      const raw = answers[q.id];
      if (raw !== undefined && raw !== '' && raw !== '-') {
        answered += 1;
        if (parseInt(raw, 10) === q.answer) correct += 1;
      }
    });
    const wrong = answered - correct;
    const unanswered = questions.length - answered;
    const accuracy = calculateAccuracy(correct, questions.length);
    const score = calculateScore({
      correct,
      wrong,
      unanswered,
      totalQuestions: questions.length,
      timeUsedSec: timeMinutes * 60,
      timeLimitSec: timeMinutes * 60,
    });
    const student = getStudent();
    saveResult({
      id: `result_${Date.now()}`,
      studentId: student.id,
      level: baseConfig.id,
      mode: 'worksheet',
      totalQuestions: questions.length,
      correct,
      wrong,
      unanswered,
      accuracy,
      score,
      timeUsed: timeMinutes * 60,
      completedAt: new Date().toISOString(),
      difficulty,
    });
  };

  if (!isValidLevel) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="space-y-5">
      <div className="no-print flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">{baseConfig.name} Worksheet</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Generate a printable UCMAS-style worksheet.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => window.print()} className="btn-secondary">
            <Printer size={16} />
            Print Worksheet
          </button>
        </div>
      </div>

      <div className="no-print card p-5 grid sm:grid-cols-3 gap-4">
        <SelectGroup label="Number of Questions" value={questionCount} options={QUESTION_COUNT_OPTIONS} onChange={setQuestionCount} />
        <SelectGroup label="Time (minutes)" value={timeMinutes} options={TIME_OPTIONS} onChange={setTimeMinutes} />
        <div>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Difficulty</p>
          <div className="flex gap-1.5">
            {DIFFICULTY_OPTIONS.map((d) => (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                className={`flex-1 rounded-lg px-2 py-2 text-xs font-semibold border-2 ${
                  difficulty === d ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-slate-200 dark:border-navy-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
        <div className="sm:col-span-3">
          <button onClick={regenerate} className="btn-primary">
            <RefreshCw size={16} />
            Generate Worksheet
          </button>
        </div>
      </div>

      <div id="print-area" className="card p-6 sm:p-8">
        <div className="text-center border-b-2 border-slate-800 pb-3 mb-6">
          <p className="text-xs font-bold tracking-widest text-slate-500">CATEGORY: {baseConfig.name.toUpperCase()}</p>
          <h2 className="text-2xl font-extrabold text-slate-900 mt-1">ABACUS &middot; MENTAL ARITHMETIC</h2>
          <p className="text-sm font-semibold text-slate-600 mt-1">Addition / Subtraction</p>
          <p className="text-sm font-semibold text-slate-600">Time Limit: {timeMinutes} Minutes</p>
          <div className="no-print text-xs text-slate-400 mt-1">Name: _______________________ &nbsp; Date: _______________</div>
        </div>

        <WorksheetGrid questions={questions} answers={answers} onAnswerChange={(id, v) => setAnswers((a) => ({ ...a, [id]: v }))} />
      </div>

      <div className="no-print flex flex-col sm:flex-row items-center justify-between gap-4">
        <button onClick={handleCheck} className="btn-primary">
          <CheckCircle2 size={16} />
          Check Answers
        </button>
        {summary && (
          <div className="flex items-center gap-4 text-sm font-semibold">
            <span>Correct: <span className="text-emerald-600">{summary.correct}</span></span>
            <span>Wrong: <span className="text-rose-600">{summary.wrong}</span></span>
            <span>Accuracy: {summary.accuracy}%</span>
            <span>Score: {summary.score}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function SelectGroup({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: number;
  options: number[];
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">{label}</p>
      <div className="flex gap-1.5">
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            className={`flex-1 rounded-lg px-2 py-2 text-xs font-semibold border-2 ${
              value === opt ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-slate-200 dark:border-navy-700 text-slate-600 dark:text-slate-300'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}
