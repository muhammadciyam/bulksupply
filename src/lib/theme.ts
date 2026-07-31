export const THEME_PRESETS = {
  blue: { label: "Blue", primary: "#2f8fd1", primaryDark: "#1f6fae" },
  green: { label: "Green", primary: "#14a35a", primaryDark: "#0e7f45" },
  orange: { label: "Orange", primary: "#f2871e", primaryDark: "#c96f16" },
  red: { label: "Red", primary: "#e0303a", primaryDark: "#b7232b" },
  purple: { label: "Purple", primary: "#7c3aed", primaryDark: "#5b21b6" },
  teal: { label: "Teal", primary: "#0d9488", primaryDark: "#0f766e" },
} as const;

export type ThemeColor = keyof typeof THEME_PRESETS;

export const DEFAULT_THEME_COLOR: ThemeColor = "blue";

export function isThemeColor(value: string): value is ThemeColor {
  return value in THEME_PRESETS;
}
