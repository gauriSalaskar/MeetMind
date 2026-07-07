/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Ocean Slate palette -- cool slate base with an ocean-blue accent
        // and warm amber secondary, replacing the previous warm cream/terracotta theme.
        bg: {
          deep: "#E3E9ED",
          panel: "#EEF2F5",
          surface: "#F7F9FA",
        },
        clay: {
          DEFAULT: "#1F5670",
          bright: "#163F52",
          soft: "#4A7E99",
        },
        glow: {
          light: "#6FA9C2",
          pale: "#BFD9E4",
        },
        sage: {
          DEFAULT: "#CE8A2E",
          soft: "#E0AC5E",
        },
        ink: {
          primary: "#161F24",
          secondary: "#3D4F58",
          muted: "#71858F",
        },
      },
      fontFamily: {
        display: ["Fraunces", "Georgia", "serif"],
        body: ["Nunito Sans", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      boxShadow: {
        glow: "0 8px 30px -10px rgba(224, 122, 95, 0.30)",
        "glow-lg": "0 20px 60px -15px rgba(224, 122, 95, 0.35)",
        card: "0 4px 20px -6px rgba(107, 95, 88, 0.15)",
      },
      backdropBlur: {
        xs: "2px",
      },
      animation: {
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        float: "float 8s ease-in-out infinite",
        "float-delay": "float 10s ease-in-out infinite 2s",
        shimmer: "shimmer 2s linear infinite",
        "fade-up": "fadeUp 0.6s ease-out forwards",
        breathe: "breathe 1.6s ease-in-out infinite",
        "scale-in": "scaleIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
        "bounce-subtle": "bounceSubtle 2s ease-in-out infinite",
        wiggle: "wiggle 1.2s ease-in-out infinite",
        "count-up": "countUp 0.5s ease-out forwards",
        "skeleton-shimmer": "skeletonShimmer 1.5s ease-in-out infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0) translateX(0)" },
          "33%": { transform: "translateY(-20px) translateX(10px)" },
          "66%": { transform: "translateY(10px) translateX(-15px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-1000px 0" },
          "100%": { backgroundPosition: "1000px 0" },
        },
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        breathe: {
          "0%, 100%": { transform: "scale(1)", opacity: "1" },
          "50%": { transform: "scale(1.12)", opacity: "0.8" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.9)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        bounceSubtle: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-4px)" },
        },
        wiggle: {
          "0%, 100%": { transform: "rotate(0deg)" },
          "25%": { transform: "rotate(-4deg)" },
          "75%": { transform: "rotate(4deg)" },
        },
        countUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        skeletonShimmer: {
          "0%": { backgroundPosition: "-400px 0" },
          "100%": { backgroundPosition: "400px 0" },
        },
      },
    },
  },
  plugins: [],
};