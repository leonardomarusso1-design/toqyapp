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
        primary: {
          50: "#eff6ff",
          100: "#dbeafe",
           200: "#bfdbfe",
           300: "#93c5fd",
           400: "#60a5fa",
           500: "#3b82f6",
           600: "#2563eb",
           700: "#1d4ed8",
           800: "#1e40af",
           900: "#1e3a8a",
          950: "#172554",
        },
        accent: {
          50: "#f0f9ff",
           100: "#e0f2fe",
           200: "#bae6fd",
           300: "#7dd3fc",
           400: "#38bdf8",
           500: "#0ea5e9",
           600: "#0284c7",
           700: "#0369a1",
           800: "#075985",
           900: "#0c4a6e",
        },
        night: {
          950: "#020617",
          900: "#0f172a",
          850: "#111827",
          800: "#1f2937",
        },
      },
      boxShadow: {
        glow: "0 0 60px rgba(59, 130, 246, 0.3)",
        soft: "0 10px 40px rgba(0, 0, 0, 0.3)",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [],
};

export default config;
