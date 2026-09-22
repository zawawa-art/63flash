import { AnimatePresence, motion } from "framer-motion";

type Props = {
  combo: number;
};

export default function ComboEffect({ combo }: Props) {
  const active = combo >= 3;
  return (
    <AnimatePresence>
      {active && (
        <motion.div
          key={combo}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1.1 }}
          exit={{ opacity: 0, scale: 0.5 }}
          transition={{ duration: 0.25 }}
          className="pointer-events-none fixed inset-0 z-20 flex items-center justify-center"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-neonPink/20 via-neonPurple/20 to-neonGold/20" />
          <div className="text-6xl font-black text-neonGold drop-shadow-[0_0_25px_#ffd23f]">
            {combo} COMBO!
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
