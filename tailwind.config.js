/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/pages/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // FinTech-ish palette
        background: "#020617", // slate-950
        foreground: "#e2e8f0", // slate-200

        card: {
          DEFAULT: "#020617",
          foreground: "#e2e8f0",
        },
        border: "#1f2937",
        muted: {
          DEFAULT: "#0f172a",
          foreground: "#94a3b8",
        },
        accent: {
          DEFAULT: "#0f172a",
          foreground: "#e2e8f0",
        },
        primary: {
          DEFAULT: "#22c55e", // green
          foreground: "#022c22",
        },
        destructive: {
          DEFAULT: "#ef4444",
          foreground: "#fee2e2",
        },
      },
      borderRadius: {
        lg: "0.75rem",
        md: "0.55rem",
        sm: "0.35rem",
      },
      boxShadow: {
        elevated:
          "0 16px 40px rgba(15, 23, 42, 0.8), 0 0 0 1px rgba(15, 23, 42, 0.9)",
      },
    },
  },
  plugins: [],
};
