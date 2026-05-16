import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#1f2933",
        mist: "#faf9ff",
        sage: "#8c5cff",
        leaf: "#6603fc",
        blush: "#f8e9e5",
        cream: "#ffffff",
      },
      boxShadow: {
        soft: "0 18px 45px rgba(31, 41, 51, 0.09)",
      },
    },
  },
  plugins: [],
};

export default config;
