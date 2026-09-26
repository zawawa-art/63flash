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
          initial={{ opacity: 0, scale: 0.7, y: 10 }}
          animate={{ opacity: 1, scale: 1.05, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: -20 }}
          transition={{ duration: 0.15, exit: { duration: 0.2 } }}
          className="pointer-events-none absolute top-12 left-0 right-0 z-10 flex justify-center"
        >
          <div className="rounded-full bg-gradient-to-r from-neonPink/90 via-neonPurple/90 to-neonGold/90 px-6 py-1.5 text-xl font-black text-bgDark shadow-neon tracking-wider backdrop-blur">
            🔥 {combo} COMBO!
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
