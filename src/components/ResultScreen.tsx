import { useState } from "react";
import { motion } from "framer-motion";
import { StoreId } from "../data/mockCasts";
import { STORE_DISPLAY_NAMES } from "../data/fetchCasts";
import { Difficulty } from "../data/leaderboardApi";

type SubmitStatus =
  | { state: "idle" }
  | { state: "submitting" }
  | { state: "submitted"; rank: number }
  | { state: "error"; message: string };

type Props = {
  score: number;
  bestScore: number;
  isNewRecord: boolean;
  maxCombo: number;
  correctCount: number;
  totalCount: number;
  difficulty: Difficulty;
  storeScope: "all" | StoreId;
  language: "en" | "ja";
  initialNickname: string;
  onRetry: () => void;
  onGoToStart: () => void;
  onSubmitScore: (nickname: string) => Promise<{ rank: number }>;
  onShowLeaderboard: () => void;
};

export default function ResultScreen({
  score,
  bestScore,
  isNewRecord,
  maxCombo,
  correctCount,
  totalCount,
  difficulty,
  storeScope,
  language,
  initialNickname,
  onRetry,
  onGoToStart,
  onSubmitScore,
  onShowLeaderboard,
}: Props) {
  const [nickname, setNickname] = useState(initialNickname);
  const [status, setStatus] = useState<SubmitStatus>({ state: "idle" });
  const accuracy = totalCount === 0 ? 0 : Math.round((correctCount / totalCount) * 100);

  const storeLabel =
    storeScope === "all"
      ? language === "ja"
        ? "全店舗"
        : "All Stores"
      : STORE_DISPLAY_NAMES[storeScope][language];

  const diffLabel = difficulty === "easy" ? "EASY" : "NORMAL";

  const handleSubmit = async () => {
    if (!nickname.trim()) return;
    setStatus({ state: "submitting" });
    try {
      const { rank } = await onSubmitScore(nickname);
      setStatus({ state: "submitted", rank });
    } catch (err) {
      setStatus({ state: "error", message: err instanceof Error ? err.message : "failed" });
    }
  };

  return (
    <div className="flex h-full flex-col items-center justify-center gap-5 px-6 text-center">
      <motion.h2
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-3xl font-black text-neonPink drop-shadow-[0_0_15px_#ff2ee0]"
      >
        RESULT
      </motion.h2>

      <div className="flex items-center gap-2">
        <span className="rounded-full bg-white/10 px-3 py-0.5 text-xs font-semibold text-white/70">
          {storeLabel}
        </span>
        <span
          className={`rounded-full px-3 py-0.5 text-xs font-black ${
            difficulty === "easy"
              ? "bg-neonGold/20 text-neonGold border border-neonGold/40"
              : "bg-neonPink/20 text-neonPink border border-neonPink/40"
          }`}
        >
          {diffLabel}
        </span>
      </div>

      {isNewRecord && (
        <motion.div
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-full bg-gradient-to-r from-neonGold to-neonPink px-6 py-1.5 text-sm font-black text-bgDark shadow-neon"
        >
          NEW RECORD!
        </motion.div>
      )}

      <div className="w-full max-w-xs space-y-2 rounded-xl border border-neonPurple/50 bg-white/5 p-5 text-left">
        <Row label="SCORE" value={score} />
        <Row label={language === "ja" ? "自己ベスト" : "BEST SCORE"} value={bestScore} />
        <Row label="MAX COMBO" value={maxCombo} />
        <Row label={language === "ja" ? "正解率" : "ACCURACY"} value={`${accuracy}%`} />
      </div>

      <div className="w-full max-w-xs space-y-2">
        {status.state !== "submitted" && (
          <>
            <input
              type="text"
              maxLength={20}
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder={language === "ja" ? "ニックネーム" : "Nickname"}
              className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-center text-white outline-none focus:border-neonPurple"
            />
            <motion.button
              whileTap={{ scale: 0.92 }}
              disabled={status.state === "submitting" || !nickname.trim()}
              onClick={handleSubmit}
              className="w-full rounded-full bg-gradient-to-r from-neonGold to-neonPink px-6 py-2 text-sm font-bold text-bgDark shadow-neon disabled:opacity-50"
            >
              {status.state === "submitting"
                ? language === "ja" ? "送信中..." : "Submitting..."
                : language === "ja" ? "ランキングに登録" : "Submit Score"}
            </motion.button>
            {status.state === "error" && (
              <p className="text-xs text-neonPink">
                {language === "ja" ? `登録に失敗しました (${status.message})` : `Failed (${status.message})`}
              </p>
            )}
          </>
        )}
        {status.state === "submitted" && (
          <div className="space-y-2">
            <p className="text-neonGold font-bold">
              {language === "ja" ? `RANK #${status.rank} にランクイン！` : `Ranked #${status.rank}!`}
            </p>
            <button
              onClick={onShowLeaderboard}
              className="text-sm text-white/60 underline underline-offset-4 hover:text-white"
            >
              {language === "ja" ? "ランキングを見る" : "View Leaderboard"}
            </button>
          </div>
        )}
      </div>

      <div className="flex w-full max-w-xs flex-col gap-2.5">
        <motion.button
          whileTap={{ scale: 0.92 }}
          whileHover={{ scale: 1.04 }}
          onClick={onRetry}
          className="w-full rounded-full bg-gradient-to-r from-neonPurple via-neonPink to-neonGold py-3.5 text-lg font-black shadow-neon tracking-wider text-white"
        >
          {language === "ja" ? "もう一度プレイ (RETRY)" : "PLAY AGAIN (RETRY)"}
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.92 }}
          whileHover={{ scale: 1.04 }}
          onClick={onGoToStart}
          className="w-full rounded-full border border-white/20 bg-white/5 py-2.5 text-sm font-bold text-white/80 hover:bg-white/10 hover:text-white transition"
        >
          {language === "ja" ? "⚙️ 設定・モードを変更する" : "⚙️ Change Mode / Stores"}
        </motion.button>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-white/60">{label}</span>
      <span className="font-bold text-neonGold">{value}</span>
    </div>
  );
}
