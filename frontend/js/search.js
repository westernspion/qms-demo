// ============================================================================
// search.js — AI Search: SSE consumer, typewriter, citations
// Wired to real API via api.js. Visual behavior preserved exactly.
// ============================================================================

import { api } from './api.js';
import { getHealth } from './app.js';

let currentTypingTimeout = null;
let isTyping = false;
let typingChars = [];
let typingIndex = 0;

// ---------- Markdown-ish to HTML ----------
function renderMarkdown(text) {
  const lines = text.split('\n');
  let html = '';
  let inList = false;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    line = line.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>');
    line = line.replace(/\*(.*?)\*/g, '<em>$1</em>');
    line = line.replace(/`([^`]+)`/g, '<code>$1</code>');

    if (line.trim() === '---') {
      if (inList) { html += '</ul>'; inList = false; }
      html += '<hr>';
    } else if (/^[\-\*] /.test(line)) {
      if (!inList) { html += '<ul class="list-disc ml-4 space-y-1 my-2">'; inList = true; }
      html += `<li>${line.replace(/^[\-\*] /, '')}</li>`;
    } else if (/^\d+\. /.test(line)) {
      if (!inList) { html += '<ol class="list-decimal ml-4 space-y-1 my-2">'; inList = true; }
      html += `<li>${line.replace(/^\d+\. /, '')}</li>`;
    } else {
      if (inList) { html += '</ul>'; inList = false; }
      html += line.trim() === '' ? '<br>' : `<span class="block mb-1">${line}</span>`;
    }
  }
  if (inList) html += '</ul>';
  return html;
}

// ---------- Typewriter Effect ----------
function buildChunks(html) {
  const chunks = [];
  let i = 0;
  while (i < html.length) {
    if (html[i] === '<') {
      const close = html.indexOf('>', i);
      if (close !== -1) { chunks.push({ type: 'tag', val: html.slice(i, close + 1) }); i = close + 1; continue; }
    }
    if (html[i] === '&') {
      const semi = html.indexOf(';', i);
      if (semi !== -1 && semi - i < 10) { chunks.push({ type: 'char', val: html.slice(i, semi + 1) }); i = semi + 1; continue; }
    }
    chunks.push({ type: 'char', val: html[i] });
    i++;
  }
  return chunks;
}

function typewriterEffect(element, text, speed = 6, callback) {
  if (currentTypingTimeout) { clearTimeout(currentTypingTimeout); currentTypingTimeout = null; }

  element.innerHTML = '';
  element.classList.remove('done');
  element.classList.add('typewriter-cursor');
  isTyping = true;

  const html = renderMarkdown(text);
  typingChars = buildChunks(html);
  typingIndex = 0;

  function completeInstantly() {
    if (!isTyping) return;
    clearTimeout(currentTypingTimeout);
    element.innerHTML = html;
    element.classList.add('done');
    element.classList.remove('typewriter-cursor');
    isTyping = false;
    element.removeEventListener('click', completeInstantly);
    if (callback) callback();
  }
  element.addEventListener('click', completeInstantly, { once: true });

  function type() {
    if (typingIndex >= typingChars.length) {
      element.classList.add('done');
      element.classList.remove('typewriter-cursor');
      isTyping = false;
      element.removeEventListener('click', completeInstantly);
      if (callback) callback();
      return;
    }
    const chunk = typingChars[typingIndex++];
    element.innerHTML += chunk.val;
    element.scrollTop = element.scrollHeight;

    let delay = speed;
    if (chunk.type === 'tag') delay = 0;
    else {
      const ch = chunk.val;
      if (ch === '.' || ch === ':' || ch === '!') delay = speed * 5;
      else if (ch === ',') delay = speed * 2.5;
      else if (ch === ' ' || ch === '\n') delay = speed * 0.3;
    }
    currentTypingTimeout = setTimeout(type, delay);
  }
  type();
}

// ---------- Citations Panel ----------
function renderCitations(sources, container) {
  container.innerHTML = '';
  sources.forEach((source, i) => {
    const card = document.createElement('div');
    card.className = 'citation-card fade-in-up';
    card.style.animationDelay = `${i * 0.1}s`;

    const relevancePercent = Math.round((source.relevance || 0) * 100);
    const relevanceColor = relevancePercent > 90 ? 'text-emerald-400' : relevancePercent > 80 ? 'text-cyan-400' : 'text-amber-400';

    card.innerHTML = `
      <div class="flex items-center justify-between mb-1.5">
        <span class="text-xs font-mono text-purple-400">${source.doc_number || source.id || ''}</span>
        <span class="${relevanceColor} text-xs font-semibold font-mono">${relevancePercent}%</span>
      </div>
      <p class="text-sm text-slate-200 font-medium mb-1.5 leading-snug">${source.title || ''}</p>
      <p class="text-xs text-slate-500 leading-relaxed line-clamp-2">"${source.snippet || ''}"</p>
      <div class="relevance-bar mt-2"><div class="relevance-fill" style="width: 0%"></div></div>
    `;
    container.appendChild(card);
    setTimeout(() => {
      const fill = card.querySelector('.relevance-fill');
      if (fill) fill.style.width = relevancePercent + '%';
    }, 300 + i * 120);
  });
}

// ---------- Suggested Queries ----------
const SUGGESTED_QUERIES = [
  'What are our nonconformance trends for Silica Source in Q4?',
  'What open CAPAs are related to fiber draw tension?',
  'Which operators have expiring certifications for FDM?',
];

export function renderSuggestedQueries(container) {
  if (!container) return;
  const icons = ['📊', '🔧', '🎓'];
  container.innerHTML = SUGGESTED_QUERIES.map((q, i) => `
    <button class="suggested-query text-left px-4 py-3 rounded-xl border border-white/[0.06] bg-white/[0.02]
                   hover:border-purple-500/40 hover:bg-purple-500/[0.07] transition-all duration-300 group cursor-pointer"
            data-query="${q.replace(/"/g, '&quot;')}">
      <div class="flex items-center gap-2 mb-1.5">
        <span class="text-base">${icons[i] || '🔍'}</span>
        <span class="text-[10px] text-slate-500 uppercase tracking-widest">Try asking</span>
      </div>
      <p class="text-sm text-slate-300 group-hover:text-white transition-colors leading-snug">${q}</p>
    </button>
  `).join('');
}

// ---------- Main Search Handler — SSE wired ----------
export function handleSearch(query) {
  if (currentTypingTimeout) { clearTimeout(currentTypingTimeout); currentTypingTimeout = null; }

  const responseArea     = document.getElementById('search-response');
  const citationsPanel   = document.getElementById('search-citations');
  const searchStatus     = document.getElementById('search-status');
  const searchResultArea = document.getElementById('search-result-area');

  if (!responseArea || !citationsPanel) return;

  searchResultArea && searchResultArea.classList.remove('hidden');
  responseArea.innerHTML = '';
  citationsPanel.innerHTML = '';

  // Initial status
  getHealth().then(health => {
    const n = (health?.chunk_count || 0).toLocaleString();
    if (searchStatus) {
      searchStatus.innerHTML = `
        <div class="flex items-center gap-3 py-1">
          <div class="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full spin shrink-0"></div>
          <span class="text-sm text-slate-400">Embedding query and searching <strong class="text-purple-400 font-mono">${n}</strong> chunks…</span>
        </div>
      `;
    }
  });

  // Thinking dots
  responseArea.innerHTML = `
    <div class="flex items-center gap-1.5 py-2">
      <div class="thinking-dot"></div>
      <div class="thinking-dot" style="animation-delay:0.15s"></div>
      <div class="thinking-dot" style="animation-delay:0.3s"></div>
    </div>
  `;

  let fullResponse = '';
  let sources = [];

  api.search(query, (event) => {
    if (event.type === 'status') {
      if (searchStatus) {
        const cyan = event.message.includes('Reading') || event.message.includes('synthesizing');
        searchStatus.innerHTML = `
          <div class="flex items-center gap-3 py-1">
            <div class="w-4 h-4 border-2 border-${cyan ? 'cyan' : 'purple'}-500 border-t-transparent rounded-full spin shrink-0"></div>
            <span class="text-sm text-slate-400">${event.message}</span>
          </div>
        `;
      }
    } else if (event.type === 'sources') {
      sources = event.sources || [];
    } else if (event.type === 'token') {
      fullResponse += event.content || '';
    } else if (event.type === 'done') {
      const elapsed = ((event.elapsed_ms || 0) / 1000).toFixed(1);
      const srcCount = sources.length || (event.sources || []).length;
      if (searchStatus) {
        searchStatus.innerHTML = `
          <div class="flex items-center gap-3 py-1">
            <svg class="w-4 h-4 text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
            <span class="text-sm text-slate-400">
              Found <strong class="text-emerald-400">${srcCount} sources</strong> · synthesized in <strong class="font-mono text-emerald-400">${elapsed}s</strong>
              <span class="badge badge-ai ml-2">RAG-Powered</span>
            </span>
          </div>
        `;
      }
      responseArea.innerHTML = '';
      typewriterEffect(responseArea, fullResponse || 'No response generated.', 5, () => {
        setTimeout(() => renderCitations(sources.length ? sources : (event.sources || []), citationsPanel), 200);
      });
    } else if (event.type === 'error') {
      responseArea.innerHTML = `<p class="text-red-400 text-sm">Search error: ${event.message}</p>`;
    }
  });
}

// ---------- Init ----------
export function initSearch() {
  const searchInput        = document.getElementById('search-input');
  const suggestedContainer = document.getElementById('suggested-queries');

  getHealth().then(health => {
    const badge = document.querySelector('#screen-search .inline-flex span');
    if (badge && health?.chunk_count) {
      badge.textContent = `RAG · ${health.chunk_count.toLocaleString()} chunks indexed`;
    }
  });

  if (suggestedContainer) {
    const newContainer = suggestedContainer.cloneNode(false);
    suggestedContainer.replaceWith(newContainer);
    renderSuggestedQueries(newContainer);
    newContainer.addEventListener('click', (e) => {
      const btn = e.target.closest('.suggested-query');
      if (!btn) return;
      const query = btn.dataset.query;
      if (searchInput) searchInput.value = query;
      handleSearch(query);
    });
  }

  if (searchInput) {
    const newInput = searchInput.cloneNode(true);
    searchInput.replaceWith(newInput);
    newInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && newInput.value.trim()) handleSearch(newInput.value.trim());
    });

    const btn = document.getElementById('search-btn');
    if (btn) {
      const newBtn = btn.cloneNode(true);
      btn.replaceWith(newBtn);
      newBtn.addEventListener('click', () => {
        const input = document.getElementById('search-input');
        if (input && input.value.trim()) handleSearch(input.value.trim());
      });
    }
  }
}
