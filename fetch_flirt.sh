#!/bin/bash

flist_js_url="https://raw.githubusercontent.com/wpmed92/WebMRI/master/src/app/src/brainbrowser/volume-viewer/plugins/flirt.js"
flirt_wasm_url="https://github.com/wpmed92/WebMRI/raw/master/src/app/src/brainbrowser/volume-viewer/workers/flirt.wasm"

curl -L -o flirt.js $flist_js_url
curl -L -o flirt.wasm $flirt_wasm_url
sed -i '' -e '1s/^/export /' -e 's/=\"flirt\.wasm\"/=Module["wasmPath"]/g' flirt.js

echo "FLIRT WASM fetched"
