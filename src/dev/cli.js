/**
 * Terminal Chat Harness CLI.
 *
 * What: Interactive CLI that lets developers chat directly with the StyleScent orchestrator.
 * Why: Provides an immediate feedback loop for testing the agent locally without requiring
 * an external chat platform, webhook tunnels, or Nonilion import in early milestones.
 */

import readline from 'node:readline/promises';
import { handleRequest } from '../agent/orchestrator.js';
import { config } from '../config.js';

async function main() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log('========================================================');
  console.log(' StyleScent CLI Chat (Milestone M0)');
  console.log(` Mode: ${config.isEchoMode ? 'Echo Mode (no LLM key configured)' : 'LLM Mode'}`);
  console.log(' Type your message and press Enter.');
  console.log(" Type 'exit' or 'quit' to stop.");
  console.log('========================================================\n');

  try {
    while (true) {
      const input = await rl.question('You > ');
      const trimmed = input.trim();

      if (!trimmed) {
        continue;
      }

      if (trimmed.toLowerCase() === 'exit' || trimmed.toLowerCase() === 'quit') {
        console.log('Goodbye!');
        break;
      }

      try {
        const response = await handleRequest({
          text: trimmed,
          userId: 'cli-user',
          channel: 'terminal',
        });

        console.log(`\nStyleScent > ${response.text}\n`);
      } catch (err) {
        console.error(`\nError: ${err.message}\n`);
      }
    }
  } finally {
    rl.close();
  }
}

main().catch((err) => {
  console.error('Fatal CLI error:', err);
  process.exit(1);
});
