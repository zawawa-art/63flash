import { AnimatePresence, motion } from "framer-motion";
import { Cast } from "../data/mockCasts";
import { Question } from "../hooks/useGameLogic";
import { getCastDisplayName } from "../data/nameDictionary";

type Props = {
  question: Question;
  timeRatio: number;
  language: "en" | "ja";
  lastResult: "correct" | "wrong" | null;
  onChoose: (cast: Cast) => void;
};

export default function FlashCard({ question, timeRatio, language, lastResult, onChoose }: Props) {
  const isTwoChoices = question.choices.length === 2;

  // 利用可能なヒント候補を収集し、問題ごとに1つ選出
  const availableHints: { text: string; color: string }[] = [];
  if (question.cast.catchphrase) {
    availableHints.push({
      text: `💬 ${question.cast.catchphrase}`,
      color: "border-cyan-400/60 bg-black/75 text-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.4)]",
    });
  }
  if (question.cast.birthplace) {
    availableHints.push({
      text: `📍 ${language === "ja" ? "出身: " : "From: "}${question.cast.birthplace}`,
      color: "border-neonGold/60 bg-black/75 text-neonGold shadow-[0_0_12px_rgba(255,210,63,0.4)]",
    });
  }
  if (question.cast.birthday) {
    availableHints.push({
      text: `🎂 ${question.cast.birthday.replace("-", "/")}`,
      color: "border-neonPink/60 bg-black/75 text-neonPink shadow-[0_0_12px_rgba(255,46,224,0.4)]",
    });
  }
  if (question.cast.height) {
    availableHints.push({
      text: `📏 ${question.cast.height}`,
      color: "border-purple-400/60 bg-black/75 text-purple-200 shadow-[0_0_12px_rgba(180,70,255,0.4)]",
    });
  }

  // cast.idと選択肢から安定して1つのヒントを決定
  const selectedHint =
    availableHints.length > 0
      ? availableHints[question.cast.name.charCodeAt(0) % availableHints.length]
      : null;

  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-3">
      {/* Timer Bar */}
      <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
        <motion.div
          className="h-full bg-gradient-to-r from-neonGold via-neonPink to-neonPurple"
          style={{ width: `${Math.max(0, timeRatio) * 100}%` }}
        />
      </div>

      {/* Cast Photo Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={question.displayImage}
          initial={{ opacity: 0, scale: 0.9, x: 40 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          exit={{ opacity: 0, scale: 0.9, x: -40 }}
          transition={{ duration: 0.18 }}
          className="relative aspect-[2/3] w-full max-h-[52vh] overflow-hidden rounded-2xl border-2 border-neonPurple/60 shadow-neon bg-black/40"
        >
          <img
            src={question.displayImage}
            alt="cast"
            className="h-full w-full object-cover object-top"
            draggable={false}
          />

          {/* Single Big Hint Overlay on Bottom-Right */}
          {selectedHint && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="absolute bottom-3 right-3 max-w-[85%] pointer-events-none z-10"
            >
              <div
                className={`rounded-xl border px-3.5 py-1.5 text-sm sm:text-base font-black tracking-wide backdrop-blur-md truncate ${selectedHint.color}`}
              >
                {selectedHint.text}
              </div>
            </motion.div>
          )}

          {lastResult && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`absolute inset-0 flex items-center justify-center text-4xl font-black z-10 ${
                lastResult === "correct" ? "bg-neonGold/30 text-neonGold" : "bg-red-600/40 text-white"
              }`}
            >
              {lastResult === "correct" ? "CORRECT!" : "MISS"}
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Choices Grid */}
      <div className={`grid w-full gap-2.5 ${isTwoChoices ? "grid-cols-2" : "grid-cols-2"}`}>
        {question.choices.map((c) => {
          const displayName = getCastDisplayName(c, language);
          return (
            <motion.button
              key={c.id}
              whileTap={{ scale: 0.94 }}
              onClick={() => onChoose(c)}
              disabled={!!lastResult}
              className={`rounded-xl border border-neonPink/50 bg-black/50 px-3 ${
                isTwoChoices ? "py-4 text-lg" : "py-3 text-base"
              } font-bold leading-tight text-white backdrop-blur transition hover:bg-neonPink/25 disabled:opacity-60`}
            >
              <span className="truncate block">{displayName}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
