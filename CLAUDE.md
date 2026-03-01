# silverbullet-calamus

SilverBullet plug for viewing Supernote `.note` files. Uses the calamus WASM
library to parse and render notebook pages.

## Architecture

- **Worker runtime** (`src/worker-runtime.ts`): Minimal SilverBullet message
  protocol handler. Dispatches function calls and forwards syscalls.
- **Code widget** (`src/widget.ts`): Handles ````note` fenced blocks. Returns
  `{html, script}` where the script runs in an iframe with canvas access.
- **Document editor** (`src/editor.ts`): Registers for `.note` files. Returns
  full HTML + script for an iframe viewer.
- **WASM embed** (`src/wasm-embed.ts`): Generates the JavaScript bootstrap
  string that initializes calamus WASM in iframes.
- **Build script** (`scripts/build.ts`): Reads calamus WASM + JS bindings,
  generates `src/generated/wasm-bundle.ts`, then bundles with esbuild into a
  single ESM `.plug.js` file.

## Build

```
just build   # auto-runs npm install and downloads calamus WASM if needed
```

To use a local calamus build: `CALAMUS_PKG=../calamus/wasm/pkg just build`

## Install / Uninstall

```sh
just install      # build and copy plug to SilverBullet notes folder
just uninstall    # remove plug from SilverBullet notes folder
```

Installs to `/var/lib/silverbullet/_plug/` by default (standard NixOS path).
Override with `SB_DIR` env var for a different notes folder.

Note: Flake.nix contains python3 and uv, for ease of use by claude.

## Output format

`silverbullet-calamus.plug.js` is an ESM bundle that exports `plug` with
`manifest` and `functionMapping`, matching the format produced by SilverBullet's
`plug-compile.js`. Includes a minimal worker runtime shim.
