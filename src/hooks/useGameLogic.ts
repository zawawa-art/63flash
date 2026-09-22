import { useCallback, useEffect, useRef, useState } from "react";
import { Cast } from "../data/mockCasts";
import { preloadImages } from "../utils/preload";

const QUESTION_TIME_MS = 5000;
const TOTAL_LIVES = 3;
const PRELOAD_AHEAD = 3;

export type Question = {
  cast: Cast;
  displayImage: string;
  choices: Cast[];
};

export type GamePhase = "start" | "playing" | "reveal" | "result";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickRandomImage(cast: Cast): string {
  const images = cast.images && cast.images.length > 0 ? cast.images : [cast.image_url];
  return images[Math.floor(Math.random() * images.length)];
}

const RECENT_AVOID_COUNT = 5;

function buildQuestion(casts: Cast[], excludeIds: Set<string>): Question {
  const pool = casts.filter((c) => !excludeIds.has(c.id));
  const candidates = pool.length > 0 ? pool : casts;
  const cast = candidates[Math.floor(Math.random() * candidates.length)];
  const castName = cast.name.trim().toLowerCase();
  // Exclude same-name casts (e.g. same performer under different store
  // profiles) from dummies too — two visually-identical buttons make the
  // correct answer impossible to pick out.
  const dummies = shuffle(
    casts.filter((c) => c.id !== cast.id && c.name.trim().toLowerCase() !== castName)
  ).slice(0, 3);
  const choices = shuffle([cast, ...dummies]);
  return { cast, displayImage: pickRandomImage(cast), choices };
}

export function useGameLogic(casts: Cast[]) {
  const [phase, setPhase] = useState<GamePhase>("start");
  const [queue, setQueue] = useState<Question[]>([]);
  const [current, setCurrent] = useState<Question | null>(null);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [lives, setLives] = useState(TOTAL_LIVES);
  const [correctCount, setCorrectCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME_MS);
  const [lastResult, setLastResult] = useState<"correct" | "wrong" | null>(null);
  const [missedCast, setMissedCast] = useState<Cast | null>(null);

  const timerRef = useRef<number | null>(null);
  const startedAtRef = useRef(0);
  const answeredRef = useRef(false);
  const livesRef = useRef(TOTAL_LIVES);
  const recentIdsRef = useRef<string[]>([]);
  const queueRef = useRef<Question[]>([]);

  const ensureQueue = useCallback(
    (q: Question[]) => {
      if (casts.length === 0) return q;
      const next = [...q];
      while (next.length < PRELOAD_AHEAD + 1) {
        const exclude = new Set([...recentIdsRef.current, ...next.map((qq) => qq.cast.id)]);
        next.push(buildQuestion(casts, exclude));
      }
      return next;
    },
    [casts]
  );

  // Deliberately avoids the functional setState form (setQueue(prev => ...)):
  // React StrictMode double-invokes those updaters in dev, and this logic
  // draws fresh randomness + mutates recentIdsRef each call, so double
  // invocation corrupted recentIdsRef and caused back-to-back repeats.
  const advance = useCallback(() => {
    const next = ensureQueue(queueRef.current);
    const [head, ...rest] = next;
    if (head) {
      recentIdsRef.current = [...recentIdsRef.current, head.cast.id].slice(-RECENT_AVOID_COUNT);
    }
    const filled = ensureQueue(rest);
    queueRef.current = filled;
    setQueue(filled);
    setCurrent(head ?? null);
    preloadImages(filled.slice(0, PRELOAD_AHEAD).map((q) => q.displayImage));
    setTimeLeft(QUESTION_TIME_MS);
    startedAtRef.current = performance.now();
    setLastResult(null);
    answeredRef.current = false;
  }, [ensureQueue]);

  const startGame = useCallback(() => {
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setLives(TOTAL_LIVES);
    livesRef.current = TOTAL_LIVES;
    setCorrectCount(0);
    setTotalCount(0);
    recentIdsRef.current = [];
    queueRef.current = [];
    setPhase("playing");
    setTimeout(() => advance(), 0);
  }, [advance]);

  const revealMiss = useCallback((cast: Cast) => {
    setMissedCast(cast);
    setPhase("reveal");
    if (timerRef.current) cancelAnimationFrame(timerRef.current);
  }, []);

  const continueFromReveal = useCallback(() => {
    setPhase("result");
  }, []);

  const registerAnswer = useCallback(
    (chosen: Cast | null) => {
      if (!current || phase !== "playing" || answeredRef.current) return;
      answeredRef.current = true;
      const isCorrect = chosen?.id === current.cast.id;
      setTotalCount((c) => c + 1);

      const answeredCast = current.cast;
      let isGameOver = false;
      if (isCorrect) {
        setCombo((c) => {
          const next = c + 1;
          setMaxCombo((m) => Math.max(m, next));
          return next;
        });
        setCorrectCount((c) => c + 1);
        setScore((s) => s + 100 * (1 + Math.min(combo, 10) * 0.1));
        setLastResult("correct");
      } else {
        setCombo(0);
        setLastResult("wrong");
        livesRef.current -= 1;
        isGameOver = livesRef.current <= 0;
        setLives(livesRef.current);
      }

      setTimeout(() => {
        if (isGameOver) {
          revealMiss(answeredCast);
        } else {
          advance();
        }
      }, 450);
    },
    [current, phase, combo, advance, revealMiss]
  );

  useEffect(() => {
    if (phase !== "playing" || !current) return;
    let raf: number;
    const tick = () => {
      const elapsed = performance.now() - startedAtRef.current;
      const remaining = Math.max(0, QUESTION_TIME_MS - elapsed);
      setTimeLeft(remaining);
      if (remaining <= 0) {
        registerAnswer(null);
        return;
      }
      raf = requestAnimationFrame(tick);
      timerRef.current = raf;
    };
    raf = requestAnimationFrame(tick);
    timerRef.current = raf;
    return () => cancelAnimationFrame(raf);
  }, [phase, current, registerAnswer]);

  return {
    phase,
    current,
    score: Math.round(score),
    combo,
    maxCombo,
    lives,
    correctCount,
    totalCount,
    timeLeft,
    timeRatio: timeLeft / QUESTION_TIME_MS,
    lastResult,
    missedCast,
    startGame,
    registerAnswer,
    continueFromReveal,
  };
}
