import { Niivue, NVImage } from '@niivue/niivue'
import FlirtWorker from "./worker?worker"
import flirtWasm from "./flirt.wasm?url"

let referenceVolumeBuffer = null
let inputVolumeBuffer = null

function fixWasmUrl(flirtWasmUrl) {
    let idDoubleSlash = flirtWasmUrl.lastIndexOf("//");
    let idLastSlash =  flirtWasmUrl.lastIndexOf("/");

    return flirtWasmUrl.substring(0, idDoubleSlash) + "/" + flirtWasmUrl.substring(idLastSlash+1, flirtWasmUrl.length);
}

function processImage(worker, input, reference) {
    let args = ["-in", "vol.nii", "-ref", "vol_ref.nii", "-out", "out/vol_reg.nii"].concat(getCLIArgumentsFromModal());
    console.log(args);
    worker.postMessage({files: [{name: "vol.nii", data: new Uint8Array(input)}, {name: "vol_ref.nii", data: new Uint8Array(reference)}], args: args, wasmPath: fixWasmUrl(flirtWasm)});
}

function setVolume(nv, buffer) {
    let vol = new NVImage(buffer);
    nv.setVolume(vol, 0);
}

function initFlirtWorker(nv, worker) {
    worker.addEventListener("message", async function(e) {
        setVolume(nv, e.data[0].data);
    });
	
    worker.addEventListener("onerror", function(error) {
        console.log(error.message);
    });
}

async function handleFileSelection(reference, event, nv) {
    const file = event.target.files[0];

    if (file) {
        let volume = await NVImage.loadFromFile(file);
        nv.setVolume(volume, 0);
        const reader = new FileReader();
        reader.onload = function(fileEvent) {
            if (reference) {
                referenceVolumeBuffer = fileEvent.target.result;
            } else {
                inputVolumeBuffer = fileEvent.target.result;
            }
        };
        reader.readAsArrayBuffer(file);
    }
}

function getCLIArgumentsFromModal() {
    const form = document.getElementById('flirtForm');
    const selects = form.querySelectorAll('select');
    const params = [];

    for(let select of selects) {
        const value = select.options[select.selectedIndex].value;
        params.push("-" + select.name);
        params.push(value);
    }

    return params;
}

 window.onload = async () => {
    console.log(getCLIArgumentsFromModal());
    const canvas = document.getElementById('gl');
    const worker = new FlirtWorker();
    const nv = new Niivue();

    document.getElementById("fileSelectionInput").addEventListener("click", (e) => {
        e.preventDefault();
        fileInput.click();
    });

    document.getElementById("fileSelectionReference").addEventListener("click", (e) => {
        e.preventDefault();
        fileReference.click();
    });

    document.getElementById("runFlirt").addEventListener("click", (e) => {
        e.preventDefault();
        processImage(worker, inputVolumeBuffer);
        modal.style.display = 'none';
    });

    fileInput.addEventListener("change", (event) => handleFileSelection(/*reference*/false, event, nv));
    fileReference.addEventListener("change", (event) => handleFileSelection(/*reference*/true, event, nv));

    const modal = document.getElementById('flirtModal');
    const closeModalButton = document.getElementById('closeModal');
    
    document.getElementById("options").addEventListener("click", function(e) {
        e.preventDefault();
        modal.style.display = 'block';
    });

    closeModalButton.addEventListener("click", function() {
        modal.style.display = 'none';
    });

    initFlirtWorker(nv, worker);
    nv.attachToCanvas(canvas);

    runFlirt.addEventListener("click", function(e) {
        processImage(worker, inputVolumeBuffer, referenceVolumeBuffer);
    });
}
