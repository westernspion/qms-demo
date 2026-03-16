// ============================================================================
// app.js — SPA routing, dashboard with animated counters, activity feed, nav
// ============================================================================

import { COMPANY, STATS, AI_ACTIVITY, NAV_ITEMS } from './data.js';
import { initEffects, animateCounter, staggerFadeIn } from './effects.js';
import { initSearch } from './search.js';
import { initDocuments, onDocumentsVisible } from './documents.js';
import { initAudit } from './audit.js';
import { initGraph, startGraph, stopGraph } from './graph.js';
import { initWorkflow } from './workflow.js';

let currentScreen = 'dashboard';

// ---- Nav icons (SVG) ----
const ICONS = {
  grid: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>',
  search: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>',
  file: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>',
  workflow: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>',
  shield: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>',
  graph: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3" stroke-width="1.5"/><circle cx="5" cy="6" r="2" stroke-width="1.5"/><circle cx="19" cy="6" r="2" stroke-width="1.5"/><circle cx="5" cy="18" r="2" stroke-width="1.5"/><circle cx="19" cy="18" r="2" stroke-width="1.5"/><path stroke-linecap="round" stroke-width="1.5" d="M9.5 10.5L6.5 7.5M14.5 10.5l3-3M9.5 13.5l-3 3M14.5 13.5l3 3"/></svg>',
};

// ---- Activity feed icon map ----
const ACTIVITY_ICONS = {
  brain:    '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path></svg>',
  sparkles: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path></svg>',
  link:     '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg>',
  flag:     '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2z"></path></svg>',
  wand:     '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>',
  shield:   '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>',
  check:    '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>',
  alert:    '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"></path></svg>',
  search:   '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>',
  file:     '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>',
};

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
  // Stop graph if leaving graph screen
  if (currentScreen === 'graph') stopGraph();

  // Hide all screens
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));

  currentScreen = screenId;
  updateNavActive();

  const target = document.getElementById(`screen-${screenId}`);
  if (target) target.classList.add('active');

  // Screen-specific init
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

  // Close mobile sidebar
  const sidebar  = document.getElementById('sidebar');
  const sOverlay = document.getElementById('sidebar-overlay');
  if (sidebar && window.innerWidth < 1024) {
    sidebar.classList.remove('open');
    if (sOverlay) sOverlay.classList.remove('open');
  }

  // Sync URL hash
  history.replaceState(null, '', '#' + screenId);
}

// ---------- Dashboard ----------
function initDashboard() {
  const counters = [
    { el: document.getElementById('stat-documents'),  target: STATS.totalDocuments,  suffix: '' },
    { el: document.getElementById('stat-capas'),      target: STATS.activeCAPAs,     suffix: '' },
    { el: document.getElementById('stat-compliance'), target: STATS.complianceScore, suffix: '%' },
    { el: document.getElementById('stat-reviews'),    target: STATS.pendingReviews,  suffix: '' },
    { el: document.getElementById('stat-ai-actions'), target: STATS.aiActionsToday,  suffix: '' },
  ];

  counters.forEach(c => {
    if (c.el) animateCounter(c.el, c.target, 1800, c.suffix);
  });

  renderActivityFeed();
  staggerFadeIn('.stat-card', 90);

  // Auto-stream new activity items every 8 seconds (live feel)
  startActivityStream();
}

// ---- Live activity stream simulation ----
let activityStreamTimer = null;
const LIVE_EVENTS = [
  { time: 'Just now', action: 'AI re-indexed WI-4455 after parameter update', type: 'classification', icon: 'brain' },
  { time: 'Just now', action: 'Similarity match found: NCR-2024-156 ≈ NCR-2024-141 (91% match)', type: 'flag', icon: 'flag' },
  { time: 'Just now', action: 'Corrective action CAPA-089 CA-1 approved by J. Rodriguez', type: 'review', icon: 'check' },
  { time: 'Just now', action: 'AI generated supplier risk score update for SUP-001 → Medium-High', type: 'update', icon: 'shield' },
  { time: 'Just now', action: 'Auto-extracted 7 regulatory references from AR-2024-EXT', type: 'extraction', icon: 'sparkles' },
];
let liveEventIndex = 0;

function startActivityStream() {
  if (activityStreamTimer) clearInterval(activityStreamTimer);

  activityStreamTimer = setInterval(() => {
    if (currentScreen !== 'dashboard') return;

    const feed = document.getElementById('activity-feed');
    if (!feed) return;

    const evt = LIVE_EVENTS[liveEventIndex % LIVE_EVENTS.length];
    liveEventIndex++;

    const iconColor = {
      classification: 'text-purple-400',
      analysis: 'text-cyan-400',
      detection: 'text-blue-400',
      flag: 'text-red-400',
      generation: 'text-emerald-400',
      update: 'text-amber-400',
      review: 'text-teal-400',
      training: 'text-red-400',
      xref: 'text-indigo-400',
      extraction: 'text-pink-400',
    };

    const newItem = document.createElement('div');
    newItem.className = 'activity-item py-2.5 scale-in';
    newItem.innerHTML = `
      <div class="flex items-start gap-3">
        <span class="${iconColor[evt.type] || 'text-purple-400'} shrink-0 mt-0.5">
          ${ACTIVITY_ICONS[evt.icon] || ACTIVITY_ICONS.brain}
        </span>
        <div class="flex-1 min-w-0">
          <p class="text-sm text-slate-300 leading-snug">${evt.action}</p>
          <p class="text-xs text-slate-500 mt-0.5">${evt.time}</p>
        </div>
        <span class="text-[10px] text-cyan-400 shrink-0 mt-1 font-mono">LIVE</span>
      </div>
    `;

    feed.insertBefore(newItem, feed.firstChild);

    // Remove oldest if too many
    const items = feed.querySelectorAll('.activity-item');
    if (items.length > 18) items[items.length - 1].remove();

    // Update "AI actions today" counter
    const topCounter = document.getElementById('stat-ai-actions-top');
    if (topCounter) {
      const current = parseInt(topCounter.textContent) || STATS.aiActionsToday;
      topCounter.textContent = current + 1;
    }
  }, 8000);
}

function renderActivityFeed() {
  const feed = document.getElementById('activity-feed');
  if (!feed) return;

  const iconColor = {
    classification: 'text-purple-400',
    analysis: 'text-cyan-400',
    detection: 'text-blue-400',
    flag: 'text-red-400',
    generation: 'text-emerald-400',
    update: 'text-amber-400',
    review: 'text-teal-400',
    training: 'text-red-400',
    xref: 'text-indigo-400',
    extraction: 'text-pink-400',
  };

  feed.innerHTML = AI_ACTIVITY.map((item, i) => `
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
  `).join('');
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

// ---------- Company branding ----------
function renderBranding() {
  const brandName = document.getElementById('brand-name');
  const brandTag  = document.getElementById('brand-tagline');
  if (brandName) brandName.textContent = COMPANY.name;
  if (brandTag)  brandTag.textContent  = COMPANY.division;
}

// ---------- App Init ----------
export function initApp() {
  renderBranding();
  renderNav();
  initMobileNav();
  initEffects();

  // Wire up "Ask AI Anything" dashboard card
  const askAiCard = document.getElementById('ask-ai-card');
  if (askAiCard) {
    askAiCard.addEventListener('click', () => navigateTo('search'));
  }

  // Route from hash
  const hash = window.location.hash.replace('#', '');
  const validScreens = NAV_ITEMS.map(n => n.id);
  const startScreen  = validScreens.includes(hash) ? hash : 'dashboard';
  navigateTo(startScreen);

  // Handle browser back/forward
  window.addEventListener('hashchange', () => {
    const h = window.location.hash.replace('#', '');
    if (h && h !== currentScreen && validScreens.includes(h)) {
      navigateTo(h);
    }
  });
}
