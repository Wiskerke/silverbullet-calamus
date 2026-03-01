# silverbullet-calamus

A [SilverBullet](https://silverbullet.md) plug for viewing Supernote `.note`
files. Powered by [calamus](https://github.com/Wiskerke/calamus), a Rust/WASM
parser and renderer for the Supernote file format.

## Features

- Open `.note` files in SilverBullet via the document viewer
- Embed notes (or individual pages) in markdown using fenced code blocks
- Self-contained: WASM module is bundled into the plug (<200KB)

## Installation

### From library (recommended)

Add to your SilverBullet space's `SETTINGS` page:

```yaml
libraries:
- import: "https://raw.githubusercontent.com/Wiskerke/silverbullet-calamus/main/"
```

### Manual

Copy `silverbullet-calamus.plug.js` to your space's `_plug/` folder and reload.

## Usage

### Viewing .note files

Upload a `.note` file to your SilverBullet space. Navigate to it with the Document Picker. 

### Inline embedding

Use a fenced code block to embed pages in any markdown document:

````markdown
```note
file: mynotebook.note
page: 2
```
````

Options:

| Key     | Example         | Description                     |
|---------|-----------------|---------------------------------|
| `file`  | `notes/hw.note` | Path to the file (required)     |
| `page`  | `3`             | Single page (1-indexed)         |
| `pages` | `1-3` or `1,3,5`| Page range or list              |
| 'theme'          | `fg=#000000, bg=#00AA00` | Colors to use |
| 'theme-darkmode' | 'fg=#00FF00, bg=#000000' | Colors to use |


Omit `page`/`pages` to show all pages.

### Settings

Configure the default theme by adding a bit of space-lua in the CONFIG file.

    ```space-lua
    config.set("calamus", {
        theme = { bg = "#f0f0f0", fg = "#1a1a1a"},
        theme_darkmode = { bg = "#1a1a1a", fg = "#e0e0e0"}
    })
    ```
  
## Building from source

Easiest is to use [Nix](https://nixos.org/) with flakes enabled:

```sh
# Enter dev shell
direnv allow  # or: nix develop

# Build (auto-downloads calamus WASM and runs npm install if needed)
just build
```

You can also download the calamus WASM separately or update it:

```sh
just download-calamus-wasm
```

To use a local calamus build instead, set `CALAMUS_PKG`:

```sh
CALAMUS_PKG=../calamus/wasm/pkg just build
```
