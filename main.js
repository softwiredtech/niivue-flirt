import { Niivue, NVImage } from '@niivue/niivue'
import FlirtWorker from "./worker?worker"
import flirtWasm from "./flirt.wasm?url"

let referenceVolumeBuffer = null
let inputVolumeBuffer = null
let processing = false
let volumePositions = {}
function fixWasmUrl(flirtWasmUrl) {
    let idDoubleSlash = flirtWasmUrl.lastIndexOf("//");
    let idLastSlash =  flirtWasmUrl.lastIndexOf("/");

    return flirtWasmUrl.substring(0, idDoubleSlash) + "/" + flirtWasmUrl.substring(idLastSlash+1, flirtWasmUrl.length);
}

function processImage(worker, input, reference) {
    processing = true;
    document.getElementById("options").innerHTML = "Processing...";
    let args = ["-in", "vol.nii", "-ref", "vol_ref.nii", "-out", "out/vol_reg.nii"].concat(getCLIArgumentsFromModal());
    console.log(args);
    worker.postMessage({files: [{name: "vol.nii", data: new Uint8Array(input)}, {name: "vol_ref.nii", data: new Uint8Array(reference)}], args: args, wasmPath: fixWasmUrl(flirtWasm)});
}


function initFlirtWorker(nv, worker) {
    worker.addEventListener("message", async function(e) {
        nv.setVolume(new NVImage(e.data[0].data), volumePositions["in"]);
        processing = false;
        document.getElementById("options").innerHTML = "Options";
    });
	
    worker.addEventListener("onerror", function(error) {
        console.log(error.message);
        processing = false;
        document.getElementById("options").innerHTML = "Options";
    });
}

async function handleFileSelection(volId, event, nv) {
    const file = event.target.files[0];

    if (file) {
        let volume = await NVImage.loadFromFile(file);

        if (volumePositions[volId] === undefined) {
            volumePositions[volId] = nv.volumes.length;
            nv.addVolume(volume);
        } else {
            nv.removeVolume(nv.volumes[volumePositions[volId]]);
            nv.addVolume(volume);
            nv.setVolume(volume, volumePositions[volId]);
        }

        if (nv.volumes.length == 2) {
            document.getElementById("sliderContainer").classList.remove("hidden");
        }

        const reader = new FileReader();
        reader.onload = function(fileEvent) {
            if (volId === "ref") {
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
    const canvas = document.getElementById('gl');
    const worker = new FlirtWorker();
    const nv = new Niivue();

    document.getElementById("fileSelectionInput").addEventListener("click", (e) => {
        e.preventDefault();
        if (processing) { return; }
        fileInput.value = null;
        fileInput.click();
    });

    document.getElementById("fileSelectionReference").addEventListener("click", (e) => {
        e.preventDefault();
        if (processing) { return; }
        fileReference.vaue = null;
        fileReference.click();
    });

    document.getElementById("runFlirt").addEventListener("click", (e) => {
        e.preventDefault();
        processImage(worker, inputVolumeBuffer);
        modal.style.display = 'none';
    });

    fileReference.addEventListener("change", (event) => handleFileSelection("ref", event, nv));
    fileInput.addEventListener("change", (event) => handleFileSelection("in", event, nv));

    const modal = document.getElementById('flirtModal');
    const closeModalButton = document.getElementById('closeModal');
    
    document.getElementById("options").addEventListener("click", function(e) {
        e.preventDefault();
        if (processing) { return; }
        modal.style.display = 'block';
    });

    closeModalButton.addEventListener("click", function() {
        modal.style.display = 'none';
    });

    initFlirtWorker(nv, worker);
    nv.attachToCanvas(canvas);

    volumeSelector.oninput = function () {
        let opacity = this.value / 100;
        nv.setOpacity(volumePositions["in"], opacity);
        nv.setOpacity(volumePositions["ref"], 1.0-opacity);
    };

    runFlirt.addEventListener("click", function(e) {
        processImage(worker, inputVolumeBuffer, referenceVolumeBuffer);
    });
}
