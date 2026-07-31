/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{tsx,ts}"
  ],
  theme: {
    extend: {
      fontFamily: {
        inter: ["'Inter'", "system-ui", "-apple-system", "sans-serif"],
      },
      fontSize: {
        xs: ["11px", { lineHeight: "1.4" }],
        sm: ["12px", { lineHeight: "1.4" }],
        base: ["12px", { lineHeight: "1.5" }],
        lg: ["13px", { lineHeight: "1.6" }],
        xl: ["14px", { lineHeight: "1.6" }],
      },
    },
  },
  plugins: [],
}
