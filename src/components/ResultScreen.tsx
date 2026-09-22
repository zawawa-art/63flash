import { useState } from "react";
import { motion } from "framer-motion";

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
  initialNickname: string;
  onRetry: () => void;
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
  initialNickname,
  onRetry,
  onSubmitScore,
  onShowLeaderboard,
}: Props) {
  const [nickname, setNickname] = useState(initialNickname);
  const [status, setStatus] = useState<SubmitStatus>({ state: "idle" });
  const accuracy = totalCount === 0 ? 0 : Math.round((correctCount / totalCount) * 100);

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
    <div className="flex h-full flex-col items-center justify-center gap-6 px-6 text-center">
      <motion.h2
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-3xl font-black text-neonPink drop-shadow-[0_0_15px_#ff2ee0]"
      >
        RESULT
      </motion.h2>

      {isNewRecord && (
        <motion.div
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-full bg-gradient-to-r from-neonGold to-neonPink px-6 py-1.5 text-sm font-black text-bgDark shadow-neon"
        >
          NEW RECORD!
        </motion.div>
      )}

      <div className="w-full max-w-xs space-y-2 rounded-xl border border-neonPurple/50 bg-white/5 p-6 text-left">
        <Row label="SCORE" value={score} />
        <Row label="自己ベスト" value={bestScore} />
        <Row label="MAX COMBO" value={maxCombo} />
        <Row label="正解率" value={`${accuracy}%`} />
      </div>

      <div className="w-full max-w-xs space-y-2">
        {status.state !== "submitted" && (
          <>
            <input
              type="text"
              maxLength={20}
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="ニックネーム"
              className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-center text-white outline-none focus:border-neonPurple"
            />
            <motion.button
              whileTap={{ scale: 0.92 }}
              disabled={status.state === "submitting" || !nickname.trim()}
              onClick={handleSubmit}
              className="w-full rounded-full bg-gradient-to-r from-neonGold to-neonPink px-6 py-2 text-sm font-bold text-bgDark shadow-neon disabled:opacity-50"
            >
              {status.state === "submitting" ? "送信中..." : "ランキングに登録"}
            </motion.button>
            {status.state === "error" && (
              <p className="text-xs text-neonPink">登録に失敗しました ({status.message})</p>
            )}
          </>
        )}
        {status.state === "submitted" && (
          <div className="space-y-2">
            <p className="text-neonGold">RANK #{status.rank} にランクイン！</p>
            <button
              onClick={onShowLeaderboard}
              className="text-sm text-white/50 underline underline-offset-4"
            >
              ランキングを見る
            </button>
          </div>
        )}
      </div>

      <motion.button
        whileTap={{ scale: 0.92 }}
        whileHover={{ scale: 1.05 }}
        onClick={onRetry}
        className="rounded-full bg-gradient-to-r from-neonPurple to-neonPink px-10 py-3 text-xl font-bold shadow-neon"
      >
        RETRY
      </motion.button>
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
