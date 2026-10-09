/** @type {import('tailwindcss').Config} */
// Every colour reads a CSS variable (RGB channels) so the dark "HUD" and the
// light "field notes" theme come from one place: src/index.css.
const v = (name) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        base: v("base"),
        surface: {
          DEFAULT: v("surface"),
          2: v("surface-2"),
          3: v("surface-3"),
        },
        line: v("line"),
        ink: v("ink"),
        muted: v("muted"),
        accent: v("accent"),
        "on-accent": v("on-accent"),
        "sig-smart": v("accent"),
        "sig-whale": v("whale"),
        "sig-anomaly": v("anomaly"),
        // The components were written against Tailwind's slate/amber/sky/red.
        // Re-pointing those names at tokens themes the whole app without
        // touching each class, and lifts the darkest greys above 4.5:1.
        slate: {
          100: v("s100"), 200: v("s200"), 300: v("s300"), 400: v("s400"),
          500: v("s500"), 600: v("s600"), 700: v("s700"), 800: v("s800"),
        },
        amber: { 300: v("anomaly"), 400: v("anomaly"), 500: v("anomaly") },
        sky: { 300: v("whale"), 400: v("whale"), 500: v("whale") },
        red: { 300: v("danger"), 400: v("danger"), 500: v("danger") },
      },
      fontFamily: {
        display: ["Orbitron", "system-ui", "sans-serif"],
        sans: ["Manrope", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Menlo", "monospace"],
      },
      keyframes: {
        sonar: {
          "0%": { boxShadow: "0 0 0 0 rgb(var(--accent) / 0.55)" },
          "100%": { boxShadow: "0 0 0 14px rgb(var(--accent) / 0)" },
        },
        fadeUp: {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        slideDown: {
          from: { opacity: "0", transform: "translateY(-8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          from: { backgroundPosition: "-200% 0" },
          to: { backgroundPosition: "200% 0" },
        },
        pulseDot: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.25" },
        },
        glowPulse: {
          "0%, 100%": { opacity: "0.5" },
          "50%": { opacity: "1" },
        },
        scrollX: {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-50%)" },
        },
        blink: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0" },
        },
      },
      animation: {
        sonar: "sonar 2.2s ease-out infinite",
        fadeUp: "fadeUp 280ms ease-out forwards",
        slideDown: "slideDown 250ms ease-out forwards",
        shimmer: "shimmer 1.8s linear infinite",
        pulseDot: "pulseDot 2s ease-in-out infinite",
        glowPulse: "glowPulse 3s ease-in-out infinite",
        scrollX: "scrollX 28s linear infinite",
        blink: "blink 1s step-end infinite",
      },
      boxShadow: {
        glass: "0 8px 40px rgb(var(--shadow) / 0.45), inset 0 1px 0 rgb(var(--line) / 0.03)",
        "glass-sm": "0 4px 20px rgb(var(--shadow) / 0.35)",
        "glow-sm": "0 0 10px rgb(var(--accent) / 0.2)",
        "glow-md": "0 0 20px rgb(var(--accent) / 0.15), 0 0 40px rgb(var(--accent) / 0.06)",
        "whale-sm": "0 0 10px rgb(var(--whale) / 0.2)",
        "anomaly-sm": "0 0 10px rgb(var(--anomaly) / 0.2)",
      },
    },
  },
  plugins: [],
};
