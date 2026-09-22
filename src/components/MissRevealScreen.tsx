import { motion } from "framer-motion";
import { Cast } from "../data/mockCasts";

type Props = {
  cast: Cast;
  onContinue: () => void;
};

export default function MissRevealScreen({ cast, onContinue }: Props) {
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
        className="w-full max-w-xs overflow-hidden rounded-2xl border-2 border-neonGold/60 shadow-neon"
      >
        <div className="aspect-[3/4] w-full overflow-hidden">
          <img
            src={cast.image_url}
            alt={cast.name}
            className="h-full w-full object-cover"
            draggable={false}
          />
        </div>
        <div className="space-y-1 bg-white/5 p-4 text-left">
          <p className="text-xl font-black text-neonGold">{cast.name}</p>
          {cast.storeName && <p className="text-sm text-white/60">{cast.storeName}</p>}
          {cast.officialUrl && (
            <a
              href={cast.officialUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block rounded-full bg-gradient-to-r from-neonPurple to-neonPink px-4 py-1.5 text-xs font-bold shadow-neon"
            >
              公式プロフィールを見る
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
