# silverbullet-calamus

A [SilverBullet](https://silverbullet.md) plug for viewing Supernote `.note`
files. Powered by [calamus](https://github.com/Wiskerke/calamus), a Rust/WASM
parser and renderer for the Supernote file format.

## Features

- Open `.note` files in SilverBullet via the document viewer
- Embed notes (or individual pages) in markdown using fenced code blocks
- Self-contained: WASM module is bundled into the plug (<200KB)

## Limitations

This software has only been tested with a recent version of notes created on the Nomad. So it might not work for other devices or older software versions.

Custom templates (backgrounds) are not supported: To reduce the size of the plug, png support in the WASM component was disabled. Adding basic support would be fairly easy, but being able to properly handle color in the custom template conflicts with the theming support. Not considered a priority. 

## Installation

### Configure via CONFIG

Add this block to the CONFIG settings, and perform the action "Plugs: Update". Silverbullet will download the plug from the github assets.

````markdown
```space-lua
config.set {
  plugs = {
    "ghr:Wiskerke/silverbullet-calamus/v0.1.0"
  }
}

config.set("calamus", {
  theme = { bg = "#f0f0f0", fg = "#1a1a1a"},
  theme_darkmode = { bg = "#1a1a1a", fg = "#e0e0e0"}
})
```
````

### Manual

Download `silverbullet-calamus.plug.js` from the github release folder, or build it yourself.
Then copy `silverbullet-calamus.plug.js` to your space's `_plug/` folder and reload.

Note that the action "Plugs: Update" will delete the file.

### Library manager?

I tried to use the new Plug.md and library manager, but I could not get that working with github release assets. So for now I do not recommend this.

## Usage

### Viewing .note files

Upload a `.note` file to your SilverBullet space. Navigate to it with the action `Navigate: Document Picker`. For some example note files, see [testfiles](https://github.com/Wiskerke/calamus/tree/main/testfiles) in the calamus repository.

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
| `theme`          | `fg=#000000, bg=#00AA00` | Colors to use |
| `theme-darkmode` | `fg=#00FF00, bg=#000000` | Colors to use |

Only `file` is required.
Omit `page`/`pages` to show all pages.
Omit `theme` and `theme-darkmode` to use the defaults.

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
