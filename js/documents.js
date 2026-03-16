// ============================================================================
// documents.js — Document Intelligence with scanning animation, auto-extraction
// ============================================================================

import { DOCUMENTS, SAMPLE_DOCUMENT } from './data.js';
import { triggerScanEffect } from './effects.js';

let scanTriggered = false;
let docListCloneReady = false;

// Get status badge class
function statusBadge(status) {
  const map = {
    'Active': 'badge-active',
    'In Progress': 'badge-progress',
    'Under Review': 'badge-review',
    'Closed': 'badge-closed',
    'Open': 'badge-open',
    'Under Investigation': 'badge-progress',
    'Final': 'badge-active',
  };
  return map[status] || 'badge-closed';
}

// Render document list table
function renderDocumentList(container, filter = 'all') {
  const filtered = filter === 'all'
    ? DOCUMENTS
    : DOCUMENTS.filter(d => d.type.toLowerCase().includes(filter.toLowerCase()));

  container.innerHTML = `
    <div class="overflow-x-auto">
      <table class="qms-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Title</th>
            <th>Type</th>
            <th>Status</th>
            <th>Owner</th>
            <th>AI Score</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          ${filtered.map((doc, i) => `
            <tr class="fade-in-up" style="animation-delay: ${i * 0.035}s">
              <td><span class="font-mono text-purple-400 text-xs">${doc.id}</span></td>
              <td class="text-slate-200 font-medium max-w-xs truncate">${doc.title}</td>
              <td><span class="text-xs text-slate-400">${doc.type}</span></td>
              <td><span class="badge ${statusBadge(doc.status)}">${doc.status}</span></td>
              <td class="text-xs text-slate-300">${doc.owner}</td>
              <td>
                <div class="flex items-center gap-2">
                  <div class="confidence-bar w-14">
                    <div class="confidence-fill" style="width: ${doc.aiScore * 100}%"></div>
                  </div>
                  <span class="text-xs font-mono ${doc.aiScore > 0.9 ? 'text-emerald-400' : doc.aiScore > 0.8 ? 'text-cyan-400' : 'text-amber-400'}">
                    ${(doc.aiScore * 100).toFixed(0)}%
                  </span>
                </div>
              </td>
              <td>
                <button class="analyze-btn text-xs px-3 py-1.5 rounded-lg border border-purple-500/20 text-purple-400
                               hover:bg-purple-500/10 hover:border-purple-500/40 transition-all cursor-pointer whitespace-nowrap"
                        data-doc-id="${doc.id}">
                  ⚡ Analyze
                </button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

// Render AI analysis detail panel
function renderDocAnalysis(container) {
  const doc = SAMPLE_DOCUMENT;
  const analysis = doc.aiAnalysis;

  container.innerHTML = `
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">

      <!-- Left: Document Content -->
      <div>
        <div class="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div>
            <span class="font-mono text-purple-400 text-sm">${doc.id}</span>
            <h3 class="text-lg font-semibold text-white mt-0.5">${doc.title}</h3>
          </div>
          <button id="scan-trigger-btn"
                  class="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-600 text-white text-sm
                         font-medium hover:from-purple-500 hover:to-cyan-500 transition-all glow-pulse cursor-pointer
                         flex items-center gap-2 shrink-0">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707
                       m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531
                       c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
            </svg>
            AI Analyze
          </button>
        </div>
        <div id="doc-content-panel"
             class="glass-card-inset p-5 relative overflow-hidden"
             style="max-height: 520px; overflow-y: auto;">
          <pre class="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap font-sans">${doc.content}</pre>
        </div>
      </div>

      <!-- Right: AI Extraction Results -->
      <div id="ai-extraction-panel" class="space-y-4 opacity-0 translate-y-4 transition-all duration-700">

        <!-- Document Classification -->
        <div class="glass-card-inset p-4">
          <div class="flex items-center gap-2 mb-3">
            <svg class="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0
                       l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path>
            </svg>
            <h4 class="text-sm font-semibold text-white">Document Classification</h4>
            <span class="badge badge-ai ml-auto">AI Detected</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-sm text-slate-200">${analysis.documentType.label}</span>
            <div class="flex items-center gap-2">
              <div class="confidence-bar w-20">
                <div class="confidence-fill" data-target="${analysis.documentType.confidence * 100}" style="width: 0%"></div>
              </div>
              <span class="text-xs font-mono text-emerald-400 font-bold">
                ${(analysis.documentType.confidence * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        </div>

        <!-- Regulatory References -->
        <div class="glass-card-inset p-4">
          <div class="flex items-center gap-2 mb-3">
            <svg class="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04
                       A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622
                       0-1.042-.133-2.052-.382-3.016z"></path>
            </svg>
            <h4 class="text-sm font-semibold text-white">Regulatory References</h4>
          </div>
          <div class="space-y-2.5">
            ${analysis.regulatoryRefs.map(ref => `
              <div class="entity-float" style="opacity: 0">
                <div class="flex items-center justify-between mb-0.5">
                  <span class="text-sm text-slate-200 font-medium">${ref.standard}</span>
                  <span class="text-xs font-mono ${ref.confidence > 0.9 ? 'text-emerald-400' : 'text-cyan-400'}">
                    ${(ref.confidence * 100).toFixed(0)}%
                  </span>
                </div>
                <p class="text-xs text-slate-400">${ref.sections.join(', ')}</p>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Key Entities -->
        <div class="glass-card-inset p-4">
          <div class="flex items-center gap-2 mb-3">
            <svg class="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158
                       a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414
                       l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5
                       A2 2 0 009 10.172V5L8 4z"></path>
            </svg>
            <h4 class="text-sm font-semibold text-white">Key Entities Extracted</h4>
          </div>
          <div class="grid grid-cols-1 gap-2">
            ${analysis.keyEntities.map(ent => `
              <div class="entity-float flex items-center justify-between py-1.5 px-3 rounded-lg
                          bg-white/[0.02] border border-white/[0.04]" style="opacity: 0">
                <div>
                  <span class="text-sm text-slate-200">${ent.entity}</span>
                  <span class="text-xs text-slate-500 ml-2">${ent.type}</span>
                </div>
                <span class="text-xs font-mono text-cyan-400">${ent.value}</span>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Action Items -->
        <div class="glass-card-inset p-4">
          <div class="flex items-center gap-2 mb-3">
            <svg class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2
                       M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path>
            </svg>
            <h4 class="text-sm font-semibold text-white">AI-Identified Action Items</h4>
          </div>
          <ul class="space-y-2">
            ${analysis.actionItems.map((item, i) => `
              <li class="entity-float flex items-start gap-2 text-sm text-slate-300 leading-snug"
                  style="opacity: 0; animation-delay: ${i * 0.08}s">
                <span class="text-emerald-400 mt-0.5 shrink-0 font-bold">✓</span>
                ${item}
              </li>
            `).join('')}
          </ul>
        </div>

        <!-- Suggested Tags -->
        <div class="glass-card-inset p-4">
          <div class="flex items-center gap-2 mb-3">
            <svg class="w-4 h-4 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0
                       l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path>
            </svg>
            <h4 class="text-sm font-semibold text-white">Auto-Suggested Tags</h4>
          </div>
          <div class="flex flex-wrap gap-2">
            ${analysis.suggestedTags.map((tag, i) => `
              <span class="entity-float px-3 py-1 rounded-full text-xs font-medium
                           bg-purple-500/10 text-purple-300 border border-purple-500/20
                           hover:bg-purple-500/20 cursor-default transition-colors"
                    style="opacity: 0; animation-delay: ${i * 0.06}s">
                ${tag}
              </span>
            `).join('')}
          </div>
        </div>

        <!-- Related Documents -->
        <div class="glass-card-inset p-4">
          <div class="flex items-center gap-2 mb-3">
            <svg class="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101
                       m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path>
            </svg>
            <h4 class="text-sm font-semibold text-white">Cross-References Found</h4>
            <span class="badge badge-ai ml-auto">AI Linked</span>
          </div>
          <div class="flex flex-wrap gap-2">
            ${analysis.relatedDocs.map((docId, i) => `
              <span class="entity-float px-3 py-1.5 rounded-lg text-xs font-mono
                           bg-blue-500/10 text-blue-300 border border-blue-500/20
                           cursor-pointer hover:bg-blue-500/20 transition-colors"
                    style="opacity: 0; animation-delay: ${i * 0.06}s">
                ${docId}
              </span>
            `).join('')}
          </div>
        </div>

      </div><!-- end ai-extraction-panel -->
    </div>
  `;

  // Wire up scan button
  const scanBtn = document.getElementById('scan-trigger-btn');
  if (scanBtn) {
    scanBtn.addEventListener('click', () => runScanAnimation());
  }
}

// Run the scan animation and reveal extraction results
function runScanAnimation() {
  const docPanel = document.getElementById('doc-content-panel');
  const aiPanel  = document.getElementById('ai-extraction-panel');
  const scanBtn  = document.getElementById('scan-trigger-btn');

  if (scanBtn) {
    scanBtn.innerHTML = `
      <svg class="w-4 h-4 spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
      </svg>
      Scanning…
    `;
    scanBtn.disabled = true;
    scanBtn.style.opacity = '0.7';
  }

  if (docPanel) triggerScanEffect('doc-content-panel');

  // Reveal AI results after scan completes
  setTimeout(() => {
    if (aiPanel) {
      aiPanel.style.opacity = '1';
      aiPanel.style.transform = 'translateY(0)';

      // Animate confidence bars
      const bars = aiPanel.querySelectorAll('.confidence-fill[data-target]');
      bars.forEach((bar, i) => {
        setTimeout(() => {
          bar.style.width = bar.dataset.target + '%';
        }, i * 180);
      });

      // Stagger entity float-ins
      const entities = aiPanel.querySelectorAll('.entity-float');
      entities.forEach((el, i) => {
        setTimeout(() => {
          el.style.opacity = '1';
          el.style.animation = `entityFloat 0.6s ease-out forwards`;
          el.style.animationDelay = `0s`;
        }, 400 + i * 55);
      });
    }

    // Restore button
    if (scanBtn) {
      scanBtn.disabled = false;
      scanBtn.style.opacity = '1';
      scanBtn.innerHTML = `
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>
        Analyzed
      `;
    }
  }, 1600);
}

// Render filter pills
function renderDocFilters(container) {
  const types = ['all', 'SOP', 'Work Instruction', 'CAPA', 'NCR', 'Audit Report'];

  container.innerHTML = types.map(t => `
    <button class="filter-pill ${t === 'all' ? 'active' : ''}" data-filter="${t}">
      ${t === 'all' ? 'All Documents' : t}
    </button>
  `).join('');

  container.addEventListener('click', (e) => {
    const pill = e.target.closest('.filter-pill');
    if (!pill) return;
    container.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
    const list = document.getElementById('doc-list-container');
    if (list) renderDocumentList(list, pill.dataset.filter);
  });
}

export function initDocuments() {
  const filtersContainer  = document.getElementById('doc-filters');
  const listContainer     = document.getElementById('doc-list-container');
  const analysisContainer = document.getElementById('doc-analysis-container');

  if (filtersContainer)  renderDocFilters(filtersContainer);
  if (listContainer)     renderDocumentList(listContainer);
  if (analysisContainer) renderDocAnalysis(analysisContainer);

  // Handle "Analyze" button clicks in doc list (delegated, fresh render so no stacking)
  if (listContainer) {
    listContainer.addEventListener('click', (e) => {
      const btn = e.target.closest('.analyze-btn');
      if (!btn) return;
      const analysisSection = document.getElementById('doc-analysis-section');
      if (analysisSection) {
        analysisSection.scrollIntoView({ behavior: 'smooth' });
        setTimeout(() => runScanAnimation(), 600);
      }
    });
  }

  // Reset scan trigger for fresh view
  scanTriggered = false;
}

// Called when documents screen becomes visible
export function onDocumentsVisible() {
  if (!scanTriggered) {
    scanTriggered = true;
    setTimeout(() => runScanAnimation(), 900);
  }
}
