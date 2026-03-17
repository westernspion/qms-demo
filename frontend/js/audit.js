// ============================================================================
// audit.js — Audit Trail: table, filters, digital sig display
// Wired to real API via api.js. Visual behavior preserved exactly.
// ============================================================================

import { api } from './api.js';

let currentFilter = 'all';
let allEntries = [];

// Action badge rendering — maps action string to visual badge
function getActionBadge(action, aiInvolved) {
  const actionColors = {
    UPLOAD:            'badge-progress',
    EMBED:             'badge-ai',
    SEARCH:            'badge-ai',
    GENERATE_RCA:      'badge-ai',
    GENERATE_ANALYSIS: 'badge-ai',
    CLASSIFY:          'badge-ai',
    APPROVE:           'badge-active',
    UPDATE_STATUS:     'badge-review',
    VIEW:              'badge-closed',
    EXPORT:            'badge-closed',
  };
  const cls = actionColors[action] || (aiInvolved ? 'badge-ai' : 'badge-closed');
  return `<span class="badge ${cls}">${action}</span>`;
}

function getSignatureIcon(signature) {
  if (signature && signature.startsWith('sha256:')) {
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
  if (signature === 'System') {
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

function formatTimestamp(ts) {
  try {
    return new Date(ts).toLocaleString('en-US', {
      month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
  } catch (_) { return ts; }
}

function renderAuditTable(container, entries) {
  container.innerHTML = `
    <div class="overflow-x-auto">
      <table class="qms-table">
        <thead>
          <tr>
            <th>Timestamp</th><th>User</th><th>Role</th>
            <th>Action</th><th>Resource</th><th>AI</th><th>Signature</th>
          </tr>
        </thead>
        <tbody>
          ${entries.map((entry, i) => `
            <tr class="fade-in-up" style="animation-delay: ${i * 0.03}s">
              <td>
                <span class="font-mono text-xs text-slate-400 tabular-nums">
                  ${formatTimestamp(entry.timestamp)}
                </span>
              </td>
              <td>
                <div class="flex items-center gap-2">
                  ${entry.ai_involved && (entry.user_name || '').startsWith('AI')
                    ? `<div class="w-6 h-6 rounded-full bg-gradient-to-br from-purple-600 to-cyan-600
                                     flex items-center justify-center shrink-0 glow-pulse">
                         <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                         </svg>
                       </div>`
                    : `<div class="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center
                                     text-xs font-bold text-slate-300 shrink-0">
                         ${(entry.user_name || 'S').charAt(0)}
                       </div>`
                  }
                  <span class="text-sm ${entry.ai_involved && (entry.user_name || '').startsWith('AI') ? 'text-purple-300' : 'text-slate-200'}">
                    ${entry.user_name || '—'}
                  </span>
                </div>
              </td>
              <td class="text-xs text-slate-400">${entry.user_role || '—'}</td>
              <td>${getActionBadge(entry.action, entry.ai_involved)}</td>
              <td><span class="font-mono text-xs text-cyan-400">${entry.resource_name || '—'}</span></td>
              <td>
                ${entry.ai_involved
                  ? `<span class="inline-flex w-5 h-5 rounded-full bg-purple-500/20 items-center justify-center glow-pulse">
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

function filterEntries(filter) {
  switch (filter) {
    case 'ai':       return allEntries.filter(e => e.ai_involved);
    case 'human':    return allEntries.filter(e => !e.ai_involved);
    case 'documents': return allEntries.filter(e => e.resource_type === 'document');
    case 'capas':    return allEntries.filter(e => e.resource_type === 'capa');
    case 'search':   return allEntries.filter(e => e.resource_type === 'search');
    default:         return allEntries;
  }
}

function renderAuditFilters(container) {
  const filters = [
    { key: 'all',       label: 'All Events' },
    { key: 'human',     label: '👤 Human' },
    { key: 'ai',        label: '⚡ AI Only' },
    { key: 'documents', label: '📄 Documents' },
    { key: 'capas',     label: '⚠ CAPAs' },
    { key: 'search',    label: '🔍 Search' },
  ];

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
    if (tableContainer) renderAuditTable(tableContainer, filterEntries(currentFilter));
  });
}

function renderAuditSummary(container, entries) {
  const total    = entries.length;
  const aiCount  = entries.filter(e => e.ai_involved).length;
  const verified = entries.filter(e => e.signature && e.signature.startsWith('sha256:')).length;
  const pct      = total ? ((aiCount / total) * 100).toFixed(0) : 0;

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

  if (tableContainer) tableContainer.innerHTML = '<div class="animate-pulse p-8 text-center text-slate-500 text-sm">Loading audit log…</div>';

  api.getAudit({ limit: 50 }).then(entries => {
    allEntries = entries;

    if (summaryContainer) renderAuditSummary(summaryContainer, entries);
    if (filtersContainer) renderAuditFilters(filtersContainer);
    if (tableContainer)   renderAuditTable(tableContainer, entries);
  }).catch(err => {
    if (tableContainer) tableContainer.innerHTML = `<p class="text-red-400 text-sm p-4">Failed to load audit log: ${err.message}</p>`;
  });
}
