import { useEffect, useState } from "react";
import { mockCasts, Cast } from "./data/mockCasts";
import { fetchRealCasts } from "./data/fetchCasts";
import { submitScore } from "./data/leaderboardApi";
import { useGameLogic } from "./hooks/useGameLogic";
import { useAudio } from "./hooks/useAudio";
import StartScreen from "./components/StartScreen";
import GameScreen from "./components/GameScreen";
import MissRevealScreen from "./components/MissRevealScreen";
import ResultScreen from "./components/ResultScreen";
import LeaderboardScreen from "./components/LeaderboardScreen";

const BEST_SCORE_KEY = "63flash_best_score";
const NICKNAME_KEY = "63flash_nickname";

export default function App() {
  const [volume, setVolume] = useState(0.6);
  const [bestScore, setBestScore] = useState(() =>
    Number(localStorage.getItem(BEST_SCORE_KEY) ?? 0)
  );
  const [casts, setCasts] = useState<Cast[] | null>(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [nickname, setNickname] = useState(() => localStorage.getItem(NICKNAME_KEY) ?? "");

  useEffect(() => {
    fetchRealCasts()
      .then(setCasts)
      .catch((err) => {
        console.warn("real cast fetch failed, falling back to mock data", err);
        setCasts(mockCasts);
      });
  }, []);

  const {
    phase,
    current,
    score,
    combo,
    maxCombo,
    lives,
    correctCount,
    totalCount,
    timeRatio,
    lastResult,
    missedCast,
    startGame,
    registerAnswer,
    continueFromReveal,
  } = useGameLogic(casts ?? []);

  const { playCorrect, playWrong, playTap } = useAudio(volume);

  useEffect(() => {
    if (phase === "result" && score > bestScore) {
      setBestScore(score);
      localStorage.setItem(BEST_SCORE_KEY, String(score));
    }
  }, [phase, score, bestScore]);

  const handleChoose = (cast: Cast) => {
    if (!current) return;
    playTap();
    const isCorrect = cast.id === current.cast.id;
    if (isCorrect) {
      playCorrect(combo);
    } else {
      playWrong();
    }
    registerAnswer(cast);
  };

  const handleStart = () => {
    playTap();
    startGame();
  };

  const handleSubmitScore = async (nick: string) => {
    setNickname(nick);
    localStorage.setItem(NICKNAME_KEY, nick);
    const { rank } = await submitScore({
      nickname: nick,
      score,
      maxCombo,
      correctCount,
      totalCount,
    });
    return { rank };
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-bgDark">
      {casts === null && (
        <div className="flex h-full items-center justify-center text-white/60">
          Loading casts...
        </div>
      )}

      {casts !== null && phase === "start" && (
        <StartScreen
          bestScore={bestScore}
          volume={volume}
          onVolumeChange={setVolume}
          onStart={handleStart}
          onShowLeaderboard={() => setShowLeaderboard(true)}
        />
      )}

      {phase === "playing" && current && (
        <GameScreen
          question={current}
          score={score}
          combo={combo}
          lives={lives}
          timeRatio={timeRatio}
          lastResult={lastResult}
          onChoose={handleChoose}
        />
      )}

      {phase === "reveal" && missedCast && (
        <MissRevealScreen cast={missedCast} onContinue={continueFromReveal} />
      )}

      {phase === "result" && (
        <ResultScreen
          score={score}
          maxCombo={maxCombo}
          correctCount={correctCount}
          totalCount={totalCount}
          initialNickname={nickname}
          onRetry={handleStart}
          onSubmitScore={handleSubmitScore}
          onShowLeaderboard={() => setShowLeaderboard(true)}
        />
      )}

      {showLeaderboard && <LeaderboardScreen onClose={() => setShowLeaderboard(false)} />}
    </div>
  );
}
