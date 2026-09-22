import { Cast } from "../data/mockCasts";
import { Question } from "../hooks/useGameLogic";
import FlashCard from "./FlashCard";
import ComboEffect from "./ComboEffect";

type Props = {
  question: Question;
  score: number;
  combo: number;
  lives: number;
  timeRatio: number;
  lastResult: "correct" | "wrong" | null;
  onChoose: (cast: Cast) => void;
};

export default function GameScreen({
  question,
  score,
  combo,
  lives,
  timeRatio,
  lastResult,
  onChoose,
}: Props) {
  return (
    <div className="flex h-full flex-col items-center gap-6 px-4 pt-6">
      <ComboEffect combo={combo} />

      <div className="flex w-full max-w-sm items-center justify-between text-sm">
        <div className="font-bold text-neonGold">SCORE {score}</div>
        <div className="flex gap-1">
          {Array.from({ length: 3 }).map((_, i) => (
            <span key={i} className={i < lives ? "text-neonPink" : "text-white/20"}>
              ♥
            </span>
          ))}
        </div>
      </div>

      {combo > 0 && (
        <div className="text-xs font-semibold text-neonPurple">COMBO x{combo}</div>
      )}

      <FlashCard
        question={question}
        timeRatio={timeRatio}
        lastResult={lastResult}
        onChoose={onChoose}
      />
    </div>
  );
}
