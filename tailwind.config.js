/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-barlow)', 'system-ui', 'sans-serif'],
        display: ['var(--font-bebas)', 'Impact', 'sans-serif'],
      },
    },
  },
  safelist: [
    // Grid column spans
    'col-span-1', 'col-span-2', 'col-span-3', 'col-span-4', 'col-span-5', 'col-span-6',
    // Grid row spans  
    'row-span-1', 'row-span-2', 'row-span-3', 'row-span-4', 'row-span-5', 'row-span-6',
    // Grid template columns
    'grid-cols-1', 'grid-cols-2', 'grid-cols-3', 'grid-cols-4', 'grid-cols-5', 'grid-cols-6',
    // Additional responsive variants
    'md:col-span-1', 'md:col-span-2', 'md:col-span-3', 'md:col-span-4',
    'lg:col-span-1', 'lg:col-span-2', 'lg:col-span-3', 'lg:col-span-4',
    'xl:col-span-1', 'xl:col-span-2', 'xl:col-span-3', 'xl:col-span-4',
    'md:row-span-1', 'md:row-span-2', 'md:row-span-3', 'md:row-span-4',
    'lg:row-span-1', 'lg:row-span-2', 'lg:row-span-3', 'lg:row-span-4',
    'xl:row-span-1', 'xl:row-span-2', 'xl:row-span-3', 'xl:row-span-4',
  ],
  plugins: [],
} 