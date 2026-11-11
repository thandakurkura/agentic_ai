# StyleScent

StyleScent is an AI personal-styling agent built for Nonilion (INNOVORTEX 4.0 hackathon). It plans outfits (colours, patterns, pairings) and matching fragrances grounded in curated datasets and deterministic rules.

## Milestone M0 (Current Status)

This repository currently implements **Milestone M0**:
- Project scaffolding and environment configuration
- LLM wrapper for `@google/genai` (with fallback echo mode when no API key is provided)
- Nonilion stub adapter and normalized data contracts
- Orchestrator skeleton (friendly hello/echo reply)
- Express server with `/health`, `/dev/chat`, and `/webhook/nonilion`
- Interactive terminal chat harness (`npm run chat`)
- Automated tests using native `node:test`

## Requirements

- Node.js >= 20.0.0
- npm >= 10.0.0

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
   *Note: In Milestone M0, `LLM_API_KEY` and `LLM_MODEL` are optional. If unset, StyleScent runs in echo mode.*

3. **Run tests:**
   ```bash
   npm test
   ```

4. **Start the local chat harness:**
   ```bash
   npm run chat
   ```

5. **Start the HTTP server:**
   ```bash
   npm start
   # or for development with auto-reload:
   npm run dev
   ```

## Endpoints

- `GET /health`: Returns service health, uptime, and version (`200 OK`).
- `POST /dev/chat`: Local testing chat endpoint accepting `{ "text": "..." }` (available in non-production).
- `POST /webhook/nonilion`: Nonilion webhook receiver (returns `501 Not Implemented` stub until official Nonilion developer guide is provided).
