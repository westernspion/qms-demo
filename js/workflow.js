// ============================================================================
// workflow.js — CAPA Workflow: timeline, AI root cause, corrective/preventive
//               actions with approve/modify interaction, risk assessment
// ============================================================================

import { CAPA_DETAIL } from './data.js';

// Track approve state per action
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
function renderTimeline(container) {
  const capa = CAPA_DETAIL;

  container.innerHTML = `
    <div class="timeline">
      ${capa.timeline.map((item, i) => `
        <div class="timeline-item fade-in-up" style="animation-delay: ${i * 0.07}s">
          <div class="timeline-dot ${statusDotClass(item.status)}"></div>
          <div class="flex items-start justify-between gap-3">
            <div class="flex-1 min-w-0">
              <p class="text-sm text-slate-200 font-medium leading-snug">${item.event}</p>
              <p class="text-xs text-slate-500 mt-0.5 font-mono">${item.date}</p>
            </div>
            <div class="flex flex-col items-end gap-1 shrink-0">
              ${item.aiInvolved
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
function renderRootCause(container) {
  const rc = CAPA_DETAIL.aiRootCause;

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
            <div class="confidence-fill" style="width: 0%" data-target="${rc.confidence * 100}"></div>
          </div>
          <span class="${confidenceColor(rc.confidence)} text-sm font-mono font-bold">${(rc.confidence * 100).toFixed(0)}%</span>
        </div>
      </div>

      <div class="p-3 rounded-xl bg-purple-500/5 border border-purple-500/15">
        <p class="text-sm text-slate-200 leading-relaxed">${rc.summary}</p>
      </div>

      <div class="space-y-2">
        <p class="text-[11px] text-slate-400 uppercase tracking-widest font-semibold">Supporting Evidence</p>
        ${rc.details.map((d, i) => `
          <div class="flex items-start gap-2.5 text-sm text-slate-300 fade-in-up" style="animation-delay: ${i * 0.08 + 0.2}s">
            <span class="text-purple-400 mt-0.5 shrink-0 text-base leading-none">•</span>
            <span class="leading-relaxed">${d}</span>
          </div>
        `).join('')}
      </div>

      <div class="space-y-2 pt-3 border-t border-white/[0.05]">
        <p class="text-[11px] text-slate-400 uppercase tracking-widest font-semibold">Contributing Factors</p>
        ${rc.contributingFactors.map((f, i) => `
          <div class="flex items-start gap-2.5 text-sm text-slate-400 fade-in-up" style="animation-delay: ${(i + 4) * 0.08 + 0.2}s">
            <span class="text-amber-400 mt-0.5 shrink-0 text-base leading-none">⚠</span>
            <span class="leading-relaxed">${f}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  // Animate confidence bar after render
  setTimeout(() => {
    const bar = container.querySelector('.confidence-fill[data-target]');
    if (bar) bar.style.width = bar.dataset.target + '%';
  }, 400);
}

// ---------- Actions (Corrective + Preventive) ----------
function renderActions(container) {
  const ca = CAPA_DETAIL.aiCorrectiveActions;
  const pa = CAPA_DETAIL.aiPreventiveActions;

  container.innerHTML = `
    <!-- Corrective Actions -->
    <div class="glass-card-inset p-5 mb-4 scale-in" style="animation-delay:0.1s">
      <div class="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div class="flex items-center gap-2">
          <svg class="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
          <h4 class="text-white font-semibold">Corrective Actions</h4>
        </div>
        <div class="flex items-center gap-2">
          <span class="${confidenceColor(ca.confidence)} text-xs font-mono">${(ca.confidence * 100).toFixed(0)}% confidence</span>
          <span class="badge badge-ai">AI Recommended</span>
        </div>
      </div>
      <div class="space-y-3" id="corrective-actions-list">
        ${ca.actions.map((a, i) => renderActionItem(a, i, 'corrective')).join('')}
      </div>
    </div>

    <!-- Preventive Actions -->
    <div class="glass-card-inset p-5 scale-in" style="animation-delay:0.2s">
      <div class="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div class="flex items-center gap-2">
          <svg class="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
          <h4 class="text-white font-semibold">Preventive Actions</h4>
        </div>
        <span class="${confidenceColor(pa.confidence)} text-xs font-mono">${(pa.confidence * 100).toFixed(0)}% confidence</span>
      </div>
      <div class="space-y-3" id="preventive-actions-list">
        ${pa.actions.map((a, i) => renderActionItem(a, i, 'preventive')).join('')}
      </div>
    </div>
  `;

  // Wire up approve/modify buttons
  container.addEventListener('click', (e) => {
    const approveBtn = e.target.closest('.action-approve-btn');
    const modifyBtn  = e.target.closest('.action-modify-btn');

    if (approveBtn) {
      const key = approveBtn.dataset.actionKey;
      approvedActions.add(key);
      modifiedActions.delete(key);
      updateActionItemUI(approveBtn.closest('.action-item-row'), 'approved');
    }

    if (modifyBtn) {
      const key = modifyBtn.dataset.actionKey;
      modifiedActions.add(key);
      approvedActions.delete(key);
      updateActionItemUI(modifyBtn.closest('.action-item-row'), 'modified');
    }
  });
}

function renderActionItem(a, i, type) {
  const key = `${type}-${i}`;
  const priorityClass = a.priority === 'Immediate' ? 'text-red-400 bg-red-500/15'
    : a.priority === 'High' ? 'text-amber-400 bg-amber-500/15'
    : 'text-blue-400 bg-blue-500/15';
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
          <span class="text-xs text-slate-500">Owner: <span class="text-slate-300">${a.owner}</span></span>
          ${a.status ? `<span class="badge ${a.status === 'Pending' ? 'badge-progress' : 'badge-active'} text-[10px]">${a.status}</span>` : ''}
        </div>
      </div>
      <div class="flex items-center gap-1.5 shrink-0">
        <button class="action-approve-btn px-2.5 py-1.5 text-xs rounded-lg border border-emerald-500/25 text-emerald-400
                       hover:bg-emerald-500/15 hover:border-emerald-500/50 transition-all cursor-pointer whitespace-nowrap"
                data-action-key="${key}">
          ✓ Approve
        </button>
        <button class="action-modify-btn px-2.5 py-1.5 text-xs rounded-lg border border-amber-500/25 text-amber-400
                       hover:bg-amber-500/15 hover:border-amber-500/50 transition-all cursor-pointer whitespace-nowrap"
                data-action-key="${key}">
          ✎ Modify
        </button>
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
    row.style.borderColor = 'rgba(16, 185, 129, 0.35)';
    row.style.background = 'rgba(16, 185, 129, 0.06)';
    if (approveBtn) {
      approveBtn.innerHTML = '✓ Approved';
      approveBtn.className = approveBtn.className.replace('border-emerald-500/25', 'border-emerald-500/60');
      approveBtn.classList.add('bg-emerald-500/20');
    }
    if (statusEl) { statusEl.textContent = 'Approved'; statusEl.className = 'badge badge-active text-[10px]'; }
  } else if (state === 'modified') {
    row.style.borderColor = 'rgba(245, 158, 11, 0.35)';
    row.style.background = 'rgba(245, 158, 11, 0.04)';
    if (modifyBtn) {
      modifyBtn.innerHTML = '✎ Modified';
      modifyBtn.classList.add('bg-amber-500/20');
    }
    if (statusEl) { statusEl.textContent = 'Modified'; statusEl.className = 'badge badge-review text-[10px]'; }
  }
}

// ---------- Risk Assessment ----------
function renderRiskAssessment(container) {
  const risk = CAPA_DETAIL.aiRiskAssessment;

  const riskColors = {
    Low:    'text-emerald-400 bg-emerald-500/15 border-emerald-500/30',
    Medium: 'text-amber-400 bg-amber-500/15 border-amber-500/30',
    High:   'text-red-400 bg-red-500/15 border-red-500/30',
  };

  container.innerHTML = `
    <div class="glass-card-inset p-5 scale-in" style="animation-delay:0.3s">
      <div class="flex items-center justify-between mb-5 flex-wrap gap-2">
        <div class="flex items-center gap-2">
          <svg class="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"></path></svg>
          <h4 class="text-white font-semibold">AI Risk Assessment</h4>
        </div>
        <span class="${confidenceColor(risk.confidence)} text-xs font-mono">${(risk.confidence * 100).toFixed(0)}% confidence</span>
      </div>

      <div class="grid grid-cols-3 gap-3 mb-5">
        <div class="text-center p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
          <p class="text-[10px] text-slate-400 uppercase tracking-wider mb-1.5">Severity</p>
          <p class="text-sm font-bold text-amber-400">${risk.severity}</p>
        </div>
        <div class="text-center p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
          <p class="text-[10px] text-slate-400 uppercase tracking-wider mb-1.5">Likelihood</p>
          <p class="text-sm font-bold text-red-400">${risk.likelihood}</p>
        </div>
        <div class="text-center p-3 rounded-xl border ${riskColors[risk.riskLevel] || riskColors['Medium']}">
          <p class="text-[10px] text-slate-400 uppercase tracking-wider mb-1.5">Risk Level</p>
          <p class="text-sm font-bold">${risk.riskLevel}</p>
        </div>
      </div>

      <div class="space-y-3">
        <div class="p-3 rounded-xl bg-white/[0.015] border border-white/[0.03]">
          <p class="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Customer Impact</p>
          <p class="text-sm text-slate-300 leading-relaxed">${risk.customerImpact}</p>
        </div>
        <div class="p-3 rounded-xl bg-white/[0.015] border border-white/[0.03]">
          <p class="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Regulatory Impact</p>
          <p class="text-sm text-slate-300 leading-relaxed">${risk.regulatoryImpact}</p>
        </div>
      </div>
    </div>
  `;
}

// ---------- CAPA Header ----------
function renderCAPAHeader(container) {
  const c = CAPA_DETAIL;

  container.innerHTML = `
    <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-5">
      <div>
        <div class="flex items-center gap-3 mb-2 flex-wrap">
          <span class="font-mono text-purple-400 text-base font-bold">${c.id}</span>
          <span class="badge badge-progress">${c.status}</span>
          <span class="badge badge-open">${c.priority} Priority</span>
          <span class="badge badge-ai">AI-Assisted</span>
        </div>
        <h3 class="text-xl font-bold text-white leading-tight">${c.title}</h3>
      </div>
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-x-5 gap-y-2 text-xs">
        <div>
          <span class="block text-slate-500 mb-0.5">Owner</span>
          <span class="text-slate-200 font-medium">${c.owner}</span>
        </div>
        <div>
          <span class="block text-slate-500 mb-0.5">Opened</span>
          <span class="text-slate-200 font-mono">${c.openedDate}</span>
        </div>
        <div>
          <span class="block text-slate-500 mb-0.5">Target Close</span>
          <span class="text-amber-400 font-mono font-medium">${c.targetClose}</span>
        </div>
        <div>
          <span class="block text-slate-500 mb-0.5">Related NCR</span>
          <span class="text-cyan-400 font-mono">${c.ncr}</span>
        </div>
      </div>
    </div>
    <div class="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
      <p class="text-sm text-slate-300 leading-relaxed">${c.description}</p>
    </div>
  `;
}

// ---------- Export ----------
export function initWorkflow() {
  // Reset action state
  approvedActions.clear();
  modifiedActions.clear();

  const headerContainer   = document.getElementById('capa-header');
  const timelineContainer = document.getElementById('capa-timeline');
  const rootCauseContainer = document.getElementById('capa-root-cause');
  const actionsContainer  = document.getElementById('capa-actions');
  const riskContainer     = document.getElementById('capa-risk');

  if (headerContainer)    renderCAPAHeader(headerContainer);
  if (timelineContainer)  renderTimeline(timelineContainer);
  if (rootCauseContainer) renderRootCause(rootCauseContainer);
  if (actionsContainer)   renderActions(actionsContainer);
  if (riskContainer)      renderRiskAssessment(riskContainer);
}
