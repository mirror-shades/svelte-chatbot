module.exports = {
  content: ["./src/**/*.{html,js,svelte,ts}"],
  theme: {
    container: {
      padding: '2rem',
    },
  },
  daisyui: {
    themes: [
      "dracula",
      "corporate",
      ],
  },
  plugins: [require("daisyui")],
}