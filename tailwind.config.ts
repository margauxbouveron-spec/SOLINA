import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Dark Mediterranean night palette
        night: "#070D17",      // page background — deep midnight blue
        abyss: "#0B1626",      // mid-elevated surface
        shore: "#15243A",      // cards, dividers, chips
        cream: "#F4ECDD",      // primary text on dark
        mist: "#B8A98E",       // secondary / muted text
        gold: "#E0C275",       // accent — slightly warmer for dark bg
        olive: "#6E7F5F",
        deep: "#1F3A5F",
        // Legacy aliases kept so existing utilities don't break:
        sand: "#15243A",
        ink: "#070D17",
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Fraunces", "Instrument Serif", "serif"],
        sans: ["var(--font-sans)", "Plus Jakarta Sans", "system-ui", "sans-serif"],
      },
      letterSpacing: {
        signature: "0.42em",
        editorial: "0.18em",
      },
      transitionTimingFunction: {
        silk: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
      keyframes: {
        breathe: {
          "0%, 100%": { opacity: "0.85", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.04)" },
        },
        rise: {
          "0%": { opacity: "0", transform: "translateY(14px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        drift: {
          "0%, 100%": { transform: "translateX(0)" },
          "50%": { transform: "translateX(-2%)" },
        },
      },
      animation: {
        breathe: "breathe 6s ease-in-out infinite",
        rise: "rise 1.4s cubic-bezier(0.16, 1, 0.3, 1) both",
        drift: "drift 18s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
