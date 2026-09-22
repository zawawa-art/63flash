import { motion } from "framer-motion";

type Props = {
  bestScore: number;
  volume: number;
  onVolumeChange: (v: number) => void;
  onStart: () => void;
  onShowLeaderboard: () => void;
};

export default function StartScreen({
  bestScore,
  volume,
  onVolumeChange,
  onStart,
  onShowLeaderboard,
}: Props) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-8 px-6 text-center">
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-5xl font-black tracking-widest text-neonPink drop-shadow-[0_0_15px_#ff2ee0]"
      >
        63FLASH
      </motion.h1>
      <p className="text-sm text-white/60">キャストの顔を覚えて全問正解を目指せ！</p>

      <div className="text-lg text-neonGold">BEST SCORE: {bestScore}</div>

      <div className="flex w-full max-w-xs items-center gap-3">
        <span className="text-xs text-white/50">VOL</span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={volume}
          onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
          className="w-full accent-neonPurple"
        />
      </div>

      <motion.button
        whileTap={{ scale: 0.92 }}
        whileHover={{ scale: 1.05 }}
        onClick={onStart}
        className="rounded-full bg-gradient-to-r from-neonPink to-neonPurple px-12 py-4 text-2xl font-bold shadow-neon"
      >
        START
      </motion.button>

      <button
        onClick={onShowLeaderboard}
        className="text-sm text-white/50 underline underline-offset-4"
      >
        ランキングを見る
      </button>
    </div>
  );
}
