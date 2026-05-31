import { useEffect, useRef, useState } from "react";

/**
 * Animates a number from its previous value to `target` using easeOutExpo.
 */
export function useCountUp(target, duration = 900) {
  const [value, setValue] = useState(0);
  const rafRef  = useRef(null);
  const fromRef = useRef(0);

  useEffect(() => {
    if (typeof target !== "number" || isNaN(target)) return;

    const from = fromRef.current;
    const to   = target;
    fromRef.current = to;

    if (from === to) return;

    const startTime = performance.now();

    function tick(now) {
      const t = Math.min((now - startTime) / duration, 1);
      // easeOutExpo
      const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
      setValue(Math.round(from + (to - from) * eased));
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);

  return value;
}
