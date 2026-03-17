// ============================================================================
// workflow.js — CAPA Workflow: timeline, AI root cause, corrective/preventive
// Wired to real API via api.js. Visual behavior preserved exactly.
// ============================================================================

import { api } from './api.js';

const approvedActions = new Set();
const modifiedActions = new Set();

function confidenceColor(val) {
  if (val >= 0.9) return 'text-emerald-400';
  if (val >= 0.8) return 'text-cyan-400';
  return 'text-amber-400';
}

function statusDotClass(status) {
  if (status === 'completed') return 'completed';
  if (status === 'in_progress') return 'in-progress';
  return 'pending';
}

// ---------- Timeline ----------
function renderTimeline(container, timeline) {
  container.innerHTML = `
    <div class="timeline">
      ${(timeline || []).map((item, i) => `
        <div class="timeline-item fade-in-up" style="animation-delay: ${i * 0.07}s">
          <div class="timeline-dot ${statusDotClass(item.status)}"></div>
          <div class="flex items-start justify-between gap-3">
            <div class="flex-1 min-w-0">
              <p class="text-sm text-slate-200 font-medium leading-snug">${item.event}</p>
              <p class="text-xs text-slate-500 mt-0.5 font-mono">${item.event_date || ''}</p>
            </div>
            <div class="flex flex-col items-end gap-1 shrink-0">
              ${item.ai_involved
                ? '<span class="badge badge-ai text-[10px]">AI</span>'
                : '<span class="text-[10px] text-slate-600">Human</span>'}
              ${item.status === 'in_progress'
                ? '<span class="badge badge-progress text-[10px]">Active</span>'
                : item.status === 'pending'
                  ? '<span class="badge badge-closed text-[10px]">Pending</span>'
                  : '<span class="badge badge-active text-[10px]">Done</span>'}
            </div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

// ---------- Root Cause ----------
function renderRootCause(container, capa) {
  if (!capa.root_cause) {
    container.innerHTML = `
      <div class="glass-card-inset p-5">
        <div class="flex items-center gap-2 mb-4">
          <h4 class="text-white font-semibold">AI Root Cause Analysis</h4>
          <span class="badge badge-ai">RAG-Generated</span>
        </div>
        <p class="text-sm text-slate-400 mb-4">No analysis yet. Click to generate AI-powered RCA from document context.</p>
        <button id="generate-rca-btn"
                class="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-600 text-white text-sm
                       font-medium hover:from-purple-500 hover:to-cyan-500 transition-all glow-pulse cursor-pointer
                       flex items-center gap-2"
                data-capa-id="${capa.id}">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
          Generate Analysis
        </button>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="glass-card-inset p-5 space-y-4 scale-in">
      <div class="flex items-center justify-between flex-wrap gap-3">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-cyan-600 flex items-center justify-center shrink-0">
            <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path></svg>
          </div>
          <h4 class="text-white font-semibold">AI Root Cause Analysis</h4>
          <span class="badge badge-ai">RAG-Generated</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-xs text-slate-500">Confidence</span>
          <div class="confidence-bar w-24">
            <div class="confidence-fill" style="width: 0%" data-target="${((capa.root_cause_confidence || 0) * 100).toFixed(0)}"></div>
          </div>
          <span class="${confidenceColor(capa.root_cause_confidence || 0)} text-sm font-mono font-bold">${((capa.root_cause_confidence || 0) * 100).toFixed(0)}%</span>
        </div>
      </div>

      <div class="p-3 rounded-xl bg-purple-500/5 border border-purple-500/15">
        <p class="text-sm text-slate-200 leading-relaxed">${capa.root_cause}</p>
      </div>
    </div>
  `;

  setTimeout(() => {
    const bar = container.querySelector('.confidence-fill[data-target]');
    if (bar) bar.style.width = bar.dataset.target + '%';
  }, 400);
}

// ---------- Actions ----------
function renderActionItem(a, i, type) {
  const key = `${type}-${i}`;
  const priorityClass = a.priority === 'Immediate' ? 'text-red-400 bg-red-500/15'
    : a.priority === 'High' ? 'text-amber-400 bg-amber-500/15' : 'text-blue-400 bg-blue-500/15';
  const priorityText = a.priority === 'Immediate' ? 'text-red-400'
    : a.priority === 'High' ? 'text-amber-400' : 'text-blue-400';

  return `
    <div class="action-item-row flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]
                transition-all duration-300 fade-in-up" style="animation-delay: ${i * 0.1}s" data-key="${key}">
      <div class="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${priorityClass}">
        <span class="text-xs font-bold leading-none">${i + 1}</span>
      </div>
      <div class="flex-1 min-w-0">
        <p class="text-sm text-slate-200 leading-snug">${a.action}</p>
        <div class="flex items-center flex-wrap gap-2 mt-1.5">
          <span class="text-xs text-slate-500">Priority: <span class="${priorityText} font-medium">${a.priority}</span></span>
          <span class="text-xs text-slate-500">Owner: <span class="text-slate-300">${a.owner || '—'}</span></span>
          ${a.status ? `<span class="badge ${a.status === 'Pending' ? 'badge-progress' : 'badge-active'} text-[10px]">${a.status}</span>` : ''}
        </div>
      </div>
      <div class="flex items-center gap-1.5 shrink-0">
        <button class="action-approve-btn px-2.5 py-1.5 text-xs rounded-lg border border-emerald-500/25 text-emerald-400
                       hover:bg-emerald-500/15 hover:border-emerald-500/50 transition-all cursor-pointer whitespace-nowrap"
                data-action-key="${key}">✓ Approve</button>
        <button class="action-modify-btn px-2.5 py-1.5 text-xs rounded-lg border border-amber-500/25 text-amber-400
                       hover:bg-amber-500/15 hover:border-amber-500/50 transition-all cursor-pointer whitespace-nowrap"
                data-action-key="${key}">✎ Modify</button>
      </div>
    </div>
  `;
}

function updateActionItemUI(row, state) {
  if (!row) return;
  const approveBtn = row.querySelector('.action-approve-btn');
  const modifyBtn  = row.querySelector('.action-modify-btn');
  const statusEl   = row.querySelector('.badge');
  if (state === 'approved') {
    row.style.borderColor = 'rgba(16,185,129,0.35)';
    row.style.background = 'rgba(16,185,129,0.06)';
    if (approveBtn) { approveBtn.innerHTML = '✓ Approved'; approveBtn.classList.add('bg-emerald-500/20'); }
    if (statusEl) { statusEl.textContent = 'Approved'; statusEl.className = 'badge badge-active text-[10px]'; }
  } else if (state === 'modified') {
    row.style.borderColor = 'rgba(245,158,11,0.35)';
    row.style.background = 'rgba(245,158,11,0.04)';
    if (modifyBtn) { modifyBtn.innerHTML = '✎ Modified'; modifyBtn.classList.add('bg-amber-500/20'); }
    if (statusEl) { statusEl.textContent = 'Modified'; statusEl.className = 'badge badge-review text-[10px]'; }
  }
}

function renderActions(container, capa) {
  const ca = Array.isArray(capa.corrective_actions) ? capa.corrective_actions : [];
  const pa = Array.isArray(capa.preventive_actions) ? capa.preventive_actions : [];

  if (!ca.length && !pa.length) {
    container.innerHTML = `<p class="text-sm text-slate-500 py-4">No actions generated yet. Run AI analysis first.</p>`;
    return;
  }

  container.innerHTML = `
    <div class="glass-card-inset p-5 mb-4 scale-in" style="animation-delay:0.1s">
      <div class="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div class="flex items-center gap-2">
          <svg class="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
          <h4 class="text-white font-semibold">Corrective Actions</h4>
        </div>
        <div class="flex items-center gap-2">
          <span class="${confidenceColor(capa.corrective_confidence || 0)} text-xs font-mono">${((capa.corrective_confidence || 0) * 100).toFixed(0)}% confidence</span>
          <span class="badge badge-ai">AI Recommended</span>
        </div>
      </div>
      <div class="space-y-3" id="corrective-actions-list">
        ${ca.map((a, i) => renderActionItem(a, i, 'corrective')).join('')}
      </div>
    </div>

    <div class="glass-card-inset p-5 scale-in" style="animation-delay:0.2s">
      <div class="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div class="flex items-center gap-2">
          <svg class="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
          <h4 class="text-white font-semibold">Preventive Actions</h4>
        </div>
        <span class="${confidenceColor(capa.preventive_confidence || 0)} text-xs font-mono">${((capa.preventive_confidence || 0) * 100).toFixed(0)}% confidence</span>
      </div>
      <div class="space-y-3">
        ${pa.map((a, i) => renderActionItem(a, i, 'preventive')).join('')}
      </div>
    </div>
  `;

  container.addEventListener('click', (e) => {
    const approveBtn = e.target.closest('.action-approve-btn');
    const modifyBtn  = e.target.closest('.action-modify-btn');
    if (approveBtn) {
      const key = approveBtn.dataset.actionKey;
      approvedActions.add(key); modifiedActions.delete(key);
      updateActionItemUI(approveBtn.closest('.action-item-row'), 'approved');
    }
    if (modifyBtn) {
      const key = modifyBtn.dataset.actionKey;
      modifiedActions.add(key); approvedActions.delete(key);
      updateActionItemUI(modifyBtn.closest('.action-item-row'), 'modified');
    }
  });
}

// ---------- Risk Assessment ----------
function renderRiskAssessment(container, capa) {
  if (!capa.risk_level) {
    container.innerHTML = '';
    return;
  }

  const riskColors = {
    Low: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30',
    Medium: 'text-amber-400 bg-amber-500/15 border-amber-500/30',
    High: 'text-red-400 bg-red-500/15 border-red-500/30',
  };

  container.innerHTML = `
    <div class="glass-card-inset p-5 scale-in" style="animation-delay:0.3s">
      <div class="flex items-center justify-between mb-5 flex-wrap gap-2">
        <div class="flex items-center gap-2">
          <svg class="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"></path></svg>
          <h4 class="text-white font-semibold">AI Risk Assessment</h4>
        </div>
        <span class="${confidenceColor(capa.risk_confidence || 0)} text-xs font-mono">${((capa.risk_confidence || 0) * 100).toFixed(0)}% confidence</span>
      </div>

      <div class="grid grid-cols-3 gap-3 mb-5">
        <div class="text-center p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
          <p class="text-[10px] text-slate-400 uppercase tracking-wider mb-1.5">Severity</p>
          <p class="text-sm font-bold text-amber-400">${capa.risk_severity || '—'}</p>
        </div>
        <div class="text-center p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
          <p class="text-[10px] text-slate-400 uppercase tracking-wider mb-1.5">Likelihood</p>
          <p class="text-sm font-bold text-red-400">${capa.risk_likelihood || '—'}</p>
        </div>
        <div class="text-center p-3 rounded-xl border ${riskColors[capa.risk_level] || riskColors['Medium']}">
          <p class="text-[10px] text-slate-400 uppercase tracking-wider mb-1.5">Risk Level</p>
          <p class="text-sm font-bold">${capa.risk_level}</p>
        </div>
      </div>

      <div class="space-y-3">
        ${capa.customer_impact ? `
        <div class="p-3 rounded-xl bg-white/[0.015] border border-white/[0.03]">
          <p class="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Customer Impact</p>
          <p class="text-sm text-slate-300 leading-relaxed">${capa.customer_impact}</p>
        </div>` : ''}
        ${capa.regulatory_impact ? `
        <div class="p-3 rounded-xl bg-white/[0.015] border border-white/[0.03]">
          <p class="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Regulatory Impact</p>
          <p class="text-sm text-slate-300 leading-relaxed">${capa.regulatory_impact}</p>
        </div>` : ''}
      </div>
    </div>
  `;
}

// ---------- CAPA Header ----------
function renderCAPAHeader(container, capa) {
  container.innerHTML = `
    <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-5">
      <div>
        <div class="flex items-center gap-3 mb-2 flex-wrap">
          <span class="font-mono text-purple-400 text-base font-bold">${capa.capa_number}</span>
          <span class="badge badge-progress">${capa.status}</span>
          <span class="badge badge-open">${capa.priority} Priority</span>
          ${capa.ai_analyzed_at ? '<span class="badge badge-ai">AI-Assisted</span>' : ''}
        </div>
        <h3 class="text-xl font-bold text-white leading-tight">${capa.title}</h3>
      </div>
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-x-5 gap-y-2 text-xs">
        <div><span class="block text-slate-500 mb-0.5">Owner</span><span class="text-slate-200 font-medium">${capa.owner || '—'}</span></div>
        <div><span class="block text-slate-500 mb-0.5">Opened</span><span class="text-slate-200 font-mono">${capa.opened_date || '—'}</span></div>
        <div><span class="block text-slate-500 mb-0.5">Target Close</span><span class="text-amber-400 font-mono font-medium">${capa.target_close || '—'}</span></div>
        <div><span class="block text-slate-500 mb-0.5">Related NCR</span><span class="text-cyan-400 font-mono">${capa.source_ncr || '—'}</span></div>
      </div>
    </div>
    <div class="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
      <p class="text-sm text-slate-300 leading-relaxed">${capa.description || ''}</p>
    </div>
  `;
}

// ---------- CAPA Selector ----------
function renderCapaSelector(container, capas, selectedId, onSelect) {
  container.innerHTML = `
    <div class="flex items-center gap-3 mb-6 flex-wrap">
      <span class="text-xs text-slate-400 uppercase tracking-wider">CAPA:</span>
      ${capas.map(c => `
        <button class="px-3 py-1.5 text-xs rounded-lg border cursor-pointer transition-all ${c.id === selectedId
          ? 'border-purple-500/50 bg-purple-500/15 text-purple-300'
          : 'border-white/[0.08] text-slate-400 hover:border-purple-500/30 hover:text-slate-300'}"
                data-capa-id="${c.id}">
          ${c.capa_number}
        </button>
      `).join('')}
    </div>
  `;
  container.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-capa-id]');
    if (btn) onSelect(btn.dataset.capaId);
  });
}

async function loadAndRenderCapa(capaId) {
  const headerContainer    = document.getElementById('capa-header');
  const timelineContainer  = document.getElementById('capa-timeline');
  const rootCauseContainer = document.getElementById('capa-root-cause');
  const actionsContainer   = document.getElementById('capa-actions');
  const riskContainer      = document.getElementById('capa-risk');

  if (headerContainer)    headerContainer.innerHTML = '<div class="animate-pulse h-20 bg-white/5 rounded-xl"></div>';
  if (timelineContainer)  timelineContainer.innerHTML = '';
  if (rootCauseContainer) rootCauseContainer.innerHTML = '';
  if (actionsContainer)   actionsContainer.innerHTML = '';
  if (riskContainer)      riskContainer.innerHTML = '';

  try {
    const capa = await api.getCapa(capaId);

    if (headerContainer)    renderCAPAHeader(headerContainer, capa);
    if (timelineContainer)  renderTimeline(timelineContainer, capa.timeline || []);
    if (rootCauseContainer) {
      renderRootCause(rootCauseContainer, capa);

      // Wire up "Generate Analysis" button if present
      const genBtn = rootCauseContainer.querySelector('#generate-rca-btn');
      if (genBtn) {
        genBtn.addEventListener('click', async () => {
          genBtn.disabled = true;
          genBtn.innerHTML = `
            <div class="flex items-center gap-2">
              <div class="thinking-dot"></div>
              <div class="thinking-dot" style="animation-delay:0.15s"></div>
              <div class="thinking-dot" style="animation-delay:0.3s"></div>
              <span>AI is analyzing related documents…</span>
            </div>
          `;
          try {
            await api.analyzeCapa(capaId);
            await loadAndRenderCapa(capaId); // reload with new data
          } catch (err) {
            genBtn.innerHTML = `<span class="text-red-400">Analysis failed: ${err.message}</span>`;
            genBtn.disabled = false;
          }
        });
      }
    }
    if (actionsContainer)   renderActions(actionsContainer, capa);
    if (riskContainer)      renderRiskAssessment(riskContainer, capa);
  } catch (err) {
    if (headerContainer) headerContainer.innerHTML = `<p class="text-red-400 text-sm">Failed to load CAPA: ${err.message}</p>`;
  }
}

export function initWorkflow() {
  approvedActions.clear();
  modifiedActions.clear();

  const headerContainer = document.getElementById('capa-header');

  api.listCapas().then(async capas => {
    if (!capas.length) {
      if (headerContainer) headerContainer.innerHTML = '<p class="text-sm text-slate-400">No CAPAs found.</p>';
      return;
    }

    const firstCapa = capas[0];

    // Insert CAPA selector above the header
    const workflowSection = document.getElementById('screen-workflow');
    let selectorEl = document.getElementById('capa-selector');
    if (!selectorEl) {
      selectorEl = document.createElement('div');
      selectorEl.id = 'capa-selector';
      // Prepend inside the workflow section, before the mb-4/mb-6 header
      const firstChild = workflowSection.querySelector('.mb-4, .mb-6');
      if (firstChild) {
        workflowSection.insertBefore(selectorEl, firstChild);
      } else {
        workflowSection.prepend(selectorEl);
      }
    }

    let currentCapaId = firstCapa.id;

    function onCapaSelect(id) {
      currentCapaId = id;
      renderCapaSelector(selectorEl, capas, currentCapaId, onCapaSelect);
      loadAndRenderCapa(currentCapaId);
    }

    renderCapaSelector(selectorEl, capas, currentCapaId, onCapaSelect);
    await loadAndRenderCapa(currentCapaId);
  }).catch(err => {
    if (headerContainer) headerContainer.innerHTML = `<p class="text-red-400 text-sm">Error: ${err.message}</p>`;
  });
}
