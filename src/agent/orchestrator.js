/**
 * StyleScent Agent Orchestrator (Milestone M0).
 *
 * What: Core coordinator for processing user styling requests.
 * Why: Receives NormalizedRequest objects and produces NormalizedResponse outputs.
 * In Milestone M0, it serves as a lightweight harness that greets the user and echoes
 * their text, or makes a single LLM call if credentials are configured, verifying the
 * pipeline end-to-end before complex tools and specialists are added.
 */

import { config } from '../config.js';
import { generateText } from '../llm.js';
import { logger } from '../logger.js';

/**
 * Handles an incoming normalized request and produces a normalized response.
 *
 * @param {import('../nonilion/types.js').NormalizedRequest} normalizedRequest
 * @returns {Promise<import('../nonilion/types.js').NormalizedResponse>}
 */
export async function handleRequest(normalizedRequest) {
  const inputText = normalizedRequest?.text?.trim() ?? '';
  logger.info({ userId: normalizedRequest?.userId, text: inputText }, 'Orchestrator received request');

  // If LLM credentials and model are configured, attempt a simple LLM greeting call
  if (!config.isEchoMode && config.LLM_MODEL) {
    try {
      const systemInstruction =
        'You are StyleScent, an AI personal-styling assistant. Greet the user with a friendly "Hello from StyleScent!" and briefly acknowledge or repeat what they said.';

      const reply = await generateText(inputText, { system: systemInstruction });

      return {
        text: reply,
        files: [],
        images: [],
        progress: ['Received request', 'Processed with LLM', 'Delivered response'],
      };
    } catch (err) {
      logger.warn(
        { err: err.message },
        'LLM call failed in orchestrator; falling back to echo mode reply'
      );
    }
  }

  // Echo mode reply (default for M0 without API key)
  const echoReply = `Hello from StyleScent! You said: "${inputText}".`;

  return {
    text: echoReply,
    files: [],
    images: [],
    progress: ['Received request', 'Echoed response (M0 echo mode)'],
  };
}
