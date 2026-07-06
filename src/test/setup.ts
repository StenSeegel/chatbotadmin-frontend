// Vitest-Setup: jest-dom-Matcher (toBeInTheDocument, …) registrieren und nach
// jedem Test das gerenderte DOM aufräumen.
import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

afterEach(() => {
  cleanup();
});
