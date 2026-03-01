export interface NoteWidgetConfig {
  file: string;
  page?: number; // 1-indexed single page
  pages?: string; // range: "1-3", "2,4,6", "1-3,5"
}

export interface NoteMetadata {
  page_count: number;
  page_width: number;
  page_height: number;
  file_type: string;
  signature: string;
  device: string;
}

export interface ThemeColors {
  bg: string; // hex color for white pixels
  fg: string; // hex color for dark pixels
}

export interface ThemeConfig {
  theme?: Partial<ThemeColors>;
  theme_darkmode?: Partial<ThemeColors>;
}

export interface ResolvedTheme {
  light: ThemeColors;
  dark: ThemeColors;
}
