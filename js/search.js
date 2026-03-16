// ============================================================================
// search.js — AI Search with typewriter responses, citations, relevance scores
// ============================================================================

import { SEARCH_QUERIES } from './data.js';

let currentTypingTimeout = null;
let isTyping = false;
let typingChars = [];    // flat array of text chars/html-chunks to type
let typingIndex = 0;

// ---------- Markdown-ish to HTML ----------
function renderMarkdown(text) {
  // Process line by line for better control
  const lines = text.split('\n');
  let html = '';
  let inList = false;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Bold
    line = line.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>');
    // Italic
    line = line.replace(/\*(.*?)\*/g, '<em>$1</em>');
    // Inline code
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
      if (line.trim() === '') {
        html += '<br>';
      } else {
        html += `<span class="block mb-1">${line}</span>`;
      }
    }
  }
  if (inList) html += '</ul>';
  return html;
}

// ---------- Typewriter Effect ----------
// Builds a flat list of "chunks" (either a single visible char, or a full HTML tag)
// then types them one at a time into innerHTML safely.
function buildChunks(html) {
  const chunks = [];
  let i = 0;
  while (i < html.length) {
    if (html[i] === '<') {
      // Grab the full tag
      const close = html.indexOf('>', i);
      if (close !== -1) {
        chunks.push({ type: 'tag', val: html.slice(i, close + 1) });
        i = close + 1;
        continue;
      }
    }
    // Decode HTML entities as single chunk
    if (html[i] === '&') {
      const semi = html.indexOf(';', i);
      if (semi !== -1 && semi - i < 10) {
        chunks.push({ type: 'char', val: html.slice(i, semi + 1) });
        i = semi + 1;
        continue;
      }
    }
    chunks.push({ type: 'char', val: html[i] });
    i++;
  }
  return chunks;
}

function typewriterEffect(element, text, speed = 6, callback) {
  // Cancel any previous
  if (currentTypingTimeout) {
    clearTimeout(currentTypingTimeout);
    currentTypingTimeout = null;
  }

  element.innerHTML = '';
  element.classList.remove('done');
  element.classList.add('typewriter-cursor');
  isTyping = true;

  const html = renderMarkdown(text);
  typingChars = buildChunks(html);
  typingIndex = 0;

  // Skip-on-click: clicking the response area completes instantly
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

    // Auto-scroll if inside a scrollable container
    element.scrollTop = element.scrollHeight;

    // Variable speed for visible chars
    let delay = speed;
    if (chunk.type === 'tag') {
      delay = 0; // tags are invisible, write instantly
    } else {
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

    const relevancePercent = Math.round(source.relevance * 100);
    const relevanceColor = relevancePercent > 90 ? 'text-emerald-400'
      : relevancePercent > 80 ? 'text-cyan-400'
      : 'text-amber-400';

    card.innerHTML = `
      <div class="flex items-center justify-between mb-1.5">
        <span class="text-xs font-mono text-purple-400">${source.id}</span>
        <span class="${relevanceColor} text-xs font-semibold font-mono">${relevancePercent}%</span>
      </div>
      <p class="text-sm text-slate-200 font-medium mb-1.5 leading-snug">${source.title}</p>
      <p class="text-xs text-slate-500 leading-relaxed line-clamp-2">"${source.snippet}"</p>
      <div class="relevance-bar mt-2">
        <div class="relevance-fill" style="width: 0%"></div>
      </div>
    `;

    container.appendChild(card);

    // Animate relevance bar
    setTimeout(() => {
      const fill = card.querySelector('.relevance-fill');
      if (fill) fill.style.width = relevancePercent + '%';
    }, 300 + i * 120);
  });
}

// ---------- Best-match Query Finder ----------
function findMatchingQuery(input) {
  const lower = input.toLowerCase();

  const scores = SEARCH_QUERIES.map((q, idx) => {
    const queryWords = q.query.toLowerCase().split(/\s+/);
    const inputWords = lower.split(/\s+/).filter(w => w.length >= 3);
    let score = 0;

    for (const word of inputWords) {
      if (queryWords.some(qw => qw.includes(word) || word.includes(qw))) score += 1;
    }

    // Keyword boosts
    if ((lower.includes('nonconformance') || lower.includes('supplier') || lower.includes('silica') || lower.includes('trend') || lower.includes('q4')) && idx === 0) score += 4;
    if ((lower.includes('capa') || (lower.includes('fiber') && !lower.includes('training')) || lower.includes('open')) && idx === 1) score += 4;
    if ((lower.includes('training') || lower.includes('fusion') || lower.includes('operator') || lower.includes('certif')) && idx === 2) score += 4;

    return { query: q, score };
  });

  scores.sort((a, b) => b.score - a.score);
  return scores[0].score > 0 ? scores[0].query : SEARCH_QUERIES[0];
}

// ---------- AI "Thinking" Dots Animation ----------
function showThinkingDots(container) {
  container.innerHTML = `
    <div class="flex items-center gap-1.5 py-2">
      <div class="thinking-dot"></div>
      <div class="thinking-dot" style="animation-delay:0.15s"></div>
      <div class="thinking-dot" style="animation-delay:0.3s"></div>
    </div>
  `;
}

// ---------- Main Search Handler ----------
export function handleSearch(query) {
  if (currentTypingTimeout) {
    clearTimeout(currentTypingTimeout);
    currentTypingTimeout = null;
  }

  const responseArea = document.getElementById('search-response');
  const citationsPanel = document.getElementById('search-citations');
  const searchStatus = document.getElementById('search-status');
  const searchResultArea = document.getElementById('search-result-area');

  if (!responseArea || !citationsPanel) return;

  searchResultArea && searchResultArea.classList.remove('hidden');

  // Clear previous
  responseArea.innerHTML = '';
  citationsPanel.innerHTML = '';

  // Step 1: Searching status
  if (searchStatus) {
    searchStatus.innerHTML = `
      <div class="flex items-center gap-3 py-1">
        <div class="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full spin shrink-0"></div>
        <span class="text-sm text-slate-400">Searching across <strong class="text-purple-400 font-mono">12,847</strong> documents…</span>
      </div>
    `;
  }

  // Show thinking dots in response area
  showThinkingDots(responseArea);

  const match = findMatchingQuery(query);

  // Step 2: Analyzing sources
  setTimeout(() => {
    if (searchStatus) {
      searchStatus.innerHTML = `
        <div class="flex items-center gap-3 py-1">
          <div class="w-4 h-4 border-2 border-cyan-500 border-t-transparent rounded-full spin shrink-0"></div>
          <span class="text-sm text-slate-400">Reading <strong class="text-cyan-400 font-mono">${match.sources.length} relevant sources</strong>… synthesizing answer</span>
        </div>
      `;
    }
  }, 900);

  // Step 3: Render response
  setTimeout(() => {
    if (searchStatus) {
      searchStatus.innerHTML = `
        <div class="flex items-center gap-3 py-1">
          <svg class="w-4 h-4 text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
          <span class="text-sm text-slate-400">
            Found <strong class="text-emerald-400">${match.sources.length} sources</strong> · synthesized in <strong class="font-mono text-emerald-400">1.2s</strong>
            <span class="badge badge-ai ml-2">RAG-Powered</span>
          </span>
        </div>
      `;
    }

    responseArea.innerHTML = '';
    typewriterEffect(responseArea, match.response, 5, () => {
      // After typing, animate citations in
      setTimeout(() => renderCitations(match.sources, citationsPanel), 200);
    });
  }, 1800);
}

// ---------- Suggested Queries ----------
export function renderSuggestedQueries(container) {
  if (!container) return;

  const icons = ['📊', '🔧', '🎓'];
  container.innerHTML = SEARCH_QUERIES.map((q, i) => `
    <button class="suggested-query text-left px-4 py-3 rounded-xl border border-white/[0.06] bg-white/[0.02]
                   hover:border-purple-500/40 hover:bg-purple-500/[0.07] transition-all duration-300 group cursor-pointer"
            data-query="${q.query.replace(/"/g, '&quot;')}">
      <div class="flex items-center gap-2 mb-1.5">
        <span class="text-base">${icons[i] || '🔍'}</span>
        <span class="text-[10px] text-slate-500 uppercase tracking-widest">Try asking</span>
      </div>
      <p class="text-sm text-slate-300 group-hover:text-white transition-colors leading-snug">${q.query}</p>
    </button>
  `).join('');
}

export function initSearch() {
  const searchInput = document.getElementById('search-input');
  const searchBtn = document.getElementById('search-btn');
  const suggestedContainer = document.getElementById('suggested-queries');

  // Render suggested queries fresh each time
  if (suggestedContainer) {
    renderSuggestedQueries(suggestedContainer);

    // Use replaceWith pattern to avoid duplicate listeners
    const newContainer = suggestedContainer.cloneNode(false);
    newContainer.innerHTML = suggestedContainer.innerHTML;
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

  // Re-wire search input (clone to drop old listeners)
  if (searchInput) {
    const newInput = searchInput.cloneNode(true);
    searchInput.replaceWith(newInput);
    newInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && newInput.value.trim()) {
        handleSearch(newInput.value.trim());
      }
    });

    // Re-wire button
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
