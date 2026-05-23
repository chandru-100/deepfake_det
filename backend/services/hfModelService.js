const fs = require('fs');
const axios = require('axios');

const HF_MODELS = [
  'umm-maybe/AI-image-detector'
];

function clampScore(value) {
  return Math.max(0, Math.min(100, value));
}

function normalizeAuthenticityFromPredictions(predictions) {
  if (!Array.isArray(predictions) || predictions.length === 0) {
    return null;
  }

  const normalized = predictions.map((p) => ({
    label: String(p.label || '').toLowerCase(),
    score: Number(p.score || 0),
  }));

  const real = normalized.find((p) =>
    ['real', 'authentic', 'genuine', 'human', 'original'].some((k) => p.label.includes(k))
  );
  if (real) {
    return clampScore(real.score * 100);
  }

  const fake = normalized.find((p) =>
    ['fake', 'deepfake', 'ai', 'synthetic', 'generated', 'manipulated'].some((k) => p.label.includes(k))
  );
  if (fake) {
    return clampScore((1 - fake.score) * 100);
  }

  const top = normalized[0];
  if (['fake', 'deepfake', 'ai', 'synthetic', 'generated', 'manipulated'].some((k) => top.label.includes(k))) {
    return clampScore((1 - top.score) * 100);
  }

  return clampScore(top.score * 100);
}

const { HfInference } = require('@huggingface/inference');

async function querySingleModel(model, fileBuffer, mimeType, apiKey) {
  const hf = new HfInference(apiKey);
  const blob = new Blob([fileBuffer], { type: mimeType || 'image/jpeg' });
  
  // The official SDK handles routing, retries, and parameters automatically
  const predictions = await hf.imageClassification({
    model: model,
    data: blob
  });

  const authenticityScore = normalizeAuthenticityFromPredictions(predictions);

  return {
    model,
    success: authenticityScore !== null,
    authenticityScore,
    predictions,
  };
}

async function runAllHfModels(filePath, mimeType) {
  const apiKey = process.env.HF_API_KEY;
  const results = [];

  if (!apiKey || apiKey === 'your_huggingface_api_key_here') {
    return {
      models: HF_MODELS,
      results: HF_MODELS.map((model) => ({
        model,
        success: false,
        authenticityScore: null,
        predictions: [],
        error: 'Missing or invalid HF_API_KEY',
      })),
    };
  }

  const fileBuffer = fs.readFileSync(filePath);

  for (const model of HF_MODELS) {
    try {
      const result = await querySingleModel(model, fileBuffer, mimeType, apiKey);
      results.push(result);
    } catch (error) {
      results.push({
        model,
        success: false,
        authenticityScore: null,
        predictions: [],
        error: error?.response?.data?.error || error.message || 'Unknown Hugging Face error',
      });
    }
  }

  return {
    models: HF_MODELS,
    results,
  };
}

module.exports = {
  HF_MODELS,
  runAllHfModels,
};
