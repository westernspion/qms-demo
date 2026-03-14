# RAG QMS Demo — SPEC.md

## Vision
A flashy, visually stunning demo app that shows what AI-native document/quality management looks like. This replaces the "document repository + esoteric automation" paradigm with RAG + AI agents. Built to impress a boss in a meeting.

**This is a DEMO, not a product.** Fake data, mocked AI responses, all vibes. The goal is to sell the vision.

## Tech Stack
- **Single HTML file** or minimal files — easy to run/share
- **Tailwind CSS** (CDN) — modern, clean UI
- **Vanilla JS** — no build tools
- **WebGL/CSS shader effects** — the flashy part. Animated gradients, glassmorphism, particle backgrounds, glow effects
- Serve with `python3 -m http.server`

## Core Demo Screens

### 1. Landing / Dashboard
- Dark theme, sleek glassmorphism panels
- Animated gradient mesh background (CSS/WebGL shader)
- Stats cards with counters: Documents, Active CAPAs, Compliance Score, Pending Reviews
- Activity feed showing recent AI actions ("AI auto-classified SOP-2024-031", "CAPA-089 root cause analysis generated")
- Animated particles or floating nodes connecting in the background (knowledge graph visual)

### 2. AI Search (The Money Shot)
- Big search bar front and center with glow effect
- User types a natural language query like "What are our nonconformance trends for supplier X in Q4?"
- **Animated typing response** — AI streams back a synthesized answer with citations
- Citations link to source documents with highlighted relevant passages
- Side panel shows "Sources Used" with relevance scores and document previews
- Compare this to: "In ETQ you'd click through 14 screens and export to Excel"

### 3. Document Intelligence
- Upload area (mock — just shows a sample doc)
- AI auto-extracts: document type, regulatory references, key entities, action items
- Visual classification with confidence scores
- Auto-suggested tags, cross-references to related docs
- Shader effect: document "scanning" animation with glowing lines

### 4. CAPA / Workflow Agent
- Show a nonconformance report
- AI generates: root cause analysis, corrective actions, preventive actions, risk assessment
- Timeline visualization of the workflow
- "AI Confidence" indicators on each generated section
- One-click approve/modify workflow

### 5. Access & Audit Trail
- Clean table showing who accessed what, when, with what permissions
- Role-based access visualization (org chart style or matrix)
- Every AI action logged with full provenance
- "21 CFR Part 11 Ready" badge (for the compliance crowd)
- Audit trail entries show: User, Action, Document, AI Involvement, Timestamp, Digital Signature status

### 6. Knowledge Graph (Wow Factor)
- Interactive node graph visualization
- Documents, people, processes, regulations as connected nodes
- Animated edges showing relationships
- Click a node to see connections fan out
- Show how AI discovers hidden relationships between docs

## Visual Effects (The Shader Stuff)

### Background
- Animated gradient mesh — shifting purple/blue/teal colors
- Subtle floating particles
- Or: WebGL shader with flowing noise/plasma effect

### UI Elements
- Glassmorphism cards (backdrop-blur, semi-transparent)
- Glow effects on interactive elements
- Smooth transitions and micro-animations
- Text that "types itself" for AI responses
- Progress bars with gradient fills and shimmer
- Pulsing indicators for "AI processing"

### Document Scan Effect
- When "analyzing" a document: glowing scan line moves down
- Extracted entities highlight and float up
- Classification confidence fills up like a progress bar

## Fake Data
Pre-populate with quality management data:
- SOPs, Work Instructions, CAPAs, NCRs, Audit Reports
- Supplier names, part numbers, regulatory references (ISO 9001, FDA, IATF)
- Realistic but fictional company: "Apex Manufacturing" or similar
- Use Corning-adjacent language if appropriate (glass, optical fiber, specialty materials)

## File Structure
```
rag-qms-demo/
├── index.html          # Main entry — the whole demo
├── css/
│   └── custom.css      # Custom styles beyond Tailwind
├── js/
│   ├── app.js          # Main app logic, routing, state
│   ├── search.js       # AI search demo with typed responses
│   ├── documents.js    # Document intelligence demo
│   ├── workflow.js     # CAPA workflow demo
│   ├── audit.js        # Access & audit trail
│   ├── graph.js        # Knowledge graph visualization
│   ├── effects.js      # Shader/particle/glow effects
│   └── data.js         # All fake data
├── SPEC.md
└── AGENTS.md
```

## Key Impression Points
1. "Look how fast I can find answers" (vs clicking through 14 ETQ screens)
2. "The AI reads and classifies documents automatically" (vs manual tagging)
3. "Full audit trail including AI actions" (compliance story)
4. "Knowledge graph shows connections humans miss" (insight story)
5. "This is what replaces ETQ in 3 years" (strategic story)
