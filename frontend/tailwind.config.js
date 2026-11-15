/** @type {import('tailwindcss').Config} */
// Colours live as CSS variables in src/index.css. Each one has a fixed meaning:
//   ink/paper/surface/line = structure · accent = brand + primary action
//   smart/whale/anomaly    = the three signal types (data only, never decoration)
//   danger                 = errors and low confidence
const v = (name) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        paper:   v("paper"),
        surface: { DEFAULT: v("surface"), 2: v("surface-2") },
        ink:     { DEFAULT: v("ink"), 2: v("ink-2") },
        muted:   v("muted"),
        line:    { DEFAULT: v("line"), strong: v("ink") },
        accent:  { DEFAULT: v("accent"), soft: v("accent-soft"), ink: v("accent-ink") },
        smart:   { DEFAULT: v("smart"), soft: v("smart-soft") },
        whale:   { DEFAULT: v("whale"), soft: v("whale-soft") },
        anomaly: { DEFAULT: v("anomaly"), soft: v("anomaly-soft") },
        danger:  { DEFAULT: v("danger"), soft: v("danger-soft") },
      },
      fontFamily: {
        display: ['"Source Serif 4"', "Georgia", "serif"],
        sans:    ['"IBM Plex Sans"', "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
        mono:    ['"IBM Plex Mono"', "ui-monospace", "Menlo", "monospace"],
      },
      borderRadius: { DEFAULT: "4px", sm: "2px", md: "4px", lg: "6px" },
      boxShadow: {
        hard:      "4px 4px 0 0 rgb(var(--ink))",
        "hard-sm": "2px 2px 0 0 rgb(var(--ink))",
        "hard-xs": "1px 1px 0 0 rgb(var(--ink))",
      },
      keyframes: {
        rise:  { from: { opacity: "0", transform: "translateY(6px)" }, to: { opacity: "1", transform: "none" } },
        fade:  { from: { opacity: "0" }, to: { opacity: "1" } },
        pulse2:{ "0%,100%": { opacity: "1" }, "50%": { opacity: ".35" } },
        sweep: { from: { transform: "translateX(-100%)" }, to: { transform: "translateX(250%)" } },
      },
      animation: {
        rise:   "rise 260ms cubic-bezier(.2,.7,.2,1) both",
        fade:   "fade 200ms ease-out both",
        pulse2: "pulse2 2.4s ease-in-out infinite",
        sweep:  "sweep 1.3s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
