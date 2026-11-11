/**
 * LLM client wrapper module using @google/genai.
 *
 * What: Provides a lightweight abstraction over Google Gen AI SDK for generating text.
 * Why: Isolates LLM provider specifics behind our own interface, avoids hardcoding model IDs,
 * validates required credentials at call time, and enables seamless integration with Gemini.
 */

import { GoogleGenAI } from '@google/genai';
import { config } from './config.js';

let cachedClient = null;

/**
 * Gets or initializes the GoogleGenAI client instance.
 *
 * @returns {GoogleGenAI}
 */
function getClient() {
  if (!config.LLM_API_KEY) {
    throw new Error(
      'LLM_API_KEY is not configured in environment variables. Please provide LLM_API_KEY to call the LLM.'
    );
  }

  if (!cachedClient) {
    cachedClient = new GoogleGenAI({ apiKey: config.LLM_API_KEY });
  }

  return cachedClient;
}

/**
 * Generates text using Google Gen AI SDK (@google/genai).
 *
 * @param {string} prompt - The user prompt to send to the model.
 * @param {object} [options] - Optional generation options.
 * @param {string} [options.system] - System instruction to steer model behavior.
 * @returns {Promise<string>} The generated text response.
 */
export async function generateText(prompt, { system } = {}) {
  if (!config.LLM_MODEL) {
    throw new Error(
      'LLM_MODEL is not configured in environment variables. Please provide LLM_MODEL (e.g. gemini-2.5-flash) to call the LLM.'
    );
  }

  const ai = getClient();

  /** @type {import('@google/genai').GenerateContentParameters} */
  const params = {
    model: config.LLM_MODEL,
    contents: prompt,
  };

  if (system) {
    params.config = {
      systemInstruction: system,
    };
  }

  const response = await ai.models.generateContent(params);
  return response.text ?? '';
}
