# Setup Environment Directive

This directive outlines how to maintain the 3-layer agentic architecture.

## Goals
- Ensure the separation of concerns between Directives, Orchestration, and Execution.
- Keep the system deterministic and reliable.

## 3-Layer Architecture Overview

1. **Layer 1: Directives** (`directives/`)
   - High-level SOPs written in Markdown.
   - Define WHAT to do.
   - Examples: `scrape_website.md`, `deploy_app.md`.

2. **Layer 2: Orchestration** (Agentic AI)
   - Intelligent routing and decision-making.
   - Reads directives and calls execution scripts.
   - Handles errors and self-anneals.

3. **Layer 3: Execution** (`execution/`)
   - Deterministic Python scripts.
   - Perform the actual work (API calls, file I/O, etc.).
   - Use environment variables from `.env`.

## Maintenance Rules
- Never perform complex tasks directly; always check for an existing directive or script first.
- If a script fails, fix it and update the directive with new knowledge (self-annealing).
- All intermediate data must be stored in `.tmp/` and should be considered ephemeral.
