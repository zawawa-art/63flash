import { AnimatePresence, motion } from "framer-motion";
import { Cast } from "../data/mockCasts";
import { Question } from "../hooks/useGameLogic";

type Props = {
  question: Question;
  timeRatio: number;
  lastResult: "correct" | "wrong" | null;
  onChoose: (cast: Cast) => void;
};

export default function FlashCard({ question, timeRatio, lastResult, onChoose }: Props) {
  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-4">
      <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
        <motion.div
          className="h-full bg-gradient-to-r from-neonGold via-neonPink to-neonPurple"
          style={{ width: `${Math.max(0, timeRatio) * 100}%` }}
        />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={question.cast.id}
          initial={{ opacity: 0, scale: 0.9, x: 40 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          exit={{ opacity: 0, scale: 0.9, x: -40 }}
          transition={{ duration: 0.18 }}
          className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl border-2 border-neonPurple/60 shadow-neon"
        >
          <img
            src={question.displayImage}
            alt="cast"
            className="h-full w-full object-cover"
            draggable={false}
          />
          {lastResult && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`absolute inset-0 flex items-center justify-center text-4xl font-black ${
                lastResult === "correct" ? "bg-neonGold/30 text-neonGold" : "bg-red-600/40 text-white"
              }`}
            >
              {lastResult === "correct" ? "CORRECT!" : "MISS"}
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="grid w-full grid-cols-2 gap-3">
        {question.choices.map((c) => (
          <motion.button
            key={c.id}
            whileTap={{ scale: 0.94 }}
            onClick={() => onChoose(c)}
            disabled={!!lastResult}
            className="rounded-xl border border-neonPink/50 bg-black/40 px-3 py-3 text-base font-bold leading-tight text-white backdrop-blur transition hover:bg-neonPink/20 disabled:opacity-60"
          >
            {c.name}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
