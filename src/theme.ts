// Theme resolution: reads global config via syscall, merges with widget overrides and defaults.

import type { ThemeColors, ThemeConfig, ResolvedTheme } from "./types";

const DEFAULT_LIGHT: ThemeColors = { bg: "#f0f0f0", fg: "#1a1a1a" };
const DEFAULT_DARK: ThemeColors = { bg: "#1a1a1a", fg: "#e0e0e0" };

declare function syscall(name: string, ...args: unknown[]): Promise<unknown>;

export async function readGlobalThemeConfig(): Promise<ThemeConfig> {
  try {
    const config = (await syscall("config.get", "calamus")) as
      | ThemeConfig
      | undefined;
    return config ?? {};
  } catch {
    return {};
  }
}

function mergeColors(
  base: ThemeColors,
  ...overrides: (Partial<ThemeColors> | undefined)[]
): ThemeColors {
  const result = { ...base };
  for (const o of overrides) {
    if (o?.bg) result.bg = o.bg;
    if (o?.fg) result.fg = o.fg;
  }
  return result;
}

export function resolveTheme(
  global: ThemeConfig,
  widgetOverride?: ThemeConfig,
): ResolvedTheme {
  const light = mergeColors(DEFAULT_LIGHT, global.theme, widgetOverride?.theme);
  const dark = mergeColors(
    DEFAULT_DARK,
    global.theme,
    global.theme_darkmode,
    widgetOverride?.theme,
    widgetOverride?.theme_darkmode,
  );
  return { light, dark };
}
