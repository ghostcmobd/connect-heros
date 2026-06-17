import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { DirectoryItem } from "@/lib/site.functions";
import { AlumniCard } from "./AlumniCard";

function pickN<T>(arr: T[], n: number, seed: number): T[] {
  if (arr.length <= n) return arr;
  // Fisher-Yates-ish with deterministic seed
  const a = arr.slice();
  let s = seed;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, n);
}

export function ShufflingAlumni({ alumni, count = 3, intervalMs = 5000 }: { alumni: DirectoryItem[]; count?: number; intervalMs?: number }) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);

  const visible = useMemo(() => pickN(alumni, count, tick + 1), [alumni, count, tick]);

  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
      {visible.map((item, i) => (
        <AnimatePresence mode="popLayout" key={`slot-${i}`}>
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.98 }}
            transition={{ duration: 0.5, ease: [0.2, 0.7, 0.2, 1], delay: i * 0.06 }}
          >
            <AlumniCard item={item} />
          </motion.div>
        </AnimatePresence>
      ))}
    </div>
  );
}
