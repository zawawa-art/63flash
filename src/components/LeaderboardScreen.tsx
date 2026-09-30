import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { fetchLeaderboard, LeaderboardEntry, Difficulty } from "../data/leaderboardApi";
import { GameScope, StoreId } from "../data/mockCasts";
import { STORE_DISPLAY_NAMES } from "../data/fetchCasts";

type Props = {
  initialStore?: GameScope;
  initialDifficulty?: Difficulty;
  language: "en" | "ja";
  onClose: () => void;
};

const STORES: Array<{ id: GameScope; labelEn: string; labelJa: string }> = [
  { id: "special_ichigo", labelEn: "🍓 SPECIAL", labelJa: "🍓 SPECIAL" },
  { id: "all", labelEn: "ALL", labelJa: "全店舗" },
  { id: "rokusan_angel", labelEn: "ROKUSAN", labelJa: "ROKUSAN" },
  { id: "super_spark", labelEn: "S.SPARK", labelJa: "SPARK" },
  { id: "party_on", labelEn: "PARTY ON", labelJa: "パリオン" },
  { id: "churasun6", labelEn: "CHURA6", labelJa: "ちゅらさん" },
];

export default function LeaderboardScreen({
  initialStore = "all",
  initialDifficulty = "normal",
  language,
  onClose,
}: Props) {
  const [selectedStore, setSelectedStore] = useState<GameScope>(initialStore);
  const [selectedDiff, setSelectedDiff] = useState<Difficulty>(initialDifficulty);
  const [state, setState] = useState<
    { status: "loading" } | { status: "loaded"; entries: LeaderboardEntry[] } | { status: "error" }
  >({ status: "loading" });

  useEffect(() => {
    setState({ status: "loading" });
    fetchLeaderboard(selectedStore, selectedDiff)
      .then((entries) => setState({ status: "loaded", entries }))
      .catch(() => setState({ status: "error" }));
  }, [selectedStore, selectedDiff]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex flex-col items-center gap-3.5 bg-bgDark/95 px-4 py-8 text-center"
    >
      <h2 className="text-2xl font-black text-neonGold drop-shadow-[0_0_15px_#ffd23f]">
        RANKING
      </h2>

      {/* Difficulty Filter Tabs */}
      {selectedStore === "special_ichigo" ? (
        <div className="rounded-full border border-red-300/50 bg-red-500/15 px-4 py-1 text-xs font-black text-red-200">
          🍓 ICHIGO SPECIAL
        </div>
      ) : <div className="flex rounded-full border border-white/20 bg-white/5 p-0.5 text-xs">
        <button
          onClick={() => setSelectedDiff("normal")}
          className={`rounded-full px-4 py-1 font-bold transition ${
            selectedDiff === "normal"
              ? "bg-neonPink text-white shadow-neon"
              : "text-white/60 hover:text-white"
          }`}
        >
          NORMAL
        </button>
        <button
          onClick={() => setSelectedDiff("easy")}
          className={`rounded-full px-4 py-1 font-bold transition ${
            selectedDiff === "easy"
              ? "bg-neonGold text-bgDark font-black shadow-[0_0_10px_rgba(255,210,63,0.4)]"
              : "text-white/60 hover:text-white"
          }`}
        >
          EASY
        </button>
      </div>}

      {/* Store Filter Tabs */}
      <div className="flex flex-wrap justify-center gap-1 max-w-sm">
        {STORES.map((s) => (
          <button
            key={s.id}
            onClick={() => {
              setSelectedStore(s.id);
              if (s.id === "special_ichigo") setSelectedDiff("normal");
            }}
            className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
              selectedStore === s.id
                ? "bg-neonPurple text-white shadow-[0_0_8px_rgba(180,70,255,0.4)]"
                : "bg-white/5 text-white/50 hover:bg-white/10"
            }`}
          >
            {language === "ja" ? s.labelJa : s.labelEn}
          </button>
        ))}
      </div>

      {/* List Container */}
      <div className="w-full max-w-sm flex-1 overflow-y-auto rounded-xl border border-neonPurple/50 bg-white/5 p-4">
        {state.status === "loading" && <p className="text-white/60 text-sm py-4">Loading...</p>}
        {state.status === "error" && (
          <p className="text-neonPink text-sm py-4">
            {language === "ja" ? "読み込みに失敗しました" : "Failed to load"}
          </p>
        )}
        {state.status === "loaded" && state.entries.length === 0 && (
          <p className="text-white/60 text-sm py-4">
            {language === "ja" ? "まだ登録がありません" : "No records yet"}
          </p>
        )}
        {state.status === "loaded" &&
          state.entries.map((e) => (
            <div
              key={`${e.rank}_${e.nickname}_${e.createdAt}`}
              className="flex items-center justify-between gap-2 border-b border-white/10 py-2.5 text-sm last:border-none"
            >
              <span className="w-8 shrink-0 font-black text-neonPink">#{e.rank}</span>
              <div className="flex-1 min-w-0 text-left">
                <div className="truncate font-bold text-white">{e.nickname}</div>
                <div className="text-[10px] text-white/40">
                  {e.store === "special_ichigo"
                    ? "🍓 ICHIGO SPECIAL"
                    : e.store && e.store !== "all" && STORE_DISPLAY_NAMES[e.store as StoreId]
                    ? STORE_DISPLAY_NAMES[e.store as StoreId][language]
                    : language === "ja"
                    ? "全店舗"
                    : "All"}
                </div>
              </div>
              <span className="font-black text-neonGold text-base">{e.score}</span>
            </div>
          ))}
      </div>

      <motion.button
        whileTap={{ scale: 0.92 }}
        whileHover={{ scale: 1.05 }}
        onClick={onClose}
        className="rounded-full bg-gradient-to-r from-neonPurple to-neonPink px-10 py-2.5 text-base font-bold shadow-neon text-white"
      >
        {language === "ja" ? "閉じる" : "Close"}
      </motion.button>
    </motion.div>
  );
}
