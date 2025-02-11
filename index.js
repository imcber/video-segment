const fs = require("fs");
const path = require("path");
const { Worker, isMainThread, parentPort, workerData } = require("worker_threads");
const ffmpeg = require("fluent-ffmpeg");

if (isMainThread) {
	const inputPath = "/Users/sandyelizalde/Downloads/VID-20250210-WA0005.mp4"; // Ruta del video de entrada
	const outputDir = "output_videos";
	const numVideos = 4;
	const duration = 10; // Duración de cada video en segundos

	if (!fs.existsSync(outputDir)) {
		fs.mkdirSync(outputDir);
	}

	const workers = [];
	for (let i = 0; i < numVideos; i++) {
		const worker = new Worker(__filename, {
			workerData: { inputPath, outputDir, index: i, duration },
		});
		workers.push(worker);
	}

	workers.forEach((worker) => {
		worker.on("message", (msg) => console.log(msg));
		worker.on("error", (err) => console.error(`Error en worker: ${err.message}`));
		worker.on("exit", (code) => {
			if (code !== 0) {
				console.error(`Worker finalizado con código: ${code}`);
			}
		});
	});
} else {
	const { inputPath, outputDir, index, duration } = workerData;
	const outputPath = path.join(outputDir, `output_${index}.mp4`);

	ffmpeg(inputPath)
		.setStartTime(index * duration)
		.setDuration(duration)
		.output(outputPath)
		.on("end", () => parentPort.postMessage(`Video ${index} procesado en ${outputPath}`))
		.on("error", (err) => parentPort.postMessage(`Error en video ${index}: ${err.message}`))
		.run();
}
