import { motion, useReducedMotion } from "motion/react";
import { getSignalStyle, shortAddress } from "../lib/utils";

/* The agent's sonar: a sweep that never stops, and one blip per recent signal.
   Each blip is placed by its own data — the angle comes from the wallet
   address, the distance from confidence (the surer the agent, the closer to
   the centre), the colour from the signal type — so the picture is the feed,
   not a decoration. */

const TYPE_FILL = {
  SMART_MONEY_IN: "rgb(var(--accent))",
  WHALE_MOVE: "rgb(var(--whale))",
  ANOMALY: "rgb(var(--anomaly))",
};

function place(signal) {
  const a = (parseInt(signal.wallet.slice(2, 6), 16) / 0xffff) * Math.PI * 2;
  const r = 30 + (100 - Math.min(100, Math.max(0, signal.confidence))) * 2.4; // 30…102 of 120
  return { x: 140 + Math.cos(a) * r, y: 140 + Math.sin(a) * r };
}

export default function SignalRadar({ signals = [], demo = false }) {
  const reduce = useReducedMotion();
  const blips = signals.slice(0, 12);

  return (
    <figure className="relative mx-auto w-full max-w-[380px]">
      <div className="relative aspect-square">
        <svg viewBox="0 0 280 280" className="absolute inset-0 h-full w-full" role="img"
          aria-label={`${blips.length} recent ${demo ? "sample " : ""}signals plotted by confidence: closer to the centre means higher confidence`}>
          {[40, 80, 120].map((r) => (
            <circle key={r} cx="140" cy="140" r={r} fill="none" stroke="rgb(var(--accent) / 0.22)" strokeDasharray={r === 120 ? "0" : "3 5"} />
          ))}
          <line x1="20" y1="140" x2="260" y2="140" stroke="rgb(var(--accent) / 0.12)" />
          <line x1="140" y1="20" x2="140" y2="260" stroke="rgb(var(--accent) / 0.12)" />
          {blips.map((s, i) => {
            const p = place(s);
            return (
              <motion.g
                key={s.id}
                initial={reduce ? false : { opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 220, damping: 18, delay: 0.4 + i * 0.05 }}
              >
                <circle cx={p.x} cy={p.y} r="9" fill={TYPE_FILL[s.type] ?? "rgb(var(--muted))"} opacity="0.18" />
                <circle cx={p.x} cy={p.y} r="4" fill={TYPE_FILL[s.type] ?? "rgb(var(--muted))"}>
                  <title>{`${getSignalStyle(s.type).label} · ${shortAddress(s.wallet)} · ${s.confidence}%`}</title>
                </circle>
              </motion.g>
            );
          })}
          <circle cx="140" cy="140" r="5" fill="rgb(var(--accent))" />
        </svg>
        {/* the sweep: a conic wedge turning as one transform */}
        <motion.div
          aria-hidden="true"
          className="absolute inset-[7%] rounded-full"
          style={{ background: "conic-gradient(from 0deg, rgb(var(--accent) / 0.28), transparent 70deg)" }}
          animate={reduce ? undefined : { rotate: 360 }}
          transition={{ duration: 4.5, repeat: Infinity, ease: "linear" }}
        />
      </div>
      <figcaption className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1 font-mono text-xs text-muted">
        <span><span className="text-accent">●</span> Smart money</span>
        <span><span className="text-sky-400">●</span> Whale</span>
        <span><span className="text-amber-400">●</span> Anomaly</span>
        <span>centre = higher confidence{demo && " · sample data"}</span>
      </figcaption>
    </figure>
  );
}
