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
        // Your custom colors here
      },
    },
  },
  plugins: [],
  // Explicitly disable the oxide engine for Vercel compatibility
  future: {
    disableOxide: true,
  },
};
