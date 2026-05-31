/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        base: "#020d18",
        surface: {
          DEFAULT: "#061525",
          2: "#0a1e30",
          3: "#0f2840",
        },
        accent:  "#00ff88",
        "sig-smart":   "#00ff88",
        "sig-whale":   "#38bdf8",
        "sig-anomaly": "#fbbf24",
      },
      fontFamily: {
        display: ["Orbitron", "monospace"],
        mono:    ["JetBrains Mono", "Menlo", "monospace"],
      },
      keyframes: {
        sonar: {
          "0%":   { boxShadow: "0 0 0 0 rgba(0,255,136,0.55)" },
          "100%": { boxShadow: "0 0 0 14px rgba(0,255,136,0)" },
        },
        fadeUp: {
          from: { opacity: "0", transform: "translateY(12px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        slideDown: {
          from: { opacity: "0", transform: "translateY(-8px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          from: { backgroundPosition: "-200% 0" },
          to:   { backgroundPosition:  "200% 0" },
        },
        pulseDot: {
          "0%, 100%": { opacity: "1" },
          "50%":      { opacity: "0.25" },
        },
        glowPulse: {
          "0%, 100%": { opacity: "0.5" },
          "50%":      { opacity: "1"   },
        },
        scrollX: {
          from: { transform: "translateX(0)" },
          to:   { transform: "translateX(-50%)" },
        },
        blink: {
          "0%, 100%": { opacity: "1" },
          "50%":      { opacity: "0" },
        },
      },
      animation: {
        sonar:     "sonar 2.2s ease-out infinite",
        fadeUp:    "fadeUp 280ms ease-out forwards",
        slideDown: "slideDown 250ms ease-out forwards",
        shimmer:   "shimmer 1.8s linear infinite",
        pulseDot:  "pulseDot 2s ease-in-out infinite",
        glowPulse: "glowPulse 3s ease-in-out infinite",
        scrollX:   "scrollX 28s linear infinite",
        blink:     "blink 1s step-end infinite",
      },
      boxShadow: {
        glass:       "0 8px 40px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.03)",
        "glass-sm":  "0 4px 20px rgba(0,0,0,0.45)",
        "glow-sm":   "0 0 10px rgba(0,255,136,0.2)",
        "glow-md":   "0 0 20px rgba(0,255,136,0.15), 0 0 40px rgba(0,255,136,0.06)",
        "whale-sm":  "0 0 10px rgba(56,189,248,0.2)",
        "anomaly-sm":"0 0 10px rgba(251,191,36,0.2)",
      },
    },
  },
  plugins: [],
};
