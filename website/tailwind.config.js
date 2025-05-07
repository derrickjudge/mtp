/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Dark theme colors
        'background': '#0a0a0a',
        'foreground': '#ededed',
      },
      fontFamily: {
        'sans': ['Arial', 'Helvetica', 'sans-serif'],
      },
    },
  },
  plugins: [],
  darkMode: 'class',
};
