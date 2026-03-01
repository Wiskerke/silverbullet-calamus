// Document editor for .note files.
// Registers as the editor for the "note" extension so SilverBullet opens .note
// files with this viewer. Read-only — renders all pages as canvases.

import { getWasmBootstrapScript, getThemeBootstrapScript } from "./wasm-embed";
import { readGlobalThemeConfig, resolveTheme } from "./theme";

export async function editor(): Promise<{ html: string }> {
  const globalConfig = await readGlobalThemeConfig();
  const theme = resolveTheme(globalConfig);

  const script = `
${getWasmBootstrapScript()}
${getThemeBootstrapScript(theme)}

// Listen for file data from SilverBullet
globalThis.silverbullet.addEventListener("file-open", (event) => {
  const statusEl = document.getElementById("status");
  const headerEl = document.getElementById("header");
  const pagesEl = document.getElementById("pages");

  try {
    const fileData = event.detail.data;
    const noteBytes = typeof fileData === "string"
      ? base64ToBytes(fileData)
      : new Uint8Array(fileData);

    statusEl.textContent = "Rendering...";

    // Initialize WASM and parse
    initCalamus();
    const metadata = JSON.parse(parse(noteBytes));

    // Show metadata header
    headerEl.innerHTML =
      "<strong>" + metadata.page_count + " pages</strong>" +
      " &middot; " + metadata.page_width + "&times;" + metadata.page_height +
      " &middot; " + metadata.device +
      " &middot; " + metadata.file_type;

    // Clear previous pages (in case of re-open)
    pagesEl.innerHTML = "";

    // Get color LUT for current theme
    const colorLUT = getActiveColorLUT();

    // Render all pages
    for (let i = 0; i < metadata.page_count; i++) {
      const container = document.createElement("div");
      container.className = "page-container";

      const label = document.createElement("div");
      label.className = "page-label";
      label.textContent = "Page " + (i + 1) + " of " + metadata.page_count;
      container.appendChild(label);

      const canvas = document.createElement("canvas");
      container.appendChild(canvas);
      pagesEl.appendChild(container);

      renderPageToCanvas(canvas, noteBytes, i, metadata, colorLUT);
    }

    statusEl.textContent = "";
  } catch (e) {
    statusEl.style.color = "#c33";
    statusEl.textContent = "Error: " + e.message;
    console.error("note editor error:", e);
  }
});
`;

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html {
    --bg: #fafafa;
    --fg: #333;
    --fg-muted: #888;
    --header-bg: #f0f0f0;
    --header-fg: #555;
    --border: #e0e0e0;
    --canvas-bg: white;
  }
  html[data-theme="dark"] {
    --bg: #111;
    --fg: #ddd;
    --fg-muted: #888;
    --header-bg: #262626;
    --header-fg: #aaa;
    --border: #333;
    --canvas-bg: #1a1a1a;
  }
  body {
    font-family: system-ui, -apple-system, sans-serif;
    background: var(--bg);
    color: var(--fg);
    padding: 16px;
  }
  #content {
    max-width: 800px;
    margin: 0 auto;
  }
  #header {
    padding: 8px 12px;
    background: var(--header-bg);
    color: var(--header-fg);
    border-radius: 6px;
    margin-bottom: 12px;
    font-size: 13px;
  }
  #status {
    padding: 8px;
    color: var(--fg-muted);
  }
  .page-container {
    margin: 8px 0;
  }
  .page-label {
    font-size: 12px;
    color: var(--fg-muted);
    padding: 4px 0;
  }
  canvas {
    width: 100%;
    height: auto;
    display: block;
    border: 1px solid var(--border);
    border-radius: 4px;
    background: var(--canvas-bg);
  }
</style>
</head>
<body>
  <div id="content">
    <div id="header"></div>
    <div id="status">Waiting for file data...</div>
    <div id="pages"></div>
  </div>
  <script>${script}</script>
</body>
</html>`;

  return { html };
}
