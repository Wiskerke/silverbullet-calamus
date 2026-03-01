// Generates the JavaScript bootstrap string that gets embedded in widget/editor iframes.
// This code runs in the iframe's DOM context (has canvas access, no worker restrictions).

import { WASM_BASE64, CALAMUS_JS_BINDINGS } from "./generated/wasm-bundle";
import type { ResolvedTheme } from "./types";

/**
 * Returns a JavaScript string that, when executed in an iframe, provides:
 * - initCalamus(): initializes the WASM module
 * - parse(data: Uint8Array): parses .note file, returns metadata object
 * - render_page(data: Uint8Array, page: number): returns RGBA pixel array
 * - renderPageToCanvas(canvas, data, pageIndex, metadata, colorLUT?): renders a page onto a canvas element
 */
export function getWasmBootstrapScript(): string {
  return `
// --- Base64 WASM decode + calamus JS bindings ---
const WASM_BASE64 = ${JSON.stringify(WASM_BASE64)};

function base64ToBytes(base64) {
  const binString = atob(base64);
  const bytes = new Uint8Array(binString.length);
  for (let i = 0; i < binString.length; i++) {
    bytes[i] = binString.charCodeAt(i);
  }
  return bytes;
}

// Calamus JS bindings (exports stripped, runs as plain script)
${CALAMUS_JS_BINDINGS}

// --- WASM initialization ---
let wasmReady = false;

function initCalamus() {
  if (wasmReady) return;
  const wasmBytes = base64ToBytes(WASM_BASE64);
  initSync({ module: wasmBytes });
  wasmReady = true;
}

// --- Rendering helper ---
function renderPageToCanvas(canvas, noteData, pageIndex, metadata, colorLUT) {
  const width = metadata.page_width;
  const height = metadata.page_height;
  canvas.width = width;
  canvas.height = height;

  const rgba = render_page(noteData, pageIndex);

  // Apply color LUT if provided (remap grayscale pixels)
  if (colorLUT) {
    for (let i = 0; i < rgba.length; i += 4) {
      // Use red channel as grayscale index (source is grayscale so R=G=B)
      const gray = rgba[i];
      rgba[i]     = colorLUT[gray * 3];
      rgba[i + 1] = colorLUT[gray * 3 + 1];
      rgba[i + 2] = colorLUT[gray * 3 + 2];
      // alpha unchanged
    }
  }

  const ctx = canvas.getContext("2d");
  const imageData = new ImageData(new Uint8ClampedArray(rgba.buffer, rgba.byteOffset, rgba.byteLength), width, height);
  ctx.putImageData(imageData, 0, 0);
}
`;
}

/**
 * Returns a JavaScript string that provides theme/color LUT helpers.
 * Must be included after getWasmBootstrapScript().
 *
 * Provides:
 * - getActiveColorLUT(): returns a Uint8Array LUT (768 bytes) or null for identity
 */
export function getThemeBootstrapScript(theme: ResolvedTheme): string {
  return `
// --- Theme color LUT ---
const __theme = ${JSON.stringify(theme)};

function hexToRGB(hex) {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16)
  ];
}

function buildColorLUT(bgHex, fgHex) {
  const bg = hexToRGB(bgHex);
  const fg = hexToRGB(fgHex);
  const lut = new Uint8Array(256 * 3);
  for (let i = 0; i < 256; i++) {
    // i=255 is white (bg), i=0 is black (fg)
    const t = i / 255;
    lut[i * 3]     = Math.round(fg[0] + t * (bg[0] - fg[0]));
    lut[i * 3 + 1] = Math.round(fg[1] + t * (bg[1] - fg[1]));
    lut[i * 3 + 2] = Math.round(fg[2] + t * (bg[2] - fg[2]));
  }
  return lut;
}

function getActiveColorLUT() {
  const isDark = document.documentElement.getAttribute("data-theme") === "dark"
    || window.matchMedia("(prefers-color-scheme: dark)").matches;
  const colors = isDark ? __theme.dark : __theme.light;
  // Skip LUT for identity mapping (black on white)
  if (colors.bg === "#ffffff" && colors.fg === "#000000") return null;
  return buildColorLUT(colors.bg, colors.fg);
}
`;
}
