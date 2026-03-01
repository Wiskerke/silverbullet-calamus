sb_dir := env("SB_DIR", "/var/lib/silverbullet")
calamus_version := "v0.1.0"
calamus_url := "https://github.com/Wiskerke/calamus/releases/download/" + calamus_version + "/calamus-wasm-" + calamus_version + ".tar.gz"

download-calamus-wasm:
    mkdir -p vendor/calamus-wasm
    curl -fsSL "{{calamus_url}}" | tar xz -C vendor/calamus-wasm

build:
    [ -d node_modules ] || npm install
    [ -f vendor/calamus-wasm/calamus_wasm_bg.wasm ] || just download-calamus-wasm
    npx tsx scripts/build.ts

install: build
    sudo install -d -o silverbullet -g silverbullet "{{sb_dir}}/_plug"
    sudo install -o silverbullet -g silverbullet -m 644 silverbullet-calamus.plug.js "{{sb_dir}}/_plug/silverbullet-calamus.plug.js"

uninstall:
    sudo rm -f "{{sb_dir}}/_plug/silverbullet-calamus.plug.js"

clean:
    rm -f silverbullet-calamus.plug.js
