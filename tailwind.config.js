module.exports = {
  content: ["./src/**/*.{html,js,svelte,ts}"],
  theme: {
    extend: {
      fontFamily: {
        logo: ['League Spartan'],
        writing: ['Montserrat']
      }
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