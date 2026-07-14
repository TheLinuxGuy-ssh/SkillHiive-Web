import { useEffect, useState } from "react";
import { useTheme } from "@/components/theme-provider";
import {
  darkPalette,
  lightPalette,
  spacing,
  radii,
  typography,
  elevation,
  type ColorPalette,
} from "./tokens";

export type ResolvedMode = "light" | "dark";

export interface Tokens {
  mode: ResolvedMode;
  colors: ColorPalette;
  spacing: typeof spacing;
  radii: typeof radii;
  typography: typeof typography;
  elevation: typeof elevation;
}

function systemPrefersDark(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return true;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

/**
 * Resolves the active colour palette + scale tokens for the current theme.
 * Mirrors the mobile `useTheme()` contract (`colors`, `spacing`, `radii`,
 * `typography`) so screens can be ported with minimal rewiring.
 */
export function useTokens(): Tokens {
  const { theme } = useTheme();
  const [systemDark, setSystemDark] = useState<boolean>(systemPrefersDark);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mql.addEventListener?.("change", handler);
    return () => mql.removeEventListener?.("change", handler);
  }, []);

  const mode: ResolvedMode =
    theme === "system" ? (systemDark ? "dark" : "light") : theme;

  return {
    mode,
    colors: mode === "dark" ? darkPalette : lightPalette,
    spacing,
    radii,
    typography,
    elevation,
  };
}
