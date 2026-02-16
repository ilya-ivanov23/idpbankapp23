import type { Config } from "tailwindcss";

const config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "./constants/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        fill: {
          1: "rgba(255, 255, 255, 0.10)",
        },
        background: "var(--background)",
        foreground: "var(--foreground)",
        border: "var(--gray-200)", /* Use gray-200 variable */
        input: "var(--gray-300)", /* Use gray-300 variable */
        ring: "var(--bank-gradient)", 
        primary: {
          DEFAULT: "var(--bank-gradient)",
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        popover: {
          DEFAULT: "var(--card)", /* Reuse card color (Surface) */
          foreground: "var(--foreground)",
        },
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--foreground)",
        },
        bankGradient: "var(--bank-gradient)",
        indigo: {
          500: "#6172F3",
          700: "#3538CD",
        },
        success: {
          25: "#F6FEF9",
          50: "#ECFDF3",
          100: "#D1FADF",
          600: "#039855",
          700: "#027A48",
          900: "#054F31",
        },
        pink: {
          25: "#FEF6FB",
          100: "#FCE7F6",
          500: "#EE46BC",
          600: "#DD2590",
          700: "#C11574",
          900: "#851651",
        },
        blue: {
          25: "#F5FAFF",
          100: "#D1E9FF",
          500: "#2E90FA",
          600: "#1570EF",
          700: "#175CD3",
          900: "#194185",
        },
        sky: {
          1: "#F3F9FF",
        },
        black: {
          1: "var(--black-1)",
          2: "var(--black-2)",
        },
        gray: {
          25: "var(--gray-25)",
          200: "var(--gray-200)",
          300: "var(--gray-300)",
          500: "var(--gray-500)",
          600: "var(--gray-600)",
          700: "var(--gray-700)",
          900: "var(--gray-900)",
        },
      },
      backgroundImage: {
        "bank-gradient": "linear-gradient(90deg, var(--bank-gradient) 0%, var(--bank-gradient) 100%)",
        "gradient-mesh": "url('/icons/gradient-mesh.svg')",
        "bank-green-gradient":
          "linear-gradient(90deg, #01797A 0%, #489399 100%)",
      },
      boxShadow: {
        form: "0px 1px 2px 0px rgba(16, 24, 40, 0.05)",
        chart:
          "0px 1px 3px 0px rgba(16, 24, 40, 0.10), 0px 1px 2px 0px rgba(16, 24, 40, 0.06)",
        profile:
          "0px 12px 16px -4px rgba(16, 24, 40, 0.08), 0px 4px 6px -2px rgba(16, 24, 40, 0.03)",
        creditCard: "8px 10px 16px 0px rgba(0, 0, 0, 0.05)",
      },
      fontFamily: {
        inter: "var(--font-inter)",
        "ibm-plex-serif": "var(--font-ibm-plex-serif)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;

export default config;
