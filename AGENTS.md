# AGENTS.md — RAG QMS Demo

## Project
Flashy demo app showing AI-native document/quality management with RAG. Built to impress in a meeting.

## Read First
1. Read `SPEC.md` — the full vision and requirements.

## Tech Rules
- **Tailwind CSS via CDN** — no npm, no build tools
- **Vanilla JS with ES modules** — type="module" in script tags
- Zero dependencies beyond CDN links (Tailwind, maybe D3 for the graph)
- Must look STUNNING — this is a visual demo first
- Serve with `python3 -m http.server`
- Dark theme, glassmorphism, gradients, glow effects everywhere

## Code Style
- Clean, readable JS
- Keep files focused by feature area
- Comments for non-obvious effects/animations
- All fake data in data.js — easy to swap

## Priority
1. Visual impact — make it look like the future
2. AI search demo — the "money shot" that sells the concept
3. Audit trail — the compliance story
4. Everything else is bonus

## When In Doubt
- Flashier is better (for this project)
- Fake it convincingly — mocked AI responses with typing animation
- Don't over-engineer — this is a demo, not a product
- If a shader effect is too complex, use CSS animations instead
