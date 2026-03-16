// ============================================================================
// audit.js — Audit trail table with filters, compliance badges, digital sigs
// ============================================================================

import { AUDIT_TRAIL } from './data.js';

let currentFilter = 'all';

function getActionBadge(action) {
  const lower = action.toLowerCase();
  if (lower.includes('approved'))                                   return '<span class="badge badge-active">Approved</span>';
  if (lower.includes('auto-classified') || lower.includes('auto-tagged')) return '<span class="badge badge-ai">AI Classified</span>';
  if (lower.includes('generated'))                                  return '<span class="badge badge-ai">AI Generated</span>';
  if (lower.includes('updated') || lower.includes('edited'))       return '<span class="badge badge-review">Modified</span>';
  if (lower.includes('viewed') || lower.includes('exported'))      return '<span class="badge badge-closed">Viewed</span>';
  if (lower.includes('uploaded'))                                   return '<span class="badge badge-progress">Uploaded</span>';
  if (lower.includes('created'))                                    return '<span class="badge badge-active">Created</span>';
  if (lower.includes('compliance') || lower.includes('review') || lower.includes('batch')) return '<span class="badge badge-ai">AI Scan</span>';
  if (lower.includes('flagged') || lower.includes('gap'))          return '<span class="badge badge-open">Flagged</span>';
  if (lower.includes('backup'))                                     return '<span class="badge badge-closed">System</span>';
  return `<span class="badge badge-closed">${action}</span>`;
}

function getSignatureIcon(sig) {
  if (sig === 'Verified') {
    return `<span class="flex items-center gap-1 text-emerald-400 text-xs font-medium">
      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04
                 A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622
                 0-1.042-.133-2.052-.382-3.016z"></path>
      </svg>
      Verified
    </span>`;
  }
  if (sig === 'System') {
    return `<span class="flex items-center gap-1 text-purple-400 text-xs font-medium">
      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
      </svg>
      System
    </span>`;
  }
  return '<span class="text-xs text-slate-600">—</span>';
}

function renderAuditTable(container, filter = 'all') {
  const filtered = filter === 'all'     ? AUDIT_TRAIL
    : filter === 'ai'                   ? AUDIT_TRAIL.filter(e => e.aiInvolved)
    : filter === 'human'                ? AUDIT_TRAIL.filter(e => !e.aiInvolved)
    : AUDIT_TRAIL;

  container.innerHTML = `
    <div class="overflow-x-auto">
      <table class="qms-table">
        <thead>
          <tr>
            <th>Timestamp</th>
            <th>User</th>
            <th>Role</th>
            <th>Action</th>
            <th>Document</th>
            <th>AI</th>
            <th>Signature</th>
          </tr>
        </thead>
        <tbody>
          ${filtered.map((entry, i) => `
            <tr class="fade-in-up" style="animation-delay: ${i * 0.03}s">
              <td>
                <span class="font-mono text-xs text-slate-400 tabular-nums">${entry.timestamp}</span>
              </td>
              <td>
                <div class="flex items-center gap-2">
                  ${entry.aiInvolved && entry.user.startsWith('AI')
                    ? `<div class="w-6 h-6 rounded-full bg-gradient-to-br from-purple-600 to-cyan-600
                                   flex items-center justify-center shrink-0 glow-pulse">
                         <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                 d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                         </svg>
                       </div>`
                    : `<div class="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center
                                   text-xs font-bold text-slate-300 shrink-0">
                         ${entry.user.charAt(0)}
                       </div>`
                  }
                  <span class="text-sm ${entry.aiInvolved && entry.user.startsWith('AI') ? 'text-purple-300' : 'text-slate-200'}">
                    ${entry.user}
                  </span>
                </div>
              </td>
              <td class="text-xs text-slate-400">${entry.role}</td>
              <td>${getActionBadge(entry.action)}</td>
              <td><span class="font-mono text-xs text-cyan-400">${entry.document}</span></td>
              <td>
                ${entry.aiInvolved
                  ? `<span class="inline-flex w-5 h-5 rounded-full bg-purple-500/20 items-center justify-center glow-pulse"
                           data-tooltip="AI action">
                       <span class="w-2 h-2 rounded-full bg-purple-400"></span>
                     </span>`
                  : '<span class="text-slate-600 text-xs">—</span>'}
              </td>
              <td>${getSignatureIcon(entry.signature)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function renderAuditFilters(container) {
  const filters = [
    { key: 'all',   label: 'All Events' },
    { key: 'ai',    label: '⚡ AI Actions' },
    { key: 'human', label: '👤 Human Actions' },
  ];

  // Clone to eliminate old listeners
  const fresh = container.cloneNode(false);
  container.replaceWith(fresh);

  fresh.innerHTML = `
    <div class="flex items-center gap-3 flex-wrap">
      ${filters.map(f => `
        <button class="filter-pill ${f.key === currentFilter ? 'active' : ''}" data-audit-filter="${f.key}">
          ${f.label}
        </button>
      `).join('')}
      <div class="ml-auto flex items-center gap-2 flex-wrap">
        <span class="badge badge-compliance flex items-center gap-1.5">
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04
                     A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622
                     0-1.042-.133-2.052-.382-3.016z"></path>
          </svg>
          21 CFR Part 11
        </span>
        <span class="badge badge-compliance flex items-center gap-1.5">
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04
                     A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622
                     0-1.042-.133-2.052-.382-3.016z"></path>
          </svg>
          ISO 9001
        </span>
      </div>
    </div>
  `;

  fresh.addEventListener('click', (e) => {
    const pill = e.target.closest('.filter-pill');
    if (!pill) return;
    currentFilter = pill.dataset.auditFilter;
    fresh.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
    const tableContainer = document.getElementById('audit-table-container');
    if (tableContainer) renderAuditTable(tableContainer, currentFilter);
  });
}

function renderAuditSummary(container) {
  const total    = AUDIT_TRAIL.length;
  const aiCount  = AUDIT_TRAIL.filter(e => e.aiInvolved).length;
  const verified = AUDIT_TRAIL.filter(e => e.signature === 'Verified').length;
  const pct = ((aiCount / total) * 100).toFixed(0);

  container.innerHTML = `
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <div class="glass-card-inset p-4 text-center">
        <div class="text-2xl font-bold gradient-text">${total}</div>
        <div class="text-xs text-slate-400 mt-1">Total Audit Events</div>
      </div>
      <div class="glass-card-inset p-4 text-center">
        <div class="text-2xl font-bold text-purple-400">${aiCount}</div>
        <div class="text-xs text-slate-400 mt-1">AI Actions Logged</div>
      </div>
      <div class="glass-card-inset p-4 text-center">
        <div class="text-2xl font-bold text-emerald-400">${verified}</div>
        <div class="text-xs text-slate-400 mt-1">Digitally Verified</div>
      </div>
      <div class="glass-card-inset p-4 text-center">
        <div class="text-2xl font-bold text-cyan-400">${pct}%</div>
        <div class="text-xs text-slate-400 mt-1">AI Involvement</div>
      </div>
    </div>
  `;
}

export function initAudit() {
  currentFilter = 'all';

  const summaryContainer = document.getElementById('audit-summary');
  const filtersContainer = document.getElementById('audit-filters');
  const tableContainer   = document.getElementById('audit-table-container');

  if (summaryContainer) renderAuditSummary(summaryContainer);

  // renderAuditFilters clones the container to avoid listener stacking,
  // so query the element by ID from DOM each time:
  if (filtersContainer) renderAuditFilters(filtersContainer);

  if (tableContainer) renderAuditTable(tableContainer);
}
