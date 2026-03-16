// ============================================================================
// graph.js — Knowledge Graph visualization using Canvas
// Force-directed layout with animated edges, interactive nodes
// ============================================================================

import { KNOWLEDGE_GRAPH, GRAPH_COLORS } from './data.js';

let canvas, ctx;
let nodes = [];
let edges = [];
let animationId = null;
let selectedNode = null;
let hoveredNode = null;
let isDragging = false;
let dragNode = null;
let mouse = { x: 0, y: 0 };
let time = 0;

// Event handler refs for cleanup
let _mousemove, _mousedown, _mouseup, _mouseleave, _resizeHandler;

// Force-directed layout parameters
const REPULSION = 3200;
const ATTRACTION = 0.007;
const DAMPING = 0.90;
const CENTER_GRAVITY = 0.012;

function initNodes() {
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;

  nodes = KNOWLEDGE_GRAPH.nodes.map(n => ({
    ...n,
    x: cx + (Math.random() - 0.5) * 500,
    y: cy + (Math.random() - 0.5) * 380,
    vx: 0,
    vy: 0,
    targetSize: n.size,
    currentSize: n.size,
    glowIntensity: 0,
    color: GRAPH_COLORS[n.group] || '#8b5cf6',
    spawnAlpha: 0,  // fade in on first render
  }));

  edges = KNOWLEDGE_GRAPH.edges.map(e => ({
    ...e,
    pulse: Math.random() * Math.PI * 2,
    alpha: 0,  // fade in
  }));
}

function getNode(id) {
  return nodes.find(n => n.id === id);
}

// Physics simulation
function simulate() {
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i];
      const b = nodes[j];
      let dx = a.x - b.x;
      let dy = a.y - b.y;
      let dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 1) dist = 1;

      const force = REPULSION / (dist * dist);
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;

      a.vx += fx;
      a.vy += fy;
      b.vx -= fx;
      b.vy -= fy;
    }
  }

  for (const edge of edges) {
    const a = getNode(edge.source);
    const b = getNode(edge.target);
    if (!a || !b) continue;

    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;

    const force = dist * ATTRACTION;
    const fx = (dx / dist) * force;
    const fy = (dy / dist) * force;

    a.vx += fx;
    a.vy += fy;
    b.vx -= fx;
    b.vy -= fy;
  }

  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  for (const node of nodes) {
    node.vx += (cx - node.x) * CENTER_GRAVITY;
    node.vy += (cy - node.y) * CENTER_GRAVITY;
  }

  for (const node of nodes) {
    if (node === dragNode) continue;

    // Speed cap
    const speed = Math.sqrt(node.vx * node.vx + node.vy * node.vy);
    if (speed > 6) {
      node.vx = (node.vx / speed) * 6;
      node.vy = (node.vy / speed) * 6;
    }

    node.vx *= DAMPING;
    node.vy *= DAMPING;
    node.x += node.vx;
    node.y += node.vy;

    const margin = 50;
    node.x = Math.max(margin, Math.min(canvas.width - margin, node.x));
    node.y = Math.max(margin, Math.min(canvas.height - margin, node.y));

    // Spawn fade in
    if (node.spawnAlpha < 1) node.spawnAlpha = Math.min(1, node.spawnAlpha + 0.02);
  }
}

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function draw() {
  time += 0.012;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw edges
  for (const edge of edges) {
    const a = getNode(edge.source);
    const b = getNode(edge.target);
    if (!a || !b) continue;

    const alpha = Math.min(a.spawnAlpha, b.spawnAlpha);
    const isHighlighted = selectedNode && (edge.source === selectedNode.id || edge.target === selectedNode.id);
    const isHoverHL = hoveredNode && (edge.source === hoveredNode.id || edge.target === hoveredNode.id);

    // Main line
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);

    if (isHighlighted) {
      ctx.strokeStyle = `rgba(139, 92, 246, ${0.7 * alpha})`;
      ctx.lineWidth = 1.8;
    } else if (isHoverHL) {
      ctx.strokeStyle = `rgba(6, 182, 212, ${0.5 * alpha})`;
      ctx.lineWidth = 1.2;
    } else if (selectedNode) {
      ctx.strokeStyle = `rgba(100, 116, 139, ${0.06 * alpha})`;
      ctx.lineWidth = 0.5;
    } else {
      ctx.strokeStyle = `rgba(100, 116, 139, ${0.18 * alpha})`;
      ctx.lineWidth = 0.8;
    }
    ctx.stroke();

    // Animated pulse dot along edge
    if (isHighlighted || (!selectedNode && !hoveredNode)) {
      edge.pulse += 0.018;
      const t = (Math.sin(edge.pulse) + 1) / 2;
      const px = a.x + (b.x - a.x) * t;
      const py = a.y + (b.y - a.y) * t;
      ctx.beginPath();
      ctx.arc(px, py, isHighlighted ? 3 : 1.5, 0, Math.PI * 2);
      ctx.fillStyle = isHighlighted
        ? `rgba(6, 182, 212, ${0.9 * alpha})`
        : `rgba(139, 92, 246, ${0.35 * alpha})`;
      ctx.fill();
    }

    // Edge label on highlight
    if (isHighlighted && edge.label) {
      const mx = (a.x + b.x) / 2;
      const my = (a.y + b.y) / 2;
      ctx.save();
      ctx.font = '10px Inter, sans-serif';
      ctx.fillStyle = `rgba(148, 163, 184, ${0.85 * alpha})`;
      ctx.textAlign = 'center';
      ctx.fillText(edge.label, mx, my - 7);
      ctx.restore();
    }
  }

  // Draw nodes
  for (const node of nodes) {
    const isSelected = selectedNode && selectedNode.id === node.id;
    const isHovered = hoveredNode && hoveredNode.id === node.id;
    const isConnected = selectedNode && edges.some(e =>
      (e.source === selectedNode.id && e.target === node.id) ||
      (e.target === selectedNode.id && e.source === node.id)
    );
    const dimmed = selectedNode && !isSelected && !isConnected;
    const spawnAlpha = node.spawnAlpha;

    // Animated size
    node.targetSize = (isSelected || isHovered) ? node.size * 1.45 : node.size;
    node.currentSize += (node.targetSize - node.currentSize) * 0.12;
    const r = node.currentSize;

    // Glow intensity
    if (isSelected || isHovered || isConnected) {
      node.glowIntensity = Math.min(node.glowIntensity + 0.06, 1);
    } else {
      node.glowIntensity = Math.max(node.glowIntensity - 0.04, 0);
    }

    // Glow halo
    if (node.glowIntensity > 0) {
      const glowR = r * 3.5;
      const gradient = ctx.createRadialGradient(node.x, node.y, r * 0.5, node.x, node.y, glowR);
      gradient.addColorStop(0, hexToRgba(node.color, 0.3 * node.glowIntensity * spawnAlpha));
      gradient.addColorStop(1, hexToRgba(node.color, 0));
      ctx.beginPath();
      ctx.arc(node.x, node.y, glowR, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();
    }

    // Outer ring for selected
    if (isSelected) {
      ctx.beginPath();
      ctx.arc(node.x, node.y, r + 4, 0, Math.PI * 2);
      ctx.strokeStyle = hexToRgba(node.color, 0.5 * spawnAlpha);
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Node fill
    ctx.beginPath();
    ctx.arc(node.x, node.y, r, 0, Math.PI * 2);

    if (dimmed) {
      ctx.fillStyle = hexToRgba(node.color, 0.12 * spawnAlpha);
      ctx.strokeStyle = hexToRgba(node.color, 0.08 * spawnAlpha);
    } else {
      const fillAlpha = (isSelected ? 0.9 : isHovered ? 0.75 : 0.55) * spawnAlpha;
      const strokeAlpha = (isSelected ? 1 : 0.85) * spawnAlpha;
      ctx.fillStyle = hexToRgba(node.color, fillAlpha);
      ctx.strokeStyle = hexToRgba(node.color, strokeAlpha);
    }

    ctx.lineWidth = isSelected ? 2.5 : 1.2;
    ctx.fill();
    ctx.stroke();

    // Icon / label inside node
    if (!dimmed || isSelected || isHovered || isConnected) {
      if (r > 9) {
        const icon = getTypeIcon(node.type);
        ctx.save();
        ctx.font = `${Math.max(8, r * 0.55)}px Inter, sans-serif`;
        ctx.fillStyle = dimmed
          ? `rgba(255,255,255,${0.15 * spawnAlpha})`
          : `rgba(255,255,255,${0.9 * spawnAlpha})`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(icon, node.x, node.y);
        ctx.restore();
      }

      // Node label below
      ctx.save();
      ctx.font = `${isSelected ? '11' : '9.5'}px Inter, sans-serif`;
      ctx.fillStyle = dimmed
        ? `rgba(148, 163, 184, ${0.25 * spawnAlpha})`
        : `rgba(226, 232, 240, ${0.9 * spawnAlpha})`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(node.label, node.x, node.y + r + 13);
      ctx.restore();
    }
  }

  // Info panel for selected node
  if (selectedNode) drawInfoPanel(selectedNode);
}

function getTypeIcon(type) {
  switch (type) {
    case 'document':   return '📄';
    case 'person':     return '👤';
    case 'process':    return '⚙';
    case 'regulation': return '⚖';
    case 'supplier':   return '🏭';
    default:           return '●';
  }
}

function drawInfoPanel(node) {
  const panelW = 210;
  const connections = edges
    .filter(e => e.source === node.id || e.target === node.id)
    .map(e => {
      const otherId = e.source === node.id ? e.target : e.source;
      const other = getNode(otherId);
      return { node: other, label: e.label };
    })
    .filter(c => c.node);

  const panelH = 68 + connections.length * 17;
  let px = node.x + node.currentSize + 16;
  let py = node.y - panelH / 2;

  // Keep in canvas bounds
  if (px + panelW > canvas.width - 10) px = node.x - panelW - 16;
  if (py < 10) py = 10;
  if (py + panelH > canvas.height - 10) py = canvas.height - panelH - 10;

  // Panel shadow/background
  ctx.save();
  ctx.shadowColor = node.color;
  ctx.shadowBlur = 12;
  ctx.fillStyle = 'rgba(10, 10, 26, 0.92)';
  ctx.strokeStyle = hexToRgba(node.color, 0.45);
  ctx.lineWidth = 1.2;
  roundRect(ctx, px, py, panelW, panelH, 10);
  ctx.fill();
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.restore();

  // Title
  ctx.save();
  ctx.font = 'bold 12px Inter, sans-serif';
  ctx.fillStyle = node.color;
  ctx.textAlign = 'left';
  ctx.fillText(node.label, px + 12, py + 22);

  // Type tag
  ctx.font = '9.5px Inter, sans-serif';
  ctx.fillStyle = 'rgba(148, 163, 184, 0.7)';
  ctx.fillText(node.type.charAt(0).toUpperCase() + node.type.slice(1) + '  ·  ' + connections.length + ' connections', px + 12, py + 38);

  // Divider
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(px + 12, py + 48);
  ctx.lineTo(px + panelW - 12, py + 48);
  ctx.stroke();

  // Connections
  ctx.font = '9.5px Inter, sans-serif';
  connections.forEach((c, i) => {
    const y = py + 62 + i * 17;
    ctx.fillStyle = hexToRgba(c.node.color, 0.8);
    ctx.fillText(`→ ${c.label}: ${c.node.label}`, px + 12, y);
  });

  ctx.restore();
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function getNodeAt(x, y) {
  for (let i = nodes.length - 1; i >= 0; i--) {
    const n = nodes[i];
    const dx = x - n.x;
    const dy = y - n.y;
    if (dx * dx + dy * dy < (n.currentSize + 6) * (n.currentSize + 6)) return n;
  }
  return null;
}

function animate() {
  simulate();
  draw();
  animationId = requestAnimationFrame(animate);
}

function handleResize() {
  if (!canvas) return;
  const container = canvas.parentElement;
  canvas.width = container.clientWidth;
  canvas.height = container.clientHeight || 500;
}

function renderLegend(container) {
  const types = [
    { label: 'SOP', color: GRAPH_COLORS.sop },
    { label: 'Work Instruction', color: GRAPH_COLORS.wi },
    { label: 'CAPA', color: GRAPH_COLORS.capa },
    { label: 'NCR', color: GRAPH_COLORS.ncr },
    { label: 'Person', color: GRAPH_COLORS.person },
    { label: 'Process', color: GRAPH_COLORS.process },
    { label: 'Regulation', color: GRAPH_COLORS.regulation },
    { label: 'Supplier', color: GRAPH_COLORS.supplier },
  ];

  container.innerHTML = types.map(t => `
    <div class="flex items-center gap-1.5">
      <span class="w-2.5 h-2.5 rounded-full shrink-0" style="background: ${t.color}; box-shadow: 0 0 6px ${t.color}66"></span>
      <span class="text-xs text-slate-400 whitespace-nowrap">${t.label}</span>
    </div>
  `).join('');
}

// Clean up previous event listeners
function cleanupListeners() {
  if (!canvas) return;
  if (_mousemove) canvas.removeEventListener('mousemove', _mousemove);
  if (_mousedown) canvas.removeEventListener('mousedown', _mousedown);
  if (_mouseup) canvas.removeEventListener('mouseup', _mouseup);
  if (_mouseleave) canvas.removeEventListener('mouseleave', _mouseleave);
  if (_resizeHandler) window.removeEventListener('resize', _resizeHandler);
}

export function initGraph() {
  canvas = document.getElementById('graph-canvas');
  if (!canvas) return;

  ctx = canvas.getContext('2d');

  // Stop any previous animation
  if (animationId) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }

  cleanupListeners();

  handleResize();
  _resizeHandler = handleResize;
  window.addEventListener('resize', _resizeHandler);

  // Reset state
  selectedNode = null;
  hoveredNode = null;
  isDragging = false;
  dragNode = null;
  time = 0;

  initNodes();

  _mousemove = (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;

    if (isDragging && dragNode) {
      dragNode.x = mouse.x;
      dragNode.y = mouse.y;
      dragNode.vx = 0;
      dragNode.vy = 0;
    } else {
      const h = getNodeAt(mouse.x, mouse.y);
      hoveredNode = h;
      canvas.style.cursor = h ? 'pointer' : 'default';
    }
  };

  _mousedown = (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const node = getNodeAt(x, y);
    if (node) {
      isDragging = true;
      dragNode = node;
      selectedNode = node;
    } else {
      selectedNode = null;
    }
  };

  _mouseup = () => { isDragging = false; dragNode = null; };
  _mouseleave = () => { hoveredNode = null; isDragging = false; dragNode = null; };

  canvas.addEventListener('mousemove', _mousemove);
  canvas.addEventListener('mousedown', _mousedown);
  canvas.addEventListener('mouseup', _mouseup);
  canvas.addEventListener('mouseleave', _mouseleave);

  // Legend
  const legendContainer = document.getElementById('graph-legend');
  if (legendContainer) renderLegend(legendContainer);
}

export function startGraph() {
  if (!canvas) initGraph();
  if (!animationId) animate();
}

export function stopGraph() {
  if (animationId) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }
}
