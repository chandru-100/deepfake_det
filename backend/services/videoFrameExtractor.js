const fs = require('fs');
const os = require('os');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');

function ffprobeAsync(filePath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, data) => {
      if (err) return reject(err);
      return resolve(data);
    });
  });
}

function extractScreenshotsAsync(videoPath, outputDir, frameCount) {
  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .on('error', (err) => reject(err))
      .on('end', () => {
        const files = fs
          .readdirSync(outputDir)
          .filter((name) => name.endsWith('.jpg'))
          .sort()
          .map((name) => path.join(outputDir, name));
        resolve(files);
      })
      .screenshots({
        count: frameCount,
        filename: 'frame-%i.jpg',
        folder: outputDir,
        size: '640x?',
      });
  });
}

async function extractFramesForAnalysis(videoPath, frameCount = 6) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'deepfake-frames-'));

  let metadata = null;
  try {
    metadata = await ffprobeAsync(videoPath);
  } catch (error) {
    metadata = null;
  }

  const framePaths = await extractScreenshotsAsync(videoPath, tempDir, frameCount);

  const videoStream = metadata?.streams?.find((stream) => stream.codec_type === 'video') || {};

  return {
    framePaths,
    tempDir,
    metadata: {
      duration: Number(metadata?.format?.duration || 0),
      width: Number(videoStream.width || 0),
      height: Number(videoStream.height || 0),
      codec: videoStream.codec_name || 'unknown',
      frameRate: videoStream.r_frame_rate || 'unknown',
    },
  };
}

function cleanupExtractedFrames(tempDir) {
  if (!tempDir || !fs.existsSync(tempDir)) return;
  fs.rmSync(tempDir, { recursive: true, force: true });
}

module.exports = {
  extractFramesForAnalysis,
  cleanupExtractedFrames,
};
