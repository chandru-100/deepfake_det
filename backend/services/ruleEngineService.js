const fs = require('fs');
const path = require('path');
const exifParser = require('exif-parser');
const Jimp = require('jimp');

function clampScore(value) {
  return Math.max(0, Math.min(100, value));
}

function variance(values) {
  if (!values.length) return 0;
  const mean = values.reduce((acc, value) => acc + value, 0) / values.length;
  return values.reduce((acc, value) => acc + (value - mean) ** 2, 0) / values.length;
}

function computeLaplacianVariance(grayPixels, width, height) {
  const responses = [];
  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const center = grayPixels[y * width + x];
      const up = grayPixels[(y - 1) * width + x];
      const down = grayPixels[(y + 1) * width + x];
      const left = grayPixels[y * width + (x - 1)];
      const right = grayPixels[y * width + (x + 1)];
      const value = up + down + left + right - 4 * center;
      responses.push(value);
    }
  }
  return variance(responses);
}

function computeBoundaryArtifactScore(grayPixels, width, height) {
  let boundaryDiff = 0;
  let boundaryCount = 0;
  let regularDiff = 0;
  let regularCount = 0;

  for (let y = 0; y < height; y += 1) {
    for (let x = 1; x < width; x += 1) {
      const diff = Math.abs(grayPixels[y * width + x] - grayPixels[y * width + (x - 1)]);
      if (x % 8 === 0) {
        boundaryDiff += diff;
        boundaryCount += 1;
      } else {
        regularDiff += diff;
        regularCount += 1;
      }
    }
  }

  for (let y = 1; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const diff = Math.abs(grayPixels[y * width + x] - grayPixels[(y - 1) * width + x]);
      if (y % 8 === 0) {
        boundaryDiff += diff;
        boundaryCount += 1;
      } else {
        regularDiff += diff;
        regularCount += 1;
      }
    }
  }

  const boundaryMean = boundaryCount ? boundaryDiff / boundaryCount : 0;
  const regularMean = regularCount ? regularDiff / regularCount : 1;
  const ratio = boundaryMean / Math.max(1, regularMean);

  if (ratio <= 1.05) return 90;
  if (ratio <= 1.15) return 75;
  if (ratio <= 1.3) return 55;
  if (ratio <= 1.5) return 35;
  return 20;
}

function computeAspectRatioScore(width, height) {
  if (!width || !height) return 45;

  const ratio = width / height;
  let score = 100;

  if (width < 320 || height < 320) score -= 35;
  if (width > 8000 || height > 8000) score -= 20;
  if (ratio < 0.5 || ratio > 2.4) score -= 30;
  if ((width * height) < 250000) score -= 15;

  return clampScore(score);
}

function computeFacialConsistencyScore(grayPixels, width, height) {
  // Heuristic central bilateral symmetry check as a lightweight face consistency proxy.
  const leftStart = Math.floor(width * 0.2);
  const rightEnd = Math.floor(width * 0.8);
  const yStart = Math.floor(height * 0.2);
  const yEnd = Math.floor(height * 0.8);

  let diffTotal = 0;
  let count = 0;

  for (let y = yStart; y < yEnd; y += 1) {
    for (let x = leftStart; x < Math.floor(width / 2); x += 1) {
      const mirrorX = width - 1 - x;
      if (mirrorX >= rightEnd) continue;
      const leftPixel = grayPixels[y * width + x];
      const rightPixel = grayPixels[y * width + mirrorX];
      diffTotal += Math.abs(leftPixel - rightPixel);
      count += 1;
    }
  }

  const meanDiff = count ? diffTotal / count : 60;
  if (meanDiff < 18) return 88;
  if (meanDiff < 26) return 75;
  if (meanDiff < 35) return 62;
  if (meanDiff < 45) return 48;
  return 35;
}

function parseMetadataScore(filePath, fileBuffer) {
  const ext = path.extname(filePath).toLowerCase();
  const sizeBytes = fs.statSync(filePath).size;
  let score = 80;
  const notes = [];
  let forceZero = false;

  if (sizeBytes < 12 * 1024) {
    score -= 35;
    notes.push('Very small file size for visual media');
  }
  if (sizeBytes > 30 * 1024 * 1024) {
    score -= 20;
    notes.push('Unusually large file size');
  }

  if (['.jpg', '.jpeg'].includes(ext)) {
    try {
      const parser = exifParser.create(fileBuffer);
      const exif = parser.parse();
      if (!exif.tags || Object.keys(exif.tags).length === 0) {
        score = 0;
        forceZero = true;
        notes.push('CRITICAL: Missing EXIF tags on JPEG (indicates AI generation or stripping)');
      }
      if (exif.tags && exif.tags.Software) {
        const software = String(exif.tags.Software).toLowerCase();
        if (/(stable diffusion|midjourney|adobe|faceapp|deepface|remini|photoshop ai)/.test(software)) {
          score = 0;
          forceZero = true;
          notes.push(`CRITICAL: Generative AI / Editing software tag detected: ${software}`);
        }
      }
    } catch (error) {
      score = 0;
      forceZero = true;
      notes.push('CRITICAL: Unreadable EXIF metadata');
    }
  }

  return {
    score: clampScore(score),
    notes,
    forceZero
  };
}

async function runStrictRuleEngine(filePath, mimeType) {
  const fileBuffer = fs.readFileSync(filePath);
  const metadataResult = parseMetadataScore(filePath, fileBuffer);

  let laplacianVar = 0;
  let blurScore = 100;
  let compressionScore = 100;
  let resolutionAspectScore = 100;
  let facialConsistencyScore = 100;
  let width = 0;
  let height = 0;

  try {
    const image = await Jimp.read(fileBuffer);
    image.grayscale();

    width = image.bitmap.width;
    height = image.bitmap.height;
    const grayPixels = new Array(width * height);

    for (let i = 0; i < width * height; i += 1) {
      grayPixels[i] = image.bitmap.data[i * 4];
    }

    laplacianVar = computeLaplacianVariance(grayPixels, width, height);
    if (laplacianVar < 18) blurScore = 20;
    else if (laplacianVar < 35) blurScore = 40;
    else if (laplacianVar < 70) blurScore = 60;
    else if (laplacianVar < 120) blurScore = 80;

    compressionScore = computeBoundaryArtifactScore(grayPixels, width, height);
    resolutionAspectScore = computeAspectRatioScore(width, height);
    facialConsistencyScore = computeFacialConsistencyScore(grayPixels, width, height);
  } catch (err) {
    // Unsupported image format by Jimp (e.g. webp) or corrupted
    blurScore = 50;
    compressionScore = 50;
    resolutionAspectScore = 50;
    facialConsistencyScore = 50;
  }

  let finalRuleScore = clampScore(
    metadataResult.score * 0.25 +
      blurScore * 0.2 +
      compressionScore * 0.2 +
      resolutionAspectScore * 0.2 +
      facialConsistencyScore * 0.15
  );

  // Apply critical override
  if (metadataResult.forceZero) {
    finalRuleScore = 0;
  }

  return {
    score: finalRuleScore,
    forceZero: metadataResult.forceZero,
    checks: {
      metadataAnalysis: {
        score: metadataResult.score,
        notes: metadataResult.notes,
      },
      blurDetection: {
        score: blurScore,
        laplacianVariance: Number(laplacianVar.toFixed(2)),
      },
      compressionArtifacts: {
        score: compressionScore,
      },
      resolutionAspectRatio: {
        score: resolutionAspectScore,
        width,
        height,
        aspectRatio: Number((width / Math.max(1, height)).toFixed(3)),
      },
      facialConsistency: {
        score: facialConsistencyScore,
        method: 'central-bilateral-symmetry-heuristic',
      },
      mimeType: mimeType || 'unknown',
    },
  };
}

module.exports = {
  runStrictRuleEngine,
};
