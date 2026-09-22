import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { fetchLeaderboard, LeaderboardEntry } from "../data/leaderboardApi";

type Props = {
  onClose: () => void;
};

export default function LeaderboardScreen({ onClose }: Props) {
  const [state, setState] = useState<
    { status: "loading" } | { status: "loaded"; entries: LeaderboardEntry[] } | { status: "error" }
  >({ status: "loading" });

  useEffect(() => {
    fetchLeaderboard()
      .then((entries) => setState({ status: "loaded", entries }))
      .catch(() => setState({ status: "error" }));
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex flex-col items-center gap-4 bg-bgDark/95 px-6 py-10 text-center"
    >
      <h2 className="text-2xl font-black text-neonGold drop-shadow-[0_0_15px_#ffd23f]">
        RANKING
      </h2>

      <div className="w-full max-w-sm flex-1 overflow-y-auto rounded-xl border border-neonPurple/50 bg-white/5 p-4">
        {state.status === "loading" && <p className="text-white/60">Loading...</p>}
        {state.status === "error" && <p className="text-neonPink">読み込みに失敗しました</p>}
        {state.status === "loaded" && state.entries.length === 0 && (
          <p className="text-white/60">まだ登録がありません</p>
        )}
        {state.status === "loaded" &&
          state.entries.map((e) => (
            <div
              key={e.rank}
              className="flex items-center justify-between gap-2 border-b border-white/10 py-2 text-sm last:border-none"
            >
              <span className="w-8 shrink-0 font-bold text-neonPink">#{e.rank}</span>
              <span className="flex-1 truncate text-left text-white">{e.nickname}</span>
              <span className="font-bold text-neonGold">{e.score}</span>
            </div>
          ))}
      </div>

      <motion.button
        whileTap={{ scale: 0.92 }}
        whileHover={{ scale: 1.05 }}
        onClick={onClose}
        className="rounded-full bg-gradient-to-r from-neonPurple to-neonPink px-10 py-3 text-lg font-bold shadow-neon"
      >
        閉じる
      </motion.button>
    </motion.div>
  );
}
