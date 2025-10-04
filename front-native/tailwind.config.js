module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './app/context/**/*.{js,jsx,ts,tsx}', // add others if needed
  ],
  presets: [require('nativewind/preset')],
  theme: { extend: {} },
  plugins: [],
};
