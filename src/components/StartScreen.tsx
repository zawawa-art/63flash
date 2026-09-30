import { motion } from "framer-motion";
import { GameScope, StoreId } from "../data/mockCasts";
import { STORE_DISPLAY_NAMES } from "../data/fetchCasts";
import { Difficulty } from "../data/leaderboardApi";
import { BgmTrack, BGM_TRACKS } from "../hooks/useAudio";
import { StoreLogo } from "./StoreLogo";

type Props = {
  bestScore: number;
  volume: number;
  bgmEnabled: boolean;
  bgmTrack: BgmTrack;
  difficulty: Difficulty;
  selectedStore: GameScope;
  language: "en" | "ja";
  isRandomBgm: boolean;
  onVolumeChange: (v: number) => void;
  onToggleBgm: () => void;
  onChangeBgmTrack: (track: BgmTrack) => void;
  onToggleRandomBgm: () => void;
  onDifficultyChange: (d: Difficulty) => void;
  onSelectStore: (s: GameScope) => void;
  onLanguageChange: (lang: "en" | "ja") => void;
  onStart: () => void;
  onShowLeaderboard: () => void;
  castCount: number;
};

const STORES: StoreId[] = ["rokusan_angel", "super_spark", "party_on", "churasun6"];

export default function StartScreen({
  bestScore,
  volume,
  bgmEnabled,
  bgmTrack,
  difficulty,
  selectedStore,
  language,
  isRandomBgm,
  onVolumeChange,
  onToggleBgm,
  onChangeBgmTrack,
  onToggleRandomBgm,
  onDifficultyChange,
  onSelectStore,
  onLanguageChange,
  onStart,
  onShowLeaderboard,
  castCount,
}: Props) {
  const isIchigoSpecial = selectedStore === "special_ichigo";

  return (
    <div className="flex h-full flex-col items-center justify-between overflow-y-auto px-4 py-5 text-center">
      {/* Header & Language Switch & BGM Toggle */}
      <div className="flex w-full max-w-sm items-center justify-between">
        <div className="flex rounded-full border border-white/20 bg-white/5 p-0.5 text-xs">
          <button
            onClick={() => onLanguageChange("ja")}
            className={`rounded-full px-2.5 py-1 font-bold transition ${
              language === "ja" ? "bg-neonPink text-white shadow-neon" : "text-white/60 hover:text-white"
            }`}
          >
            日本語
          </button>
          <button
            onClick={() => onLanguageChange("en")}
            className={`rounded-full px-2.5 py-1 font-bold transition ${
              language === "en" ? "bg-neonPink text-white shadow-neon" : "text-white/60 hover:text-white"
            }`}
          >
            EN
          </button>
        </div>

        {/* BGM Toggle & Track Selector */}
        <button
          onClick={onToggleBgm}
          className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition ${
            bgmEnabled
              ? "border-neonPurple bg-neonPurple/20 text-neonPurple"
              : "border-white/20 bg-white/5 text-white/40"
          }`}
        >
          <span>🎵 BGM</span>
          <span>{bgmEnabled ? "ON" : "OFF"}</span>
        </button>
      </div>

      <div className="flex w-full max-w-sm flex-col items-center gap-4 my-auto">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl sm:text-5xl font-black tracking-widest text-neonPink drop-shadow-[0_0_15px_#ff2ee0]"
        >
          63FLASH
        </motion.h1>

        <p className="text-xs sm:text-sm text-white/70">
          {language === "ja"
            ? "キャストの顔と名前を素早く当てるフラッシュクイズ！"
            : "Guess the cast face & name flash quiz!"}
        </p>

        {/* Difficulty Selector */}
        <div className="w-full space-y-1.5">
          <div className="text-xs font-bold text-white/50 text-left">
            {language === "ja" ? "難易度選択" : "DIFFICULTY"}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              disabled={isIchigoSpecial}
              onClick={() => onDifficultyChange("easy")}
              className={`rounded-xl border p-2 text-left transition ${
                difficulty === "easy"
                  ? "border-neonGold bg-neonGold/15 text-white shadow-[0_0_10px_rgba(255,210,63,0.3)]"
                  : "border-white/10 bg-white/5 text-white/50 hover:bg-white/10"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-black text-sm text-neonGold">EASY</span>
                <span className="text-[10px] text-neonGold/80">2択 / 8秒 / ♥5</span>
              </div>
              <div className="text-[11px] text-white/60">
                {language === "ja" ? "初心者・練習用" : "2 choices, relaxing"}
              </div>
            </button>

            <button
              disabled={isIchigoSpecial}
              onClick={() => onDifficultyChange("normal")}
              className={`rounded-xl border p-2 text-left transition ${
                difficulty === "normal"
                  ? "border-neonPink bg-neonPink/15 text-white shadow-neon"
                  : "border-white/10 bg-white/5 text-white/50 hover:bg-white/10"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-black text-sm text-neonPink">NORMAL</span>
                <span className="text-[10px] text-neonPink/80">4択 / 5秒 / ♥3</span>
              </div>
              <div className="text-[11px] text-white/60">
                {language === "ja" ? "通常スピード" : "4 choices, standard"}
              </div>
            </button>
          </div>
        </div>

        {/* Store Selection (All or Single Store) */}
        <div className="w-full space-y-1.5">
          <div className="text-xs font-bold text-white/50 text-left">
            {language === "ja" ? "出題モード" : "GAME MODE"}
          </div>

          <button
            onClick={() => onSelectStore("special_ichigo")}
            className={`relative w-full overflow-hidden rounded-xl border px-3 py-3 text-left transition ${
              isIchigoSpecial
                ? "border-red-300 bg-gradient-to-r from-red-500/35 via-neonPink/25 to-red-500/20 text-white shadow-[0_0_18px_rgba(255,70,100,0.55)]"
                : "border-red-300/30 bg-red-500/10 text-white/75 hover:bg-red-500/20"
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-black tracking-wide text-red-200">
                  🍓 {language === "ja" ? "いちご生誕祭 SPECIAL" : "ICHIGO BIRTHDAY SPECIAL"}
                </div>
                <div className="mt-0.5 text-[11px] text-white/65">
                  {language === "ja"
                    ? `歴代写真${castCount}枚・4択・5秒・専用ランキング`
                    : `${castCount} archive photos · 4 choices · 5 sec`}
                </div>
              </div>
              <span className={`text-xs font-bold ${isIchigoSpecial ? "text-red-200" : "text-white/30"}`}>
                {isIchigoSpecial ? "✓" : "○"}
              </span>
            </div>
          </button>

          {/* All Stores button */}
          <button
            onClick={() => onSelectStore("all")}
            className={`w-full rounded-xl border py-2.5 px-3 transition flex items-center justify-between ${
              selectedStore === "all"
                ? "border-neonPurple bg-neonPurple/25 text-white shadow-[0_0_14px_rgba(180,70,255,0.4)]"
                : "border-white/10 bg-white/5 text-white/60 hover:bg-white/10"
            }`}
          >
            <span className="font-black text-sm tracking-wide">
              {language === "ja" ? "🌟 全店舗（ALL STORES）" : "🌟 ALL STORES"}
            </span>
            <span className={`text-xs font-bold ${selectedStore === "all" ? "text-neonPurple" : "text-white/30"}`}>
              {selectedStore === "all" ? "✓" : "○"}
            </span>
          </button>

          {/* Individual Stores Grid */}
          <div className="grid grid-cols-2 gap-2">
            {STORES.map((s) => {
              const selected = selectedStore === s;
              return (
                <button
                  key={s}
                  onClick={() => onSelectStore(s)}
                  className={`relative flex flex-col items-center justify-center rounded-xl border p-2.5 transition overflow-hidden min-h-[56px] ${
                    selected
                      ? "border-neonPurple/90 bg-neonPurple/25 shadow-[0_0_12px_rgba(180,70,255,0.4)]"
                      : "border-white/10 bg-white/5 opacity-40 hover:opacity-75"
                  }`}
                >
                  <StoreLogo store={s} />
                  <div
                    className={`absolute top-1 right-1.5 text-[11px] font-bold ${
                      selected ? "text-neonPurple" : "text-white/30"
                    }`}
                  >
                    {selected ? "✓" : "○"}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="text-right text-[11px] text-white/50">
            {isIchigoSpecial
              ? language === "ja" ? `収録写真: ${castCount}枚` : `Archive Photos: ${castCount}`
              : language === "ja" ? `対象キャスト: ${castCount}名` : `Eligible Casts: ${castCount}`}
          </div>
        </div>

        {/* Best Score Banner */}
        <div className="flex w-full items-center justify-between rounded-xl border border-neonGold/30 bg-neonGold/10 px-4 py-2 text-neonGold">
          <span className="text-xs font-bold tracking-wider">
            {language === "ja" ? "BEST SCORE" : "BEST SCORE"}
          </span>
          <span className="text-xl font-black">{bestScore}</span>
        </div>

        {/* BGM Tracks & Volume Slider */}
        <div className="w-full space-y-2 rounded-xl border border-white/10 bg-white/5 p-3">
          {bgmEnabled && (
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-white/50 font-bold shrink-0">
                  {language === "ja" ? "BGM セレクター (7曲)" : "BGM SELECTOR"}
                </span>
                <button
                  onClick={onToggleRandomBgm}
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold transition ${
                    isRandomBgm
                      ? "bg-neonGold text-bgDark shadow-[0_0_8px_rgba(255,210,63,0.4)]"
                      : "bg-white/10 text-white/60 hover:text-white"
                  }`}
                >
                  🎲 {isRandomBgm ? (language === "ja" ? "ランダム: ON" : "RANDOM ON") : (language === "ja" ? "ランダム: OFF" : "RANDOM OFF")}
                </button>
              </div>

              {!isRandomBgm && (
                <div className="flex flex-wrap gap-1 justify-center">
                  {BGM_TRACKS.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => onChangeBgmTrack(t.id)}
                      className={`rounded-lg px-2 py-1 text-[10px] font-bold transition ${
                        bgmTrack === t.id
                          ? "bg-neonPurple text-white shadow-[0_0_8px_rgba(180,70,255,0.4)]"
                          : "bg-white/5 text-white/50 hover:bg-white/10"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex w-full items-center gap-3">
            <span className="text-xs font-bold text-white/50">VOL</span>
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
        </div>

        {/* Start Button */}
        <motion.button
          whileTap={{ scale: 0.92 }}
          whileHover={{ scale: 1.05 }}
          disabled={castCount < 2}
          onClick={onStart}
          className="w-full rounded-full bg-gradient-to-r from-neonPink via-neonPurple to-neonGold py-3.5 text-xl font-black shadow-neon tracking-widest text-white disabled:opacity-40"
        >
          START
        </motion.button>

        {/* Leaderboard Link */}
        <button
          onClick={onShowLeaderboard}
          className="text-xs sm:text-sm text-white/50 underline underline-offset-4 hover:text-white"
        >
          {language === "ja" ? "🏆 ランキングを見る" : "🏆 View Leaderboard"}
        </button>
      </div>
    </div>
  );
}
