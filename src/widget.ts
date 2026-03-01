// Code widget for ```note fenced blocks.
// Renders specified pages from a .note file inline in the document.
//
// Syntax:
//   ```note
//   file: mynotebook.note
//   page: 2
//   theme: bg=#f5f0e0, fg=#3a2a1a
//   theme-darkmode: bg=#1e1e2e, fg=#cdd6f4
//   ```
// Or: pages: 1-3  |  pages: 1,3,5  |  omit for all pages

import { getWasmBootstrapScript, getThemeBootstrapScript } from "./wasm-embed";
import { readGlobalThemeConfig, resolveTheme } from "./theme";
import type { ThemeConfig, ThemeColors } from "./types";

/** Parse "bg=#hex, fg=#hex" into Partial<ThemeColors> */
function parseThemeLine(value: string): Partial<ThemeColors> {
  const result: Partial<ThemeColors> = {};
  for (const part of value.split(",")) {
    const [k, v] = part.split("=").map((s) => s.trim());
    if (k === "bg" && v) result.bg = v;
    else if (k === "fg" && v) result.fg = v;
  }
  return result;
}

/** Parse the YAML-like body of a ```note block */
function parseConfig(body: string): {
  file: string;
  pages: number[] | null;
  widgetTheme: ThemeConfig;
} {
  const lines = body.trim().split("\n");
  let file = "";
  let pages: number[] | null = null;
  const widgetTheme: ThemeConfig = {};

  for (const line of lines) {
    const [key, ...rest] = line.split(":");
    const k = key.trim().toLowerCase();
    const v = rest.join(":").trim();

    if (k === "file") {
      file = v;
    } else if (k === "page") {
      const n = parseInt(v, 10);
      if (!isNaN(n)) pages = [n];
    } else if (k === "pages") {
      pages = parsePageRange(v);
    } else if (k === "theme") {
      widgetTheme.theme = parseThemeLine(v);
    } else if (k === "theme-darkmode") {
      widgetTheme.theme_darkmode = parseThemeLine(v);
    }
  }

  return { file, pages, widgetTheme };
}

/** Parse page range strings like "1-3", "2,4,6", "1-3,5" */
function parsePageRange(spec: string): number[] {
  const pages: number[] = [];
  for (const part of spec.split(",")) {
    const trimmed = part.trim();
    if (trimmed.includes("-")) {
      const [start, end] = trimmed.split("-").map((s) => parseInt(s.trim(), 10));
      if (!isNaN(start) && !isNaN(end)) {
        for (let i = start; i <= end; i++) pages.push(i);
      }
    } else {
      const n = parseInt(trimmed, 10);
      if (!isNaN(n)) pages.push(n);
    }
  }
  return pages;
}

export async function widget(
  bodyText: string,
): Promise<{ html: string; script: string }> {
  const { file, pages, widgetTheme } = parseConfig(bodyText);

  if (!file) {
    return {
      html: `<div style="color: #c33; padding: 8px; font-family: monospace;">Error: missing "file:" in note widget config</div>`,
      script: "",
    };
  }

  const globalConfig = await readGlobalThemeConfig();
  const theme = resolveTheme(globalConfig, widgetTheme);

  const pagesJson = JSON.stringify(pages);

  const script = `
${getWasmBootstrapScript()}
${getThemeBootstrapScript(theme)}

(async () => {
  const statusEl = document.getElementById("status");
  const pagesEl = document.getElementById("pages");
  const requestedPages = ${pagesJson};

  try {
    // Read the .note file via SilverBullet syscall
    const fileData = await syscall("space.readAttachment", ${JSON.stringify(file)});
    const noteBytes = typeof fileData === "string"
      ? base64ToBytes(fileData)
      : new Uint8Array(fileData);

    // Initialize WASM and parse
    initCalamus();
    const metadata = JSON.parse(parse(noteBytes));

    // Determine which pages to render
    let pageIndices = [];
    if (requestedPages) {
      pageIndices = requestedPages.map(p => p - 1).filter(p => p >= 0 && p < metadata.page_count);
    } else {
      for (let i = 0; i < metadata.page_count; i++) pageIndices.push(i);
    }

    // Build compact page description from displayed pages (1-indexed)
    // Only use ranges for 3+ consecutive numbers; show 2 consecutive individually
    const dp = pageIndices.map(i => i + 1);
    const parts = [];
    let i = 0;
    while (i < dp.length) {
      const start = dp[i];
      let end = start;
      while (i + 1 < dp.length && dp[i + 1] === dp[i] + 1) { i++; end = dp[i]; }
      if (end - start >= 2) {
        parts.push(start + "-" + end);
      } else {
        for (let n = start; n <= end; n++) parts.push("" + n);
      }
      i++;
    }
    const shortName = ${JSON.stringify(file)}.split("/").pop();
    const label = dp.length === 1 ? "page" : "pages";
    statusEl.textContent = shortName + " — " + label + ": " + parts.join(", ");

    // Get color LUT for current theme
    const colorLUT = getActiveColorLUT();

    // Render each page
    for (const idx of pageIndices) {
      const canvas = document.createElement("canvas");
      canvas.style.cssText = "width: 100%; height: auto; display: block; margin: 4px 0; border: 1px solid #e0e0e0; border-radius: 4px;";
      pagesEl.appendChild(canvas);
      renderPageToCanvas(canvas, noteBytes, idx, metadata, colorLUT);
    }

    // Update widget height
    const updateHeight = () => {
      const h = document.documentElement.scrollHeight;
      if (h > 0) parent.postMessage({ type: "widget:resize", height: h }, "*");
    };
    updateHeight();
    setTimeout(updateHeight, 100);
  } catch (e) {
    statusEl.style.color = "#c33";
    statusEl.textContent = "Error: " + e.message;
    console.error("note widget error:", e);
  }
})();
`;

  const html = `
<div id="note-widget" style="font-family: system-ui, sans-serif;">
  <div id="status" style="padding: 8px; color: #666;">Loading ${file}...</div>
  <div id="pages"></div>
</div>`;

  return { html, script };
}
