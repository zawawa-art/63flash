import { motion } from "framer-motion";
import { Cast } from "../data/mockCasts";
import { getCastDisplayName } from "../data/nameDictionary";

type Props = {
  cast: Cast;
  language: "en" | "ja";
  onContinue: () => void;
};

export default function MissRevealScreen({ cast, language, onContinue }: Props) {
  const displayName = getCastDisplayName(cast, language);

  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 px-6 text-center">
      <motion.h2
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-3xl font-black text-neonPink drop-shadow-[0_0_15px_#ff2ee0]"
      >
        GAME OVER
      </motion.h2>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-xs overflow-hidden rounded-2xl border-2 border-neonGold/60 shadow-neon bg-black/40"
      >
        <div className="aspect-[2/3] w-full max-h-[50vh] overflow-hidden">
          <img
            src={cast.image_url}
            alt={displayName}
            className="h-full w-full object-cover object-top"
            draggable={false}
          />
        </div>
        <div className="space-y-1 bg-white/5 p-4 text-left">
          <div className="flex items-center justify-between">
            <p className="text-xl font-black text-neonGold">{displayName}</p>
            {cast.is_og && (
              <span className="rounded-md border border-neonPurple/50 bg-neonPurple/20 px-2 py-0.5 text-[11px] font-black text-purple-200">
                {language === "ja" ? "🎓 OG (過去在籍)" : "🎓 OG / LEGEND"}
              </span>
            )}
          </div>
          {cast.name_ja && cast.name_ja !== cast.name && (
            <p className="text-xs text-white/50">{language === "ja" ? cast.name : cast.name_ja}</p>
          )}
          {cast.storeName && <p className="text-sm text-white/60">{cast.storeName}</p>}
          {cast.officialUrl && (
            <a
              href={cast.officialUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block rounded-full bg-gradient-to-r from-neonPurple to-neonPink px-4 py-1.5 text-xs font-bold shadow-neon"
            >
              {language === "ja" ? "公式プロフィールを見る" : "View Official Profile"}
            </a>
          )}
        </div>
      </motion.div>

      <motion.button
        whileTap={{ scale: 0.92 }}
        whileHover={{ scale: 1.05 }}
        onClick={onContinue}
        className="rounded-full bg-gradient-to-r from-neonPurple to-neonPink px-10 py-3 text-xl font-bold shadow-neon"
      >
        NEXT
      </motion.button>
    </div>
  );
}
