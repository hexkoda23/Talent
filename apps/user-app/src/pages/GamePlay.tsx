import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CornerUpLeft, Play, RotateCcw, Trophy, X } from "lucide-react";
import { Logo } from "@/components/Logo";
import { cn } from "@/lib/utils";
import { formatGameTime, getGameSettings } from "@/lib/gameSettings";
import { selectionGameApi } from "@/api/endpoints";
import { toErrorMessage } from "@/api/client";

type GameKey = "memory" | "zzle";
type Point = { r: number; c: number };
type ZzleLevel = {
  title: string;
  color: "primary" | "secondary" | "accent";
  path: Point[];
  decoys: Point[];
};

const BOARD_SIZE = 12;

const GamePlay = () => {
  const navigate = useNavigate();
  const settings = getGameSettings();
  const [attemptId, setAttemptId] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [active, setActive] = useState<GameKey>("memory");
  const [scores, setScores] = useState<Record<GameKey, number>>({ memory: 0, zzle: 0 });

  const order: GameKey[] = ["memory", "zzle"];
  const idx = order.indexOf(active);
  const progress = ((idx + 1) / order.length) * 100;

  useEffect(() => {
    selectionGameApi.startAttempt()
      .then((attempt) => setAttemptId(attempt.id))
      .catch((err) => setError(toErrorMessage(err)));
  }, []);

  const onComplete = async (key: GameKey, score: number, meta: Record<string, unknown> = {}) => {
    const nextScores = { ...scores, [key]: score };
    setScores(nextScores);

    if (key === "memory") {
      setActive("zzle");
      return;
    }

    const total = Math.round((nextScores.memory + nextScores.zzle) / 2);
    setSubmitting(true);
    setError("");
    try {
      const attemptPayload: Record<string, unknown> = {
        score: total,
        breakdown: nextScores,
        attempt_data: {
          memory: { score: nextScores.memory, ...(meta.memory || {}) },
          zzle: { score: nextScores.zzle, ...(meta.zzle || {}) },
        },
      };

      const response = await selectionGameApi.completeAttempt(attemptId, attemptPayload);
      navigate("/assessment/result", { state: response });
    } catch (err) {
      setError(toErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background font-mono">
      <header className="px-5 lg:px-10 py-4 flex items-center justify-between border-b border-border">
        <Logo size="sm" />
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
            Game {idx + 1} / 2
          </div>
          <div className="hidden md:flex text-xs text-muted-foreground">
            {attemptId ? `Attempt ${attemptId.slice(0, 8)}` : "Starting attempt..."}
          </div>
          <div className="w-32 sm:w-56 h-px bg-border">
            <div className="h-px bg-primary transition-all" style={{ width: `${progress}%` }} />
          </div>
          <button onClick={() => navigate("/")} className="h-9 w-9 grid place-items-center border border-transparent hover:border-border">
            <X className="h-4 w-4" />
          </button>
        </div>
      </header>

      <main className="flex-1 px-5 py-8 lg:py-10 max-w-5xl w-full mx-auto">
        {error && <p className="mb-4 border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
        {submitting && <p className="mb-4 border border-primary/40 bg-primary/10 p-3 text-sm text-primary">Submitting attempt to backend...</p>}
        {active === "memory" && <MemoryGrid settings={settings} onComplete={(score, meta) => onComplete("memory", score, meta)} />}
        {active === "zzle" && <ZzleGame settings={settings} onComplete={(score, meta) => onComplete("zzle", score, meta)} />}
      </main>
    </div>
  );
};

const memoryProfiles = {
  standard: { rounds: 10, baseLength: 2, revealMs: 500, gapMs: 250, mistakes: Infinity },
  hard: { rounds: 10, baseLength: 3, revealMs: 400, gapMs: 200, mistakes: Infinity },
  boss: { rounds: 10, baseLength: 4, revealMs: 300, gapMs: 150, mistakes: Infinity },
};

const calcMemoryScore = (r: number) => {
  // Each memory round = 10 points, up to 10 rounds => max 100
  return Math.max(0, Math.min(100, r * 10));
};

const MemoryGrid = ({ settings, onComplete }: { settings: ReturnType<typeof getGameSettings>; onComplete: (score: number, meta?: Record<string, unknown>) => void }) => {
  const profile = memoryProfiles[settings.difficulty];
  const [round, setRound] = useState(1);
  const [retryKey, setRetryKey] = useState(0);
  const [sequence, setSequence] = useState<number[]>([]);
  const [showing, setShowing] = useState<number | null>(null);
  const [phase, setPhase] = useState<"show" | "input" | "wrong">("show");
  const [userInput, setUserInput] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [timeLeft, setTimeLeft] = useState(settings.memorySeconds);

  useEffect(() => {
    if (timeLeft <= 0) {
      onComplete(calcMemoryScore(round - 1), { memory: { rounds_completed: Math.max(0, round - 1) } });
      return;
    }

    const timer = window.setTimeout(() => setTimeLeft((seconds) => seconds - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [onComplete, score, timeLeft]);

  useEffect(() => {
    const len = round + profile.baseLength;
    const seq = Array.from({ length: len }, () => Math.floor(Math.random() * 16));
    setSequence(seq);
    setUserInput([]);
    setPhase("show");

    seq.forEach((cell, i) => {
      const stepMs = profile.revealMs + profile.gapMs;
      window.setTimeout(() => setShowing(cell), i * stepMs);
      window.setTimeout(() => setShowing(null), i * stepMs + profile.revealMs);
    });

    const ready = window.setTimeout(() => setPhase("input"), seq.length * (profile.revealMs + profile.gapMs) + 120);
    return () => window.clearTimeout(ready);
  }, [profile.baseLength, profile.gapMs, profile.revealMs, round, retryKey]);

  const tap = (cell: number) => {
    if (phase !== "input") return;

    const next = [...userInput, cell];
    setUserInput(next);

    if (sequence[next.length - 1] !== cell) {
      const nextMistakes = mistakes + 1;
      setMistakes(nextMistakes);
      setPhase("wrong");

      window.setTimeout(() => {
        if (nextMistakes >= profile.mistakes) onComplete(calcMemoryScore(round - 1), { memory: { rounds_completed: Math.max(0, round - 1) } });
        else {
          setRound((r) => Math.max(1, r - 1));
          setRetryKey((k) => k + 1);
        }
      }, 650);
      return;
    }

    if (next.length === sequence.length) {
      const newScore = calcMemoryScore(round);
      setScore(newScore);
      if (round >= profile.rounds) onComplete(100, { memory: { rounds_completed: profile.rounds } });
      else window.setTimeout(() => setRound((value) => value + 1), 550);
    }
  };

  return (
    <div className="animate-fade-up">
      <GameHeader title="Game #1 - Memory" subtitle={`Round ${round} / ${profile.rounds}`} score={score} time={`Time Left: ${formatGameTime(timeLeft)}`} />
      <div className="mt-10 grid grid-cols-4 gap-2 max-w-md mx-auto">
        {Array.from({ length: 16 }).map((_, cell) => {
          const hit = userInput.includes(cell);
          return (
            <button
              key={cell}
              onClick={() => tap(cell)}
              disabled={phase !== "input"}
              className={cn(
                "aspect-square border bg-muted transition-colors",
                showing === cell && "bg-primary border-primary",
                hit && phase === "input" && "bg-secondary/60 border-secondary",
                phase === "input" && "hover:border-primary",
                phase === "wrong" && "border-destructive/60"
              )}
              aria-label={`Memory cell ${cell + 1}`}
            />
          );
        })}
      </div>
      <div className="mt-8 flex items-center justify-center gap-6 text-xs text-muted-foreground">
        <span>Sequence: {sequence.length}</span>
        <span>Mistakes: {mistakes} / {profile.mistakes === Infinity ? "∞" : profile.mistakes}</span>
        <span>{phase === "show" ? "Watch" : phase === "input" ? "Repeat" : "Broken"}</span>
      </div>
    </div>
  );
};

const levels: ZzleLevel[] = [
  {
    title: "Level 1",
    color: "primary",
    path: [
      { r: 8, c: 2 }, { r: 8, c: 3 }, { r: 7, c: 3 }, { r: 7, c: 4 }, { r: 6, c: 4 },
      { r: 6, c: 5 }, { r: 5, c: 5 }, { r: 5, c: 6 }, { r: 4, c: 6 }, { r: 4, c: 7 },
      { r: 3, c: 7 }, { r: 3, c: 8 }, { r: 2, c: 8 }, { r: 2, c: 9 },
    ],
    decoys: [{ r: 6, c: 6 }, { r: 7, c: 5 }, { r: 5, c: 7 }, { r: 3, c: 6 }],
  },
  {
    title: "Level 2",
    color: "secondary",
    path: [
      { r: 2, c: 3 }, { r: 3, c: 3 }, { r: 3, c: 4 }, { r: 4, c: 4 }, { r: 4, c: 5 },
      { r: 5, c: 5 }, { r: 5, c: 6 }, { r: 6, c: 6 }, { r: 6, c: 7 }, { r: 7, c: 7 },
      { r: 8, c: 7 }, { r: 8, c: 6 }, { r: 9, c: 6 }, { r: 9, c: 5 }, { r: 10, c: 5 },
    ],
    decoys: [{ r: 5, c: 7 }, { r: 6, c: 8 }, { r: 7, c: 8 }, { r: 8, c: 5 }, { r: 9, c: 7 }],
  },
  {
    title: "Level 3",
    color: "accent",
    path: [
      { r: 9, c: 2 }, { r: 8, c: 2 }, { r: 8, c: 3 }, { r: 7, c: 3 }, { r: 7, c: 4 },
      { r: 6, c: 4 }, { r: 6, c: 5 }, { r: 5, c: 5 }, { r: 5, c: 6 }, { r: 4, c: 6 },
      { r: 4, c: 7 }, { r: 3, c: 7 }, { r: 3, c: 8 }, { r: 4, c: 8 }, { r: 5, c: 8 },
      { r: 5, c: 9 }, { r: 6, c: 9 }, { r: 7, c: 9 }, { r: 7, c: 10 },
    ],
    decoys: [{ r: 4, c: 5 }, { r: 5, c: 7 }, { r: 6, c: 8 }, { r: 8, c: 9 }, { r: 9, c: 10 }, { r: 6, c: 10 }],
  },
  {
    title: "Level 4",
    color: "primary",
    path: [
      { r: 1, c: 1 }, { r: 1, c: 2 }, { r: 1, c: 3 }, { r: 2, c: 3 }, { r: 3, c: 3 }, { r: 4, c: 3 }, { r: 4, c: 4 }, { r: 5, c: 4 }, { r: 6, c: 4 }, { r: 6, c: 5 }, { r: 7, c: 5 }, { r: 8, c: 5 }, { r: 9, c: 5 }, { r: 9, c: 6 }, { r: 9, c: 7 }, { r: 9, c: 8 }, { r: 9, c: 9 }, { r: 10, c: 9 }
    ],
    decoys: [{ r: 3, c: 4 }, { r: 5, c: 5 }, { r: 7, c: 6 }, { r: 8, c: 9 }],
  },
  {
    title: "Level 5",
    color: "secondary",
    path: [
      { r: 10, c: 2 }, { r: 9, c: 2 }, { r: 8, c: 2 }, { r: 7, c: 2 }, { r: 6, c: 2 }, { r: 5, c: 2 }, { r: 4, c: 2 }, { r: 3, c: 2 }, { r: 2, c: 2 }, { r: 2, c: 3 }, { r: 2, c: 4 }, { r: 2, c: 5 }, { r: 3, c: 5 }, { r: 4, c: 5 }, { r: 5, c: 5 }, { r: 6, c: 5 }, { r: 7, c: 5 }, { r: 8, c: 5 }, { r: 8, c: 6 }, { r: 8, c: 7 }, { r: 8, c: 8 }, { r: 7, c: 8 }, { r: 6, c: 8 }, { r: 5, c: 8 }, { r: 4, c: 8 }, { r: 3, c: 8 }, { r: 2, c: 8 }, { r: 2, c: 9 }
    ],
    decoys: [{ r: 4, c: 3 }, { r: 6, c: 4 }, { r: 7, c: 6 }, { r: 4, c: 7 }],
  },
];

const calcZzleScore = (l: number) => {
  // Each zzle level = 20 points, up to 5 levels => max 100
  return Math.max(0, Math.min(100, l * 20));
};

const zzleProfiles = {
  standard: { visiblePreview: 5, wrongPenalty: 2 },
  hard: { visiblePreview: 2, wrongPenalty: 4 },
  boss: { visiblePreview: 0, wrongPenalty: 6 },
};

const ZzleGame = ({ settings, onComplete }: { settings: ReturnType<typeof getGameSettings>; onComplete: (score: number, meta?: Record<string, unknown>) => void }) => {
  const profile = zzleProfiles[settings.difficulty];
  const [levelIndex, setLevelIndex] = useState(0);
  const [placed, setPlaced] = useState<Point[]>([]);
  const [failures, setFailures] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(settings.zzleSeconds);
  const level = levels[levelIndex];
  const start = level.path[0];
  const end = level.path[level.path.length - 1];

  useEffect(() => setPlaced([]), [levelIndex]);

  useEffect(() => {
    if (timeLeft <= 0) {
      onComplete(calcZzleScore(levelIndex), { zzle: { levels_completed: Math.max(0, levelIndex) } });
      return;
    }

    const timer = window.setTimeout(() => setTimeLeft((seconds) => seconds - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [onComplete, score, timeLeft]);

  const expected = level.path[placed.length];
  const solved = placed.length === level.path.length;

  useEffect(() => {
    if (!solved) return;
    const nextScore = calcZzleScore(levelIndex);
    const timer = window.setTimeout(() => {
      setScore(nextScore);
      if (levelIndex + 1 >= levels.length) onComplete(100, { zzle: { levels_completed: levels.length } });
      else setLevelIndex((value) => value + 1);
    }, 700);

    return () => window.clearTimeout(timer);
  }, [failures, levelIndex, onComplete, profile.wrongPenalty, score, solved]);

  const clickCell = (point: Point) => {
    if (solved) return;

    if (point.r === expected.r && point.c === expected.c) {
      setPlaced((items) => [...items, point]);
      return;
    }

    setFailures((value) => value + 1);
  };

  const undo = () => setPlaced((items) => items.slice(0, -1));
  const reset = () => {
    setPlaced([]);
    setFailures((value) => value + 1);
  };

  const isPlaced = (point: Point) => placed.some((item) => samePoint(item, point));
  const isTarget = (point: Point) => level.path.some((item) => samePoint(item, point));
  const isDecoy = (point: Point) => level.decoys.some((item) => samePoint(item, point));
  const isCandidate = (point: Point) => {
    const anchor = placed[placed.length - 1] ?? start;
    if (isPlaced(point)) return false;
    const distance = Math.abs(point.r - anchor.r) + Math.abs(point.c - anchor.c);
    return distance === 1;
  };
  const tone = toneClass(level.color);

  return (
    <div className="animate-fade-up">
      <GameHeader title="Game #2 - Zzle" subtitle={`${level.title} / 5`} score={score} time={`Time Left: ${formatGameTime(timeLeft)}`} />

      <div className="mt-8 flex flex-col lg:flex-row items-center justify-center gap-5">
        <div>
          <div className="mb-4 text-center text-2xl text-muted-foreground">{level.title}</div>
          <div className="grid border border-border bg-muted/80" style={{ gridTemplateColumns: `repeat(${BOARD_SIZE}, minmax(0, 1fr))` }}>
            {Array.from({ length: BOARD_SIZE * BOARD_SIZE }).map((_, index) => {
              const point = { r: Math.floor(index / BOARD_SIZE), c: index % BOARD_SIZE };
              const target = isTarget(point);
              const decoy = isDecoy(point);
              const placedCell = isPlaced(point);
              const startCell = samePoint(point, start);
              const endCell = samePoint(point, end);
              const candidate = isCandidate(point);
              const previewCell = !placedCell && level.path
                .slice(0, Math.min(level.path.length, placed.length + profile.visiblePreview))
                .some((item) => samePoint(item, point));

              return (
                <button
                  key={`${point.r}-${point.c}`}
                  onClick={() => clickCell(point)}
                  className={cn(
                    "h-8 w-8 sm:h-10 sm:w-10 border border-background bg-muted text-xs transition-colors",
                    target && "bg-card",
                    candidate && "border-foreground/60",
                    previewCell && tone.faint,
                    decoy && "bg-secondary/25",
                    placedCell && tone.solid,
                    startCell && "text-foreground",
                    endCell && "text-foreground"
                  )}
                  aria-label={`Zzle row ${point.r + 1} column ${point.c + 1}`}
                >
                  {startCell ? "*" : endCell ? "◇" : ""}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex lg:flex-col gap-3">
          <button className="h-14 w-14 border border-border grid place-items-center hover:border-primary" onClick={() => solved ? undefined : setFailures((value) => value + 1)} aria-label="Validate route">
            <Play className="h-7 w-7 fill-foreground" />
          </button>
          <button className="h-14 w-14 border border-transparent grid place-items-center hover:border-border" onClick={undo} aria-label="Undo">
            <CornerUpLeft className="h-7 w-7" />
          </button>
          <button className="h-14 w-14 border border-transparent grid place-items-center hover:border-border" onClick={reset} aria-label="Reset">
            <RotateCcw className="h-7 w-7" />
          </button>
          <button className="h-14 w-14 border border-transparent grid place-items-center hover:border-border" onClick={() => setFailures((value) => value + 1)} aria-label="Mark wrong">
            <X className="h-7 w-7" />
          </button>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-center gap-3 text-xs text-muted-foreground">
        <span>Tiles: {placed.length} / {level.path.length}</span>
        <span>Faults: {failures}</span>
        <span>{profile.visiblePreview ? "Only the next path hints are dimmed" : "Boss mode: no path preview"}</span>
      </div>
    </div>
  );
};

const GameHeader = ({ title, subtitle, score, time }: { title: string; subtitle: string; score: number; time: string }) => (
  <div className="max-w-3xl mx-auto">
    <div className="text-center text-sm text-foreground">{time}</div>
    <div className="mt-4 h-px bg-border">
      <div className="h-px w-2/5 bg-foreground" />
    </div>
    <div className="mt-5 flex items-center justify-between gap-4">
      <div>
        <p className="text-3xl text-muted-foreground">{subtitle}</p>
        <h1 className="mt-2 text-4xl lg:text-6xl">{title}</h1>
      </div>
      <div className="hidden sm:flex items-center gap-2 border border-border bg-muted px-3 h-10 text-sm">
        <Trophy className="h-4 w-4 text-warning" />
        <span>{score}</span>
      </div>
    </div>
  </div>
);

const samePoint = (a: Point, b: Point) => a.r === b.r && a.c === b.c;

const toneClass = (color: ZzleLevel["color"]) => {
  const tones = {
    primary: { faint: "bg-primary/20", solid: "bg-primary text-primary-foreground" },
    secondary: { faint: "bg-secondary/20", solid: "bg-secondary text-secondary-foreground" },
    accent: { faint: "bg-accent/20", solid: "bg-accent text-accent-foreground" },
  };

  return tones[color];
};

export default GamePlay;
