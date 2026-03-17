// ============================================================================
// documents.js — Document Intelligence: list, upload, AI analyze
// Wired to real API via api.js. Scan animation + analysis panel preserved.
// ============================================================================

import { api } from './api.js';
import { triggerScanEffect } from './effects.js';

let scanTriggered = false;
let allDocs = [];
let currentFilter = 'all';

function statusBadge(status) {
  const map = {
    'Active': 'badge-active', 'In Progress': 'badge-progress',
    'Under Review': 'badge-review', 'Closed': 'badge-closed',
    'Open': 'badge-open', 'Final': 'badge-active',
  };
  return map[status] || 'badge-closed';
}

function renderDocumentList(container, filter = 'all') {
  const filtered = filter === 'all'
    ? allDocs
    : allDocs.filter(d => d.doc_type === filter);

  container.innerHTML = `
    <div class="overflow-x-auto">
      <table class="qms-table">
        <thead>
          <tr>
            <th>ID</th><th>Title</th><th>Type</th><th>Status</th>
            <th>Owner</th><th>AI Score</th><th>Action</th>
          </tr>
        </thead>
        <tbody>
          ${filtered.map((doc, i) => `
            <tr class="fade-in-up" style="animation-delay: ${i * 0.035}s">
              <td><span class="font-mono text-purple-400 text-xs">${doc.doc_number}</span></td>
              <td class="text-slate-200 font-medium max-w-xs truncate">${doc.title}</td>
              <td><span class="text-xs text-slate-400">${doc.doc_type}</span></td>
              <td><span class="badge ${statusBadge(doc.status)}">${doc.status}</span></td>
              <td class="text-xs text-slate-300">${doc.author || '—'}</td>
              <td>
                <div class="flex items-center gap-2">
                  <div class="confidence-bar w-14">
                    <div class="confidence-fill" style="width: ${(doc.ai_score || 0) * 100}%"></div>
                  </div>
                  <span class="text-xs font-mono ${(doc.ai_score || 0) > 0.9 ? 'text-emerald-400' : (doc.ai_score || 0) > 0.8 ? 'text-cyan-400' : 'text-amber-400'}">
                    ${((doc.ai_score || 0) * 100).toFixed(0)}%
                  </span>
                </div>
              </td>
              <td>
                <button class="analyze-btn text-xs px-3 py-1.5 rounded-lg border border-purple-500/20 text-purple-400
                               hover:bg-purple-500/10 hover:border-purple-500/40 transition-all cursor-pointer whitespace-nowrap"
                        data-doc-id="${doc.id}" data-doc-number="${doc.doc_number}">
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

function renderDocFilters(container) {
  const types = ['all', ...new Set(allDocs.map(d => d.doc_type))];

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
    currentFilter = pill.dataset.filter;
    const list = document.getElementById('doc-list-container');
    if (list) renderDocumentList(list, currentFilter);
  });
}

// ---------- Upload form ----------
function showUploadForm() {
  const existing = document.getElementById('upload-modal');
  if (existing) { existing.remove(); return; }

  const modal = document.createElement('div');
  modal.id = 'upload-modal';
  modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-4';
  modal.innerHTML = `
    <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" id="upload-overlay"></div>
    <div class="relative glass-card-static p-6 rounded-2xl w-full max-w-md z-10">
      <h3 class="text-lg font-semibold text-white mb-4">Upload Document</h3>
      <form id="upload-form" class="space-y-3">
        <div>
          <label class="text-xs text-slate-400 mb-1 block">File (.txt or .pdf)</label>
          <input type="file" name="file" accept=".txt,.pdf" required
                 class="w-full text-sm text-slate-300 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg
                        file:border-0 file:text-xs file:font-medium file:bg-purple-500/20 file:text-purple-300
                        hover:file:bg-purple-500/30 cursor-pointer">
        </div>
        ${['doc_number:Doc Number', 'title:Title', 'doc_type:Type (SOP/WI/CAPA/NCR)', 'version:Version', 'author:Author', 'department:Department'].map(f => {
          const [name, label] = f.split(':');
          return `<div>
            <label class="text-xs text-slate-400 mb-1 block">${label}</label>
            <input type="text" name="${name}" ${name === 'version' ? 'value="1.0"' : ''} 
                   class="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white
                          focus:outline-none focus:border-purple-500/50" ${['doc_number','title','doc_type'].includes(name) ? 'required' : ''}>
          </div>`;
        }).join('')}
        <div class="flex gap-3 pt-2">
          <button type="submit" class="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-600
                                       text-white text-sm font-medium hover:from-purple-500 hover:to-cyan-500
                                       transition-all cursor-pointer">
            Upload & Embed
          </button>
          <button type="button" id="upload-cancel" class="px-4 py-2.5 rounded-xl border border-white/10
                                                           text-slate-400 text-sm hover:border-white/20 cursor-pointer">
            Cancel
          </button>
        </div>
        <div id="upload-status" class="text-xs text-slate-400"></div>
      </form>
    </div>
  `;
  document.body.appendChild(modal);

  document.getElementById('upload-overlay').addEventListener('click', () => modal.remove());
  document.getElementById('upload-cancel').addEventListener('click', () => modal.remove());

  document.getElementById('upload-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const statusEl = document.getElementById('upload-status');
    const formData = new FormData(form);

    statusEl.innerHTML = `
      <div class="flex items-center gap-2">
        <div class="w-3 h-3 border border-purple-500 border-t-transparent rounded-full spin shrink-0"></div>
        <span>Uploading and embedding…</span>
      </div>
    `;

    // Trigger scan on the list
    const listContainer = document.getElementById('doc-list-container');
    if (listContainer) triggerScanEffect('doc-list-container');

    try {
      const result = await api.uploadDocument(formData);
      statusEl.innerHTML = `<span class="text-emerald-400">✓ Uploaded ${result.doc_number} — ${result.chunk_count} chunks embedded</span>`;

      // Refresh doc list
      setTimeout(async () => {
        modal.remove();
        await refreshDocList();
      }, 1500);
    } catch (err) {
      statusEl.innerHTML = `<span class="text-red-400">Error: ${err.message}</span>`;
    }
  });
}

async function refreshDocList() {
  try {
    allDocs = await api.listDocuments();
    const listContainer = document.getElementById('doc-list-container');
    const filtersContainer = document.getElementById('doc-filters');
    if (listContainer) renderDocumentList(listContainer, currentFilter);
    if (filtersContainer) renderDocFilters(filtersContainer);
  } catch (_) {}
}

// ---------- AI Analysis Panel ----------
function renderAnalysisPanel(container, docNumber, entities) {
  if (!entities) {
    container.innerHTML = `<p class="text-sm text-slate-400 py-4">No analysis data — click "AI Analyze" on a document.</p>`;
    return;
  }

  const docType = entities.document_type || {};
  const regRefs = entities.regulatory_refs || [];
  const keyEnts = entities.key_entities || [];
  const actions = entities.action_items || [];
  const tags    = entities.suggested_tags || [];
  const related = entities.related_docs || [];

  container.innerHTML = `
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div>
        <div class="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div>
            <span class="font-mono text-purple-400 text-sm">${docNumber}</span>
            <h3 class="text-lg font-semibold text-white mt-0.5">AI Analysis Results</h3>
          </div>
          <span class="badge badge-ai">AI Analyzed</span>
        </div>

        <!-- Classification -->
        <div class="glass-card-inset p-4 mb-4">
          <div class="flex items-center gap-2 mb-3">
            <h4 class="text-sm font-semibold text-white">Document Classification</h4>
            <span class="badge badge-ai ml-auto">AI Detected</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-sm text-slate-200">${docType.label || 'Unknown'}</span>
            <div class="flex items-center gap-2">
              <div class="confidence-bar w-20">
                <div class="confidence-fill" style="width: ${((docType.confidence || 0) * 100).toFixed(0)}%"></div>
              </div>
              <span class="text-xs font-mono text-emerald-400 font-bold">${((docType.confidence || 0) * 100).toFixed(0)}%</span>
            </div>
          </div>
        </div>

        <!-- Regulatory Refs -->
        ${regRefs.length ? `
        <div class="glass-card-inset p-4 mb-4">
          <h4 class="text-sm font-semibold text-white mb-3">Regulatory References</h4>
          <div class="space-y-2">
            ${regRefs.map(r => `
              <div class="flex items-center justify-between">
                <span class="text-sm text-slate-200">${r.standard || ''}</span>
                <span class="text-xs font-mono text-cyan-400">${((r.confidence || 0) * 100).toFixed(0)}%</span>
              </div>
            `).join('')}
          </div>
        </div>` : ''}

        <!-- Tags -->
        ${tags.length ? `
        <div class="glass-card-inset p-4">
          <h4 class="text-sm font-semibold text-white mb-3">Auto-Suggested Tags</h4>
          <div class="flex flex-wrap gap-2">
            ${tags.map(t => `<span class="px-3 py-1 rounded-full text-xs font-medium bg-purple-500/10 text-purple-300 border border-purple-500/20">${t}</span>`).join('')}
          </div>
        </div>` : ''}
      </div>

      <div class="space-y-4">
        <!-- Key Entities -->
        ${keyEnts.length ? `
        <div class="glass-card-inset p-4">
          <h4 class="text-sm font-semibold text-white mb-3">Key Entities Extracted</h4>
          <div class="grid gap-2">
            ${keyEnts.map(e => `
              <div class="flex items-center justify-between py-1.5 px-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                <div>
                  <span class="text-sm text-slate-200">${e.entity || ''}</span>
                  <span class="text-xs text-slate-500 ml-2">${e.type || ''}</span>
                </div>
                <span class="text-xs font-mono text-cyan-400">${e.value || ''}</span>
              </div>
            `).join('')}
          </div>
        </div>` : ''}

        <!-- Action Items -->
        ${actions.length ? `
        <div class="glass-card-inset p-4">
          <h4 class="text-sm font-semibold text-white mb-3">AI-Identified Action Items</h4>
          <ul class="space-y-2">
            ${actions.map(a => `
              <li class="flex items-start gap-2 text-sm text-slate-300 leading-snug">
                <span class="text-emerald-400 mt-0.5 shrink-0">✓</span>
                ${a}
              </li>
            `).join('')}
          </ul>
        </div>` : ''}

        <!-- Related Docs -->
        ${related.length ? `
        <div class="glass-card-inset p-4">
          <div class="flex items-center gap-2 mb-3">
            <h4 class="text-sm font-semibold text-white">Cross-References Found</h4>
            <span class="badge badge-ai ml-auto">AI Linked</span>
          </div>
          <div class="flex flex-wrap gap-2">
            ${related.map(d => `<span class="px-3 py-1.5 rounded-lg text-xs font-mono bg-blue-500/10 text-blue-300 border border-blue-500/20 cursor-pointer hover:bg-blue-500/20 transition-colors">${d}</span>`).join('')}
          </div>
        </div>` : ''}
      </div>
    </div>
  `;
}

async function triggerDocAnalysis(docId, docNumber, analysisContainer) {
  analysisContainer.innerHTML = `
    <div class="flex items-center gap-3 py-8 justify-center">
      <div class="flex items-center gap-1.5">
        <div class="thinking-dot"></div>
        <div class="thinking-dot" style="animation-delay:0.15s"></div>
        <div class="thinking-dot" style="animation-delay:0.3s"></div>
      </div>
      <span class="text-sm text-slate-400">AI is analyzing document…</span>
    </div>
  `;

  triggerScanEffect('doc-list-container');

  try {
    const result = await api.analyzeDocument(docId);
    renderAnalysisPanel(analysisContainer, docNumber, result.entities);
  } catch (err) {
    analysisContainer.innerHTML = `<p class="text-red-400 text-sm py-4">Analysis failed: ${err.message}</p>`;
  }
}

export function initDocuments() {
  const filtersContainer   = document.getElementById('doc-filters');
  const listContainer      = document.getElementById('doc-list-container');
  const analysisContainer  = document.getElementById('doc-analysis-container');

  scanTriggered = false;
  currentFilter = 'all';

  // Show upload button in analysis section header
  const analysisSectionHeader = document.querySelector('#doc-analysis-section .flex');
  if (analysisSectionHeader && !document.getElementById('upload-doc-btn')) {
    const uploadBtn = document.createElement('button');
    uploadBtn.id = 'upload-doc-btn';
    uploadBtn.className = 'ml-auto px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600/80 to-cyan-600/80 text-white text-xs font-medium hover:from-purple-500 hover:to-cyan-500 transition-all cursor-pointer';
    uploadBtn.textContent = '+ Upload Document';
    uploadBtn.addEventListener('click', showUploadForm);
    analysisSectionHeader.appendChild(uploadBtn);
  }

  // Load documents from API
  api.listDocuments().then(docs => {
    allDocs = docs;
    if (filtersContainer) renderDocFilters(filtersContainer);
    if (listContainer) renderDocumentList(listContainer);

    // Initial analysis panel placeholder
    if (analysisContainer) {
      analysisContainer.innerHTML = `<p class="text-sm text-slate-500 py-4">Click "⚡ Analyze" on any document to run AI analysis.</p>`;
    }

    // Handle analyze button clicks
    if (listContainer) {
      listContainer.addEventListener('click', async (e) => {
        const btn = e.target.closest('.analyze-btn');
        if (!btn) return;
        const docId     = btn.dataset.docId;
        const docNumber = btn.dataset.docNumber;
        const section   = document.getElementById('doc-analysis-section');
        if (section) section.scrollIntoView({ behavior: 'smooth' });
        if (analysisContainer) await triggerDocAnalysis(docId, docNumber, analysisContainer);
      });
    }
  }).catch(err => {
    if (listContainer) listContainer.innerHTML = `<p class="text-red-400 text-sm p-4">Failed to load documents: ${err.message}</p>`;
  });
}

export function onDocumentsVisible() {
  // Auto-analyze first doc on first visit
  if (!scanTriggered && allDocs.length > 0) {
    scanTriggered = true;
    setTimeout(() => {
      const firstDoc = allDocs[0];
      const analysisContainer = document.getElementById('doc-analysis-container');
      if (analysisContainer && firstDoc) {
        triggerDocAnalysis(firstDoc.id, firstDoc.doc_number, analysisContainer);
      }
    }, 900);
  }
}
