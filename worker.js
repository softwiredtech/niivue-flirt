import { fsl_run } from "./flirt.js"

self.addEventListener("message", function(event) {
  var FSLFlirtModule = {
	  passBack: function (flirtOutput) {
		self.postMessage(flirtOutput);
	  },
	  
	  files: event.data.files,
	  arguments: event.data.args,
	  outputDirectory: "out",
	  wasmPath: event.data.wasmPath,
	  TOTAL_MEMORY: 956301312
  };
  
  fsl_run(FSLFlirtModule);
});