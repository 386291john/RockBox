import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Paleta oscura tipo jukebox / Spotify
        base: {
          900: "#0a0a0f",
          800: "#111118",
          700: "#1a1a24",
          600: "#24242f",
        },
        accent: {
          DEFAULT: "#8b5cf6",
          hover: "#7c3aed",
          soft: "#a78bfa",
        },
        neon: "#22d3ee",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "spin-slow": "spin 6s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
