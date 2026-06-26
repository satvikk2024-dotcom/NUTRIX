const { Ollama } = require('ollama');

const ollama = new Ollama({ host: process.env.OLLAMA_HOST || 'http://localhost:11434' });

const VISION_MODEL = process.env.OLLAMA_VISION_MODEL || 'llava:7b';
const TEXT_MODEL = process.env.OLLAMA_TEXT_MODEL || 'qwen2.5:7b';
const OLLAMA_TIMEOUT = 90000;
const TEXT_TIMEOUT = 45000;

const extractJSON = (text) => {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) text = fenced[1];
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('No JSON found in response');

  let jsonStr = text.slice(start, end + 1);
  try {
    return JSON.parse(jsonStr);
  } catch {
    // LLMs sometimes produce trailing commas, unescaped newlines in strings,
    // or comments — attempt common fixups before giving up.
    jsonStr = jsonStr
      .replace(/,\s*([}\]])/g, '$1')       // trailing commas
      .replace(/[\x00-\x1f]/g, ' ')        // control chars inside strings
      .replace(/\\'/g, "'");               // escaped single quotes
    return JSON.parse(jsonStr);
  }
};

const withTimeout = (promise, ms) => {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('Ollama request timed out')), ms)),
  ]);
};

const isOllamaRunning = async () => {
  try {
    await withTimeout(ollama.list(), 3000);
    return true;
  } catch {
    return false;
  }
};

const analyzeImage = async (base64Image, prompt) => {
  const response = await withTimeout(
    ollama.chat({
      model: VISION_MODEL,
      messages: [{ role: 'user', content: prompt, images: [base64Image] }],
    }),
    OLLAMA_TIMEOUT
  );
  return extractJSON(response.message.content);
};

const generateText = async (prompt) => {
  const response = await withTimeout(
    ollama.chat({
      model: TEXT_MODEL,
      messages: [{ role: 'user', content: prompt }],
    }),
    TEXT_TIMEOUT
  );
  return extractJSON(response.message.content);
};

module.exports = { ollama, analyzeImage, generateText, isOllamaRunning };
