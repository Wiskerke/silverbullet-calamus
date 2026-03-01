---
name: Library/silverbullet-calamus
tags: meta/library
files:
- https://github.com/Wiskerke/silverbullet-calamus/releases/download/v0.1.0/silverbullet-calamus.plug.js
---
A plug for viewing Supernote `.note` files. 
Powered by [calamus](https://github.com/Wiskerke/calamus), a Rust/WASM
parser and renderer for the Supernote file format.

It supports both opening the note file via the Document Picker or displaying note
pages inside a markdown document.

## Markdown examples

    ```note
    file: test.note
    ```

### Showing only specific pages

Only show the first page of test.note:
    ```note
    file: test.note
    page: 1
    ```

Show pages 1-3 and 5:
    ```note
    file: test.note
    pages: 1-3, 5
    ```

### Theming

There is support for theming, to configure the foreground and background color.
    ```note
    file: test.note
    theme: fg=#000000, bg=#00AA00
    theme-darkmode: fg=#00FF00, bg=#000000
    ```

## Configuration in the CONFIG page

It is possible to configure the theme in general via the CONFIG page. This is then used for both the editor and the widgets (unless the widget overrules the theme.)

    ```space-lua
    config.set("calamus", {
      theme = { bg = "#f0f0f0", fg = "#1a1a1a"},
      theme_darkmode = { bg = "#1a1a1a", fg = "#e0e0e0"}
    })
    ```

## Known limitations

This software has only been tested with a recent version of notes created on the Nomad. So it might not work for other devices or older software versions.

Custom templates (backgrounds) are not supported: To reduce the size of the plug, png support in the WASM component was disabled. Adding basic support would be fairly easy, but being able to properly handle color in the custom template conflicts with the theming support.
