/** Ladle config — component workbench for the shared design system. */
export default {
  stories: "src/**/*.stories.{js,jsx,ts,tsx}",
  addons: {
    // Our theme is driven by <html data-theme>; the ThemeToggle story exercises
    // it directly, so Ladle's own theme addon is left at its default.
    width: { enabled: true },
  },
};
