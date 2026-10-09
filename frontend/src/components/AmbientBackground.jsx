import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "motion/react";

/* What the agent watches, floating in real CSS 3D: tokens and blocks.
   Coins have two faces and a 12-segment edge, so they show real thickness
   as they turn (green face for smart money, blue back for whales); blocks are
   six-sided cubes in the anomaly amber. Far light and near objects move at
   different rates with the pointer and the scroll. Full on the live feed,
   quiet on the explorer and analytics. Transform and opacity only. */

const OBJECTS = [
  { kind: "coin",  x: "84%", y: "10%", size: 96, depth: 1,    spin: 9,  mobile: true,  calm: true },
  { kind: "block", x: "4%",  y: "58%", size: 56, depth: 0.75, spin: 20, mobile: true,  calm: false },
  { kind: "coin",  x: "12%", y: "16%", size: 52, depth: 0.5,  spin: 12, mobile: false, calm: false },
  { kind: "block", x: "90%", y: "64%", size: 72, depth: 0.9,  spin: 24, mobile: false, calm: true },
  { kind: "coin",  x: "58%", y: "88%", size: 40, depth: 0.35, spin: 14, mobile: false, calm: false },
  { kind: "block", x: "46%", y: "4%",  size: 34, depth: 0.3,  spin: 28, mobile: false, calm: false },
];

function useIsMobile() {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return mobile;
}

function Coin({ size }) {
  const thick = Math.max(6, size * 0.12);
  const r = size / 2;
  const seg = (2 * Math.PI * r) / 12 + 1;
  return (
    <>
      <div className="amb-face amb-front" style={{ transform: `translateZ(${thick / 2}px)` }}><i className="amb-ring" /></div>
      <div className="amb-face amb-back" style={{ transform: `rotateY(180deg) translateZ(${thick / 2}px)` }}><i className="amb-ring" /></div>
      {/* the rim: 12 thin plates stood on edge around the circle */}
      {Array.from({ length: 12 }, (_, i) => (
        <span
          key={i}
          className="amb-edge"
          style={{
            width: seg,
            height: thick,
            left: r - seg / 2,
            top: r - thick / 2,
            transform: `rotateZ(${i * 30}deg) translateY(${-r + 1}px) rotateX(90deg)`,
          }}
        />
      ))}
    </>
  );
}

function Block({ size }) {
  const h = size / 2;
  const faces = [
    `translateZ(${h}px)`, `rotateY(180deg) translateZ(${h}px)`,
    `rotateY(90deg) translateZ(${h}px)`, `rotateY(-90deg) translateZ(${h}px)`,
    `rotateX(90deg) translateZ(${h}px)`, `rotateX(-90deg) translateZ(${h}px)`,
  ];
  return faces.map((t) => <div key={t} className="amb-side" style={{ transform: t }} />);
}

function Floating({ obj, reduce, px, py, scroll }) {
  const x = useTransform(px, (v) => (reduce ? 0 : v * 50 * obj.depth));
  const y = useTransform([py, scroll], ([p, s]) => (reduce ? 0 : p * 32 * obj.depth - s * 300 * obj.depth));
  const spin = obj.kind === "coin"
    ? { rotateY: [0, 360], y: [0, -10, 0] }
    : { rotateX: [-20, 340], rotateY: [30, 390], y: [0, -8, 0] };
  return (
    <motion.div className="amb-obj" style={{ left: obj.x, top: obj.y, width: obj.size, height: obj.size, x, y }}>
      <motion.div
        className={`amb-3d amb-${obj.kind}`}
        initial={obj.kind === "coin" ? { rotateX: 14, rotateY: 30 } : { rotateX: -20, rotateY: 30 }}
        animate={reduce ? undefined : spin}
        transition={{
          rotateY: { duration: obj.spin, repeat: Infinity, ease: "linear" },
          rotateX: { duration: obj.spin * 1.3, repeat: Infinity, ease: "linear" },
          y: { duration: 6, repeat: Infinity, ease: "easeInOut" },
        }}
      >
        {obj.kind === "coin" ? <Coin size={obj.size} /> : <Block size={obj.size} />}
      </motion.div>
    </motion.div>
  );
}

export default function AmbientBackground() {
  const { pathname } = useLocation();
  const full = pathname === "/";
  const reduce = useReducedMotion() ?? false;
  const mobile = useIsMobile();

  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const px = useSpring(rx, { stiffness: 40, damping: 18 });
  const py = useSpring(ry, { stiffness: 40, damping: 18 });
  useEffect(() => {
    if (reduce || !window.matchMedia("(pointer: fine)").matches) return;
    const onMove = (e) => {
      rx.set((e.clientX / window.innerWidth - 0.5) * 2);
      ry.set((e.clientY / window.innerHeight - 0.5) * 2);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [reduce, rx, ry]);

  const { scrollYProgress } = useScroll();
  const scroll = useSpring(scrollYProgress, { stiffness: 60, damping: 20 });
  const farY = useTransform(scroll, (v) => (reduce ? 0 : v * -40));
  const farX = useTransform(px, (v) => (reduce ? 0 : v * -12));

  const objects = OBJECTS.filter((o) => (full ? true : o.calm) && (mobile ? o.mobile : true));

  return (
    <div aria-hidden="true" className={`amb-root ${full ? "amb-full" : "amb-calm"}`}>
      <motion.div className="amb-layer amb-far" style={{ y: farY, x: farX }} />
      <div className="amb-vignette" />
      <div className="amb-layer amb-near" style={{ perspective: 800 }}>
        {objects.map((o) => (
          <Floating key={`${o.x}${o.y}`} obj={o} reduce={reduce} px={px} py={py} scroll={scroll} />
        ))}
      </div>
    </div>
  );
}
