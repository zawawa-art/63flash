import { useCallback, useEffect, useRef, useState } from "react";
import { Cast } from "../data/mockCasts";
import { preloadImages } from "../utils/preload";

export type Difficulty = "easy" | "normal";

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

function pickRandomImage(cast: Cast, lastImage?: string): string {
  const images = cast.images && cast.images.length > 0 ? cast.images : [cast.image_url];
  if (images.length === 1) return images[0];
  const pool = lastImage ? images.filter((img) => img !== lastImage) : images;
  const candidates = pool.length > 0 ? pool : images;
  return candidates[Math.floor(Math.random() * candidates.length)];
}

function pickImageFromDeck(cast: Cast, deck: string[], lastImage?: string): string {
  const images = cast.images && cast.images.length > 0 ? cast.images : [cast.image_url];
  if (deck.length === 0) {
    const fresh = shuffle(images);
    // pop()で最初に出る末尾が前周の最後と重ならないようにする
    if (lastImage && fresh.length > 1 && fresh[fresh.length - 1] === lastImage) {
      [fresh[0], fresh[fresh.length - 1]] = [fresh[fresh.length - 1], fresh[0]];
    }
    deck.push(...fresh);
  }
  return deck.pop() ?? images[0];
}

function buildQuestion(
  casts: Cast[],
  excludeIds: Set<string>,
  difficulty: Difficulty,
  lastImageMap?: Map<string, string>,
  fixedCast?: Cast,
  imageDeck?: string[]
): Question {
  const pool = casts.filter((c) => !excludeIds.has(c.id));
  const candidates = pool.length > 0 ? pool : casts;
  const cast = fixedCast ?? candidates[Math.floor(Math.random() * candidates.length)];
  const castName = cast.name.trim().toLowerCase();

  // Exclude same-name casts from dummies
  const dummyPool = shuffle(
    casts.filter((c) => c.id !== cast.id && c.name.trim().toLowerCase() !== castName)
  );

  const numChoices = fixedCast ? 4 : difficulty === "easy" ? 2 : 4;
  const dummyCount = numChoices - 1;
  const dummies = dummyPool.slice(0, dummyCount);
  const choices = shuffle([cast, ...dummies]);
  const lastImg = lastImageMap?.get(cast.id);
  const displayImage = imageDeck
    ? pickImageFromDeck(cast, imageDeck, lastImg)
    : pickRandomImage(cast, lastImg);
  if (lastImageMap) lastImageMap.set(cast.id, displayImage);
  return { cast, displayImage, choices };
}

export function useGameLogic(casts: Cast[], difficulty: Difficulty = "normal", fixedCast?: Cast) {
  const [phase, setPhase] = useState<GamePhase>("start");
  const [queue, setQueue] = useState<Question[]>([]);
  const [current, setCurrent] = useState<Question | null>(null);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);

  const totalLives = difficulty === "easy" ? 5 : 3;
  const questionTimeMs = difficulty === "easy" ? 8000 : 5000;
  const preloadAhead = 3;

  const [lives, setLives] = useState(totalLives);
  const [correctCount, setCorrectCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(questionTimeMs);
  const [lastResult, setLastResult] = useState<"correct" | "wrong" | null>(null);
  const [missedCast, setMissedCast] = useState<Cast | null>(null);

  const timerRef = useRef<number | null>(null);
  const startedAtRef = useRef(0);
  const answeredRef = useRef(false);
  const livesRef = useRef(totalLives);
  const recentIdsRef = useRef<string[]>([]);
  const queueRef = useRef<Question[]>([]);
  const lastImageMapRef = useRef<Map<string, string>>(new Map());
  const fixedImageDeckRef = useRef<string[]>([]);
  const fixedImageDeckOwnerRef = useRef<string>();
  const difficultyRef = useRef(difficulty);
  difficultyRef.current = difficulty;

  const ensureQueue = useCallback(
    (q: Question[]) => {
      if (casts.length === 0) return q;
      const next = [...q];
      // Adaptively scale recent avoid count so small pools (e.g. single store) still work
      const avoidLimit = Math.max(1, Math.min(Math.floor(casts.length * 0.4), 15));
      while (next.length < preloadAhead + 1) {
        const recentSubset = recentIdsRef.current.slice(-avoidLimit);
        const exclude = new Set([...recentSubset, ...next.map((qq) => qq.cast.id)]);
        next.push(
          buildQuestion(
            casts,
            exclude,
            difficultyRef.current,
            lastImageMapRef.current,
            fixedCast,
            fixedCast ? fixedImageDeckRef.current : undefined
          )
        );
      }
      return next;
    },
    [casts, fixedCast]
  );

  const advance = useCallback(() => {
    const next = ensureQueue(queueRef.current);
    const [head, ...rest] = next;
    if (head) {
      const avoidLimit = Math.max(1, Math.min(Math.floor(casts.length * 0.4), 15));
      recentIdsRef.current = [...recentIdsRef.current, head.cast.id].slice(-avoidLimit);
    }
    const filled = ensureQueue(rest);
    queueRef.current = filled;
    setQueue(filled);
    setCurrent(head ?? null);
    preloadImages(filled.slice(0, preloadAhead).map((q) => q.displayImage));
    setTimeLeft(questionTimeMs);
    startedAtRef.current = performance.now();
    setLastResult(null);
    answeredRef.current = false;
  }, [ensureQueue, questionTimeMs]);

  const startGame = useCallback(() => {
    const livesCount = difficulty === "easy" ? 5 : 3;
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setLives(livesCount);
    livesRef.current = livesCount;
    setCorrectCount(0);
    setTotalCount(0);
    recentIdsRef.current = [];
    // SPECIALは再挑戦をまたいで先読みキューと山札を引き継ぎ、
    // 全写真が一巡する前に同じ写真が再登場しないようにする。
    // 通常モードは従来どおりゲーム開始ごとに抽選状態をリセットする。
    const isSameSpecial =
      fixedCast !== undefined && fixedImageDeckOwnerRef.current === fixedCast.id;
    if (!isSameSpecial) {
      queueRef.current = [];
      lastImageMapRef.current.clear();
      fixedImageDeckRef.current = [];
    }
    fixedImageDeckOwnerRef.current = fixedCast?.id;
    setPhase("playing");
    setTimeout(() => advance(), 0);
  }, [advance, difficulty, fixedCast]);

  const revealMiss = useCallback((cast: Cast) => {
    setMissedCast(cast);
    setPhase("reveal");
    if (timerRef.current) cancelAnimationFrame(timerRef.current);
  }, []);

  const continueFromReveal = useCallback(() => {
    setPhase("result");
  }, []);

  const goToStart = useCallback(() => {
    if (timerRef.current) cancelAnimationFrame(timerRef.current);
    setPhase("start");
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
        const basePoint = difficulty === "easy" ? 60 : 100;
        setScore((s) => s + basePoint * (1 + Math.min(combo, 10) * 0.1));
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
    [current, phase, combo, advance, revealMiss, difficulty]
  );

  useEffect(() => {
    if (phase !== "playing" || !current) return;
    let raf: number;
    const tick = () => {
      const elapsed = performance.now() - startedAtRef.current;
      const remaining = Math.max(0, questionTimeMs - elapsed);
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
  }, [phase, current, registerAnswer, questionTimeMs]);

  return {
    phase,
    current,
    score: Math.round(score),
    combo,
    maxCombo,
    lives,
    totalLives,
    correctCount,
    totalCount,
    timeLeft,
    timeRatio: timeLeft / questionTimeMs,
    lastResult,
    missedCast,
    startGame,
    registerAnswer,
    continueFromReveal,
    goToStart,
  };
}
