import { Cast } from "../data/mockCasts";
import { Question } from "../hooks/useGameLogic";
import FlashCard from "./FlashCard";
import ComboEffect from "./ComboEffect";

type Props = {
  question: Question;
  score: number;
  combo: number;
  lives: number;
  totalLives: number;
  timeRatio: number;
  language: "en" | "ja";
  lastResult: "correct" | "wrong" | null;
  onChoose: (cast: Cast) => void;
};

export default function GameScreen({
  question,
  score,
  combo,
  lives,
  totalLives,
  timeRatio,
  language,
  lastResult,
  onChoose,
}: Props) {
  return (
    <div className="flex h-full flex-col items-center justify-between px-3 py-3 sm:px-4 sm:py-4 max-w-md mx-auto">
      <ComboEffect combo={combo} />

      {/* Top Status Bar */}
      <div className="flex w-full items-center justify-between text-sm px-1 shrink-0">
        <div className="font-black text-neonGold text-base sm:text-lg tracking-wider">
          SCORE {score}
        </div>
        {combo > 0 && (
          <div className="text-xs sm:text-sm font-extrabold text-neonPurple animate-pulse">
            COMBO x{combo}
          </div>
        )}
        <div className="flex gap-1">
          {Array.from({ length: totalLives }).map((_, i) => (
            <span key={i} className={i < lives ? "text-neonPink text-lg sm:text-xl" : "text-white/20 text-lg sm:text-xl"}>
              ♥
            </span>
          ))}
        </div>
      </div>

      {/* Main FlashCard Area */}
      <div className="w-full flex-1 flex flex-col justify-center min-h-0 py-1">
        <FlashCard
          question={question}
          timeRatio={timeRatio}
          language={language}
          lastResult={lastResult}
          onChoose={onChoose}
        />
      </div>
    </div>
  );
}
