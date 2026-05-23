const { runAllHfModels } = require('./hfModelService');
const { runStrictRuleEngine } = require('./ruleEngineService');
const {
  extractFramesForAnalysis,
  cleanupExtractedFrames,
} = require('./videoFrameExtractor');

const MODEL_WEIGHTS = {
  'umm-maybe/AI-image-detector': 60,
};

const RULE_ENGINE_WEIGHT = 40;

function clampScore(value) {
  return Math.max(0, Math.min(100, value));
}

function scoreToStatus(score) {
  if (score >= 85) return 'Real';
  if (score >= 75) return 'Almost Real';
  if (score >= 45) return 'Suspicious';
  return 'Fake';
}

function combineWeightedScores(hfResults, ruleScore) {
  const components = [];

  for (const result of hfResults) {
    const weight = MODEL_WEIGHTS[result.model] || 0;
    if (!weight) continue;

    components.push({
      name: result.model,
      source: 'huggingface-model',
      weight,
      score: result.success ? result.authenticityScore : null,
      available: result.success,
      error: result.success ? null : result.error,
    });
  }

  components.push({
    name: 'strict-rule-engine',
    source: 'forensic-rules',
    weight: RULE_ENGINE_WEIGHT,
    score: ruleScore,
    available: true,
    error: null,
  });

  const available = components.filter((item) => item.available && typeof item.score === 'number');
  const totalAvailableWeight = available.reduce((acc, item) => acc + item.weight, 0);

  if (totalAvailableWeight === 0) {
    return {
      finalScore: 0,
      components,
      normalization: {
        fallbackApplied: true,
        totalAvailableWeight: 0,
      },
    };
  }

  const finalScore = available.reduce(
    (acc, item) => acc + (item.score * item.weight) / totalAvailableWeight,
    0
  );

  return {
    finalScore: clampScore(finalScore),
    components,
    normalization: {
      fallbackApplied: totalAvailableWeight < 100,
      totalAvailableWeight,
    },
  };
}

async function analyzeImageWithHybridEnsemble(filePath, mimeType) {
  const [hfOutput, ruleOutput] = await Promise.all([
    runAllHfModels(filePath, mimeType),
    runStrictRuleEngine(filePath, mimeType),
  ]);

  const weighted = combineWeightedScores(hfOutput.results, ruleOutput.score);
  let finalScore = weighted.finalScore;

  // CRITICAL METADATA OVERRIDE
  // If the Forensic Rule Engine detected 100% evidence of generative AI or stripped EXIF,
  // we completely override the Hugging Face AI models (which can be easily tricked).
  let statusStr = scoreToStatus(finalScore);
  if (ruleOutput.forceZero) {
    finalScore = 0;
    statusStr = 'Fake';
  }

  return {
    mediaType: 'image',
    authenticityScore: Number(finalScore.toFixed(2)),
    status: statusStr,
    aiVerificationReport: {
      summary: {
        weightedAuthenticityScore: Number(finalScore.toFixed(2)),
        status: statusStr,
        criticalOverrideApplied: ruleOutput.forceZero || false,
      },
      weightedFormula: {
        model1: {
          name: 'umm-maybe/AI-image-detector',
          weightPercent: 60,
        },
        ruleEngine: {
          name: 'strict-rule-engine',
          weightPercent: 40,
        },
      },
      normalization: weighted.normalization,
      components: weighted.components,
      ruleEngineDetails: ruleOutput.checks,
      modelRawOutputs: hfOutput.results.map((item) => ({
        model: item.model,
        success: item.success,
        predictions: item.predictions,
        error: item.error || null,
      })),
    },
  };
}

async function analyzeVideoWithHybridEnsemble(filePath, mimeType) {
  const extracted = await extractFramesForAnalysis(filePath, 6);
  const frameReports = [];

  try {
    for (const framePath of extracted.framePaths) {
      const frameResult = await analyzeImageWithHybridEnsemble(framePath, 'image/jpeg');
      frameReports.push({
        frame: framePath.split('/').pop(),
        authenticityScore: frameResult.authenticityScore,
        status: frameResult.status,
      });
    }

    const meanFrameScore =
      frameReports.reduce((acc, frame) => acc + frame.authenticityScore, 0) /
      Math.max(1, frameReports.length);

    const score = clampScore(meanFrameScore);

    return {
      mediaType: 'video',
      authenticityScore: Number(score.toFixed(2)),
      status: scoreToStatus(score),
      aiVerificationReport: {
        summary: {
          weightedAuthenticityScore: Number(score.toFixed(2)),
          status: scoreToStatus(score),
          analyzedFrames: frameReports.length,
        },
        videoMetadata: extracted.metadata,
        frameReports,
      },
    };
  } finally {
    cleanupExtractedFrames(extracted.tempDir);
  }
}

async function analyzeMediaHybrid(filePath, mediaType, mimeType) {
  if (mediaType === 'video') {
    return analyzeVideoWithHybridEnsemble(filePath, mimeType);
  }
  return analyzeImageWithHybridEnsemble(filePath, mimeType);
}

module.exports = {
  analyzeMediaHybrid,
};
