// ============================================================================
// app.js — SPA routing, dashboard with animated counters, activity feed, nav
// Wired to real API via api.js — replaces data.js mock data
// ============================================================================

import { api } from './api.js';
import { initEffects, animateCounter, staggerFadeIn } from './effects.js';
import { initSearch } from './search.js';
import { initDocuments, onDocumentsVisible } from './documents.js';
import { initAudit } from './audit.js';
import { initGraph, startGraph, stopGraph } from './graph.js';
import { initWorkflow } from './workflow.js';

let currentScreen = 'dashboard';

// Cache health data for use across screens
let _healthCache = null;
export async function getHealth() {
  if (!_healthCache) {
    try { _healthCache = await api.health(); } catch (_) {}
  }
  return _healthCache;
}

// ---- Nav icons (SVG) ----
const ICONS = {
  grid: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>',
  search: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>',
  file: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>',
  workflow: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>',
  shield: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>',
  graph: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3" stroke-width="1.5"/><circle cx="5" cy="6" r="2" stroke-width="1.5"/><circle cx="19" cy="6" r="2" stroke-width="1.5"/><circle cx="5" cy="18" r="2" stroke-width="1.5"/><circle cx="19" cy="18" r="2" stroke-width="1.5"/><path stroke-linecap="round" stroke-width="1.5" d="M9.5 10.5L6.5 7.5M14.5 10.5l3-3M9.5 13.5l-3 3M14.5 13.5l3 3"/></svg>',
};

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard',       icon: 'grid' },
  { id: 'search',    label: 'AI Search',        icon: 'search' },
  { id: 'documents', label: 'Documents',        icon: 'file' },
  { id: 'workflow',  label: 'CAPA Agent',       icon: 'workflow' },
  { id: 'audit',     label: 'Audit Trail',      icon: 'shield' },
  { id: 'graph',     label: 'Knowledge Graph',  icon: 'graph' },
];

// ---- Activity feed icon map ----
const ACTIVITY_ICONS = {
  brain:    '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path></svg>',
  sparkles: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path></svg>',
  check:    '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>',
  search:   '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>',
  file:     '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>',
  shield:   '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>',
};

function auditEntryToFeedItem(entry) {
  const actionIconMap = {
    UPLOAD:            { icon: 'file',     type: 'classification' },
    EMBED:             { icon: 'brain',    type: 'classification' },
    SEARCH:            { icon: 'search',   type: 'analysis' },
    GENERATE_RCA:      { icon: 'sparkles', type: 'generation' },
    GENERATE_ANALYSIS: { icon: 'sparkles', type: 'generation' },
    CLASSIFY:          { icon: 'brain',    type: 'extraction' },
    APPROVE:           { icon: 'check',    type: 'review' },
    UPDATE_STATUS:     { icon: 'check',    type: 'update' },
  };
  const meta = actionIconMap[entry.action] || { icon: 'brain', type: 'classification' };

  const actionText = {
    UPLOAD:        `${entry.user_name} uploaded ${entry.resource_name || 'document'}`,
    EMBED:         `AI embedded chunks for ${entry.resource_name || 'document'}`,
    SEARCH:        `${entry.user_name} searched: ${(entry.details?.query || entry.resource_name || '').slice(0, 60)}`,
    GENERATE_RCA:  `AI generated RCA for ${entry.resource_name || 'CAPA'}`,
    CLASSIFY:      `AI classified ${entry.resource_name || 'document'}`,
    APPROVE:       `${entry.user_name} approved ${entry.resource_name || ''}`,
    UPDATE_STATUS: `${entry.user_name} updated ${entry.resource_name || ''}`,
  };

  const ts = new Date(entry.timestamp);
  const diffMin = Math.floor((Date.now() - ts) / 60000);
  const timeStr = diffMin < 1 ? 'Just now'
    : diffMin < 60 ? `${diffMin}m ago`
    : diffMin < 1440 ? `${Math.floor(diffMin / 60)}h ago`
    : ts.toLocaleDateString();

  return {
    time: timeStr,
    action: actionText[entry.action] || `${entry.action} — ${entry.resource_name || ''}`,
    type: meta.type,
    icon: meta.icon,
    aiInvolved: entry.ai_involved,
  };
}

// ---------- Navigation ----------
function renderNav() {
  const nav = document.getElementById('nav-items');
  if (!nav) return;

  nav.innerHTML = NAV_ITEMS.map((item, i) => `
    <div class="nav-item ${item.id === currentScreen ? 'active' : ''} fade-in-up"
         style="animation-delay: ${i * 0.05}s"
         data-screen="${item.id}">
      ${ICONS[item.icon] || ''}
      <span>${item.label}</span>
    </div>
  `).join('');

  nav.addEventListener('click', (e) => {
    const navItem = e.target.closest('.nav-item');
    if (!navItem) return;
    navigateTo(navItem.dataset.screen);
  });
}

function updateNavActive() {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.screen === currentScreen);
  });
}

// ---------- SPA Routing ----------
export function navigateTo(screenId) {
  if (currentScreen === 'graph') stopGraph();
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));

  currentScreen = screenId;
  updateNavActive();

  const target = document.getElementById(`screen-${screenId}`);
  if (target) target.classList.add('active');

  switch (screenId) {
    case 'dashboard': initDashboard();                                   break;
    case 'search':    initSearch();                                      break;
    case 'documents': initDocuments(); onDocumentsVisible();             break;
    case 'workflow':  initWorkflow();                                    break;
    case 'audit':     initAudit();                                       break;
    case 'graph':
      setTimeout(() => { initGraph(); startGraph(); }, 120);
      break;
  }

  const sidebar  = document.getElementById('sidebar');
  const sOverlay = document.getElementById('sidebar-overlay');
  if (sidebar && window.innerWidth < 1024) {
    sidebar.classList.remove('open');
    if (sOverlay) sOverlay.classList.remove('open');
  }

  history.replaceState(null, '', '#' + screenId);
}

// ---------- Dashboard ----------
async function initDashboard() {
  staggerFadeIn('.stat-card', 90);

  try {
    const [health, docs, allCapas, auditAI] = await Promise.all([
      api.health(),
      api.listDocuments(),
      api.listCapas(),
      api.getAudit({ ai_only: 'true', limit: 500 }),
    ]);

    _healthCache = health;

    const activeCAPAs    = allCapas.filter(c => ['Open', 'In Progress'].includes(c.status));
    const pendingReviews = allCapas.filter(c => c.status === 'Pending Review');

    const closedCapas      = allCapas.filter(c => c.status === 'Closed').length;
    const totalCapas       = allCapas.length || 1;
    const now              = new Date();
    const docsWithFutureR  = docs.filter(d => d.next_review && new Date(d.next_review) > now).length;
    const complianceScore  = Math.round(
      ((closedCapas / totalCapas) * 0.4 + (docsWithFutureR / (docs.length || 1)) * 0.6) * 100
    );

    const todayStart  = new Date(); todayStart.setHours(0, 0, 0, 0);
    const aiActionsToday = auditAI.filter(e => new Date(e.timestamp) >= todayStart).length;

    const counters = [
      { el: document.getElementById('stat-documents'),  target: docs.length,         suffix: '' },
      { el: document.getElementById('stat-capas'),      target: activeCAPAs.length,  suffix: '' },
      { el: document.getElementById('stat-compliance'), target: complianceScore,      suffix: '%' },
      { el: document.getElementById('stat-reviews'),    target: pendingReviews.length,suffix: '' },
      { el: document.getElementById('stat-ai-actions'), target: aiActionsToday,       suffix: '' },
    ];
    counters.forEach(c => { if (c.el) animateCounter(c.el, c.target, 1800, c.suffix); });

    // Ask AI card copy
    const askAiCard = document.getElementById('ask-ai-card');
    if (askAiCard && health.chunk_count) {
      const p = askAiCard.querySelector('p.text-xs');
      if (p) p.textContent = `Search across ${health.chunk_count.toLocaleString()} chunks indexed`;
    }

    // Top bar counter
    const topCounter = document.getElementById('stat-ai-actions-top');
    if (topCounter) topCounter.textContent = aiActionsToday;

    // Sidebar compliance bar
    const compFill  = document.querySelector('#sidebar .confidence-fill');
    const compLabel = document.querySelector('#sidebar .font-mono.text-emerald-400');
    if (compFill)  compFill.style.width = complianceScore + '%';
    if (compLabel) compLabel.textContent = complianceScore + '%';

    // Upcoming deadlines
    renderUpcomingDeadlines(allCapas.filter(c => c.status !== 'Closed' && c.target_close));

  } catch (err) {
    console.warn('Dashboard load error:', err);
  }

  await renderActivityFeed();
  startActivityStream();
}

function renderUpcomingDeadlines(capas) {
  // Find the deadlines container in the dashboard sidebar panel
  const panels = document.querySelectorAll('#screen-dashboard .glass-card-static');
  let container = null;
  for (const panel of panels) {
    if (panel.textContent.includes('Upcoming Deadlines')) {
      container = panel.querySelector('.space-y-2\\.5');
      break;
    }
  }
  if (!container) return;

  const sorted = [...capas]
    .sort((a, b) => new Date(a.target_close) - new Date(b.target_close))
    .slice(0, 4);

  const now = new Date();
  container.innerHTML = sorted.map(c => {
    const d       = new Date(c.target_close);
    const diff    = Math.ceil((d - now) / 86400000);
    const color   = diff < 14 ? 'text-red-400' : diff < 30 ? 'text-amber-400' : 'text-slate-300';
    const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `
      <div class="flex items-center justify-between">
        <span class="text-xs text-slate-300">${c.capa_number} Close</span>
        <span class="text-xs font-mono ${color}">${dateStr}</span>
      </div>
    `;
  }).join('');
}

let activityStreamTimer = null;
let lastAuditTimestamp  = null;

async function renderActivityFeed() {
  const feed = document.getElementById('activity-feed');
  if (!feed) return;

  const iconColor = {
    classification: 'text-purple-400', analysis: 'text-cyan-400',
    generation: 'text-emerald-400', update: 'text-amber-400',
    review: 'text-teal-400', extraction: 'text-pink-400',
  };

  try {
    const entries = await api.getAudit({ limit: 10 });
    if (entries.length) lastAuditTimestamp = entries[0].timestamp;

    feed.innerHTML = entries.map((entry, i) => {
      const item = auditEntryToFeedItem(entry);
      return `
        <div class="activity-item py-2.5 fade-in-up" style="animation-delay: ${i * 0.055}s">
          <div class="flex items-start gap-3">
            <span class="${iconColor[item.type] || 'text-purple-400'} shrink-0 mt-0.5">
              ${ACTIVITY_ICONS[item.icon] || ACTIVITY_ICONS.brain}
            </span>
            <div class="flex-1 min-w-0">
              <p class="text-sm text-slate-300 leading-snug">${item.action}</p>
              <p class="text-xs text-slate-500 mt-0.5">${item.time}</p>
            </div>
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    console.warn('Activity feed error:', err);
  }
}

function startActivityStream() {
  if (activityStreamTimer) clearInterval(activityStreamTimer);

  activityStreamTimer = setInterval(async () => {
    if (currentScreen !== 'dashboard') return;
    const feed = document.getElementById('activity-feed');
    if (!feed) return;

    try {
      const entries = await api.getAudit({ limit: 5 });
      const newEntries = lastAuditTimestamp
        ? entries.filter(e => e.timestamp > lastAuditTimestamp)
        : [];

      if (entries.length) lastAuditTimestamp = entries[0].timestamp;

      const iconColor = { classification: 'text-purple-400', analysis: 'text-cyan-400', generation: 'text-emerald-400', update: 'text-amber-400', review: 'text-teal-400', extraction: 'text-pink-400' };

      for (const entry of newEntries.reverse()) {
        const item    = auditEntryToFeedItem(entry);
        const newItem = document.createElement('div');
        newItem.className = 'activity-item py-2.5 scale-in';
        newItem.innerHTML = `
          <div class="flex items-start gap-3">
            <span class="${iconColor[item.type] || 'text-purple-400'} shrink-0 mt-0.5">
              ${ACTIVITY_ICONS[item.icon] || ACTIVITY_ICONS.brain}
            </span>
            <div class="flex-1 min-w-0">
              <p class="text-sm text-slate-300 leading-snug">${item.action}</p>
              <p class="text-xs text-slate-500 mt-0.5">${item.time}</p>
            </div>
            <span class="text-[10px] text-cyan-400 shrink-0 mt-1 font-mono">LIVE</span>
          </div>
        `;
        feed.insertBefore(newItem, feed.firstChild);
        const items = feed.querySelectorAll('.activity-item');
        if (items.length > 18) items[items.length - 1].remove();
      }
    } catch (_) {}
  }, 8000);
}

// ---------- Mobile sidebar ----------
function initMobileNav() {
  const toggle  = document.getElementById('sidebar-toggle');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');

  if (toggle && sidebar) {
    toggle.addEventListener('click', () => {
      sidebar.classList.toggle('open');
      if (overlay) overlay.classList.toggle('open');
    });
  }
  if (overlay && sidebar) {
    overlay.addEventListener('click', () => {
      sidebar.classList.remove('open');
      overlay.classList.remove('open');
    });
  }
}

// ---------- App Init ----------
export function initApp() {
  renderNav();
  initMobileNav();
  initEffects();

  const askAiCard = document.getElementById('ask-ai-card');
  if (askAiCard) {
    askAiCard.addEventListener('click', () => navigateTo('search'));
  }

  const hash         = window.location.hash.replace('#', '');
  const validScreens = NAV_ITEMS.map(n => n.id);
  const startScreen  = validScreens.includes(hash) ? hash : 'dashboard';
  navigateTo(startScreen);

  window.addEventListener('hashchange', () => {
    const h = window.location.hash.replace('#', '');
    if (h && h !== currentScreen && validScreens.includes(h)) navigateTo(h);
  });
}
