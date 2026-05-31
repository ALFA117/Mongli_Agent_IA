/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        base: "#050f14",
        surface: {
          DEFAULT: "#0d1f2d",
          2: "#1a2e40",
          3: "#243b4e",
        },
        brand: {
          DEFAULT: "#4ade80",
          dim: "rgba(74,222,128,0.08)",
          glow: "rgba(74,222,128,0.25)",
        },
      },
      fontFamily: {
        display: ["Orbitron", "monospace"],
        mono: ["JetBrains Mono", "Menlo", "monospace"],
      },
      keyframes: {
        pulse_dot: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.3" },
        },
        fade_in: {
          "0%": { opacity: "0", transform: "translateY(-4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        pulse_dot: "pulse_dot 2s ease-in-out infinite",
        fade_in: "fade_in 200ms ease-out forwards",
        shimmer: "shimmer 1.8s linear infinite",
      },
      boxShadow: {
        glass: "0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)",
        "glass-sm": "0 4px 16px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)",
        "brand-sm": "0 0 10px rgba(74,222,128,0.2)",
      },
    },
  },
  plugins: [],
};
