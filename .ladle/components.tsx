import type { GlobalProvider } from "@ladle/react";
import "../src/index.css";
import { ThemeProvider } from "../src/theme/ThemeContext";

/**
 * Wraps every story so design tokens + theming are live: loads the token
 * stylesheet, provides the ThemeProvider, and paints the token background so
 * components sit on a real surface.
 */
export const Provider: GlobalProvider = ({ children }) => (
  <ThemeProvider>
    <div className="bg-surface text-on-surface min-h-screen p-8">{children}</div>
  </ThemeProvider>
);
