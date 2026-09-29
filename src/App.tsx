import { useEffect, useMemo, useState } from "react";
import { mockCasts, Cast, StoreId } from "./data/mockCasts";
import { fetchRealCasts } from "./data/fetchCasts";
import { submitScore, Difficulty } from "./data/leaderboardApi";
import { useGameLogic } from "./hooks/useGameLogic";
import { useAudio, BgmTrack, getRandomTrack } from "./hooks/useAudio";
import StartScreen from "./components/StartScreen";
import GameScreen from "./components/GameScreen";
import MissRevealScreen from "./components/MissRevealScreen";
import ResultScreen from "./components/ResultScreen";
import LeaderboardScreen from "./components/LeaderboardScreen";

const ALL_STORES: StoreId[] = ["rokusan_angel", "super_spark", "party_on", "churasun6"];
const NICKNAME_KEY = "63flash_nickname";
const LANG_KEY = "63flash_lang";
const BGM_KEY = "63flash_bgm";
const BGM_TRACK_KEY = "63flash_bgm_track";
const BGM_RANDOM_KEY = "63flash_bgm_random";
const DIFF_KEY = "63flash_diff";
const STORES_KEY = "63flash_stores";

function getBestScoreKey(storeScope: string, difficulty: Difficulty): string {
  return `63flash_best_score_${storeScope}_${difficulty}`;
}

export default function App() {
  const [volume, setVolume] = useState(0.6);
  const [bgmEnabled, setBgmEnabled] = useState(() => localStorage.getItem(BGM_KEY) !== "false");
  const [isRandomBgm, setIsRandomBgm] = useState(() => localStorage.getItem(BGM_RANDOM_KEY) !== "false");
  const [bgmTrack, setBgmTrack] = useState<BgmTrack>(() => {
    const saved = localStorage.getItem(BGM_TRACK_KEY);
    const validTracks = ["tropical", "arcade", "cyber", "tokyo_night", "spark_hyper", "neon_funk", "okinawa_wave"];
    return validTracks.includes(saved ?? "") ? (saved as BgmTrack) : "cyber";
  });
  const [difficulty, setDifficulty] = useState<Difficulty>(() => {
    const saved = localStorage.getItem(DIFF_KEY);
    return saved === "easy" || saved === "normal" ? saved : "normal";
  });
  const [language, setLanguage] = useState<"en" | "ja">(() => {
    const saved = localStorage.getItem(LANG_KEY);
    return saved === "en" || saved === "ja" ? saved : "ja";
  });
  const [selectedStore, setSelectedStore] = useState<"all" | StoreId>(() => {
    const saved = localStorage.getItem(STORES_KEY);
    if (saved && (saved === "all" || ALL_STORES.includes(saved as StoreId))) {
      return saved as "all" | StoreId;
    }
    return "all";
  });

  const [casts, setCasts] = useState<Cast[] | null>(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [nickname, setNickname] = useState(() => localStorage.getItem(NICKNAME_KEY) ?? "");
  const [isNewRecord, setIsNewRecord] = useState(false);

  const currentStoreScope = selectedStore;
  const bestScoreKey = getBestScoreKey(currentStoreScope, difficulty);
  const [bestScore, setBestScore] = useState(() =>
    Number(localStorage.getItem(bestScoreKey) ?? 0)
  );

  // Re-read best score when store scope or difficulty changes
  useEffect(() => {
    const saved = Number(localStorage.getItem(bestScoreKey) ?? 0);
    setBestScore(saved);
  }, [bestScoreKey]);

  useEffect(() => {
    fetchRealCasts()
      .then(setCasts)
      .catch((err) => {
        console.warn("real cast fetch failed, falling back to mock data", err);
        setCasts(mockCasts);
      });
  }, []);

  // Filter casts by selected store ("all" or specific store)
  const filteredCasts = useMemo(() => {
    if (!casts) return [];
    if (selectedStore === "all") return casts;
    const filtered = casts.filter((c) => c.store === selectedStore);
    return filtered.length > 0 ? filtered : casts;
  }, [casts, selectedStore]);

  const {
    phase,
    current,
    score,
    combo,
    maxCombo,
    lives,
    totalLives,
    correctCount,
    totalCount,
    timeRatio,
    lastResult,
    missedCast,
    startGame,
    registerAnswer,
    continueFromReveal,
    goToStart,
  } = useGameLogic(filteredCasts, difficulty);

  const { playCorrect, playWrong, playTap, initAudio, resetBgmPosition } = useAudio(
    volume,
    bgmEnabled,
    bgmTrack,
    score,
    combo
  );

  useEffect(() => {
    if (phase === "result" && score > bestScore) {
      setBestScore(score);
      localStorage.setItem(bestScoreKey, String(score));
      setIsNewRecord(true);
    }
  }, [phase, score, bestScore, bestScoreKey]);

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
    initAudio();
    playTap();
    if (isRandomBgm) {
      setBgmTrack(getRandomTrack());
    }
    resetBgmPosition();
    setIsNewRecord(false);
    startGame();
  };

  const handleToggleBgm = () => {
    initAudio();
    setBgmEnabled((prev) => {
      const next = !prev;
      localStorage.setItem(BGM_KEY, String(next));
      return next;
    });
  };

  const handleChangeBgmTrack = (track: BgmTrack) => {
    initAudio();
    setBgmTrack(track);
    setIsRandomBgm(false);
    localStorage.setItem(BGM_TRACK_KEY, track);
    localStorage.setItem(BGM_RANDOM_KEY, "false");
  };

  const handleToggleRandomBgm = () => {
    initAudio();
    setIsRandomBgm((prev) => {
      const next = !prev;
      localStorage.setItem(BGM_RANDOM_KEY, String(next));
      if (next) {
        setBgmTrack(getRandomTrack());
      }
      return next;
    });
  };

  const handleDifficultyChange = (diff: Difficulty) => {
    setDifficulty(diff);
    localStorage.setItem(DIFF_KEY, diff);
  };

  const handleLanguageChange = (lang: "en" | "ja") => {
    setLanguage(lang);
    localStorage.setItem(LANG_KEY, lang);
  };

  const handleSelectStore = (store: "all" | StoreId) => {
    setSelectedStore(store);
    localStorage.setItem(STORES_KEY, store);
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
      store: currentStoreScope,
      difficulty,
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
          bgmEnabled={bgmEnabled}
          bgmTrack={bgmTrack}
          difficulty={difficulty}
          selectedStore={selectedStore}
          language={language}
          isRandomBgm={isRandomBgm}
          onVolumeChange={setVolume}
          onToggleBgm={handleToggleBgm}
          onChangeBgmTrack={handleChangeBgmTrack}
          onToggleRandomBgm={handleToggleRandomBgm}
          onDifficultyChange={handleDifficultyChange}
          onSelectStore={handleSelectStore}
          onLanguageChange={handleLanguageChange}
          onStart={handleStart}
          onShowLeaderboard={() => setShowLeaderboard(true)}
          castCount={filteredCasts.length}
        />
      )}

      {phase === "playing" && current && (
        <GameScreen
          question={current}
          score={score}
          combo={combo}
          lives={lives}
          totalLives={totalLives}
          timeRatio={timeRatio}
          language={language}
          lastResult={lastResult}
          onChoose={handleChoose}
        />
      )}

      {phase === "reveal" && missedCast && (
        <MissRevealScreen
          cast={missedCast}
          language={language}
          onContinue={continueFromReveal}
        />
      )}

      {phase === "result" && (
        <ResultScreen
          score={score}
          bestScore={bestScore}
          isNewRecord={isNewRecord}
          maxCombo={maxCombo}
          correctCount={correctCount}
          totalCount={totalCount}
          difficulty={difficulty}
          storeScope={currentStoreScope}
          language={language}
          initialNickname={nickname}
          onRetry={handleStart}
          onGoToStart={goToStart}
          onSubmitScore={handleSubmitScore}
          onShowLeaderboard={() => setShowLeaderboard(true)}
        />
      )}

      {showLeaderboard && (
        <LeaderboardScreen
          initialStore={currentStoreScope}
          initialDifficulty={difficulty}
          language={language}
          onClose={() => setShowLeaderboard(false)}
        />
      )}
    </div>
  );
}
