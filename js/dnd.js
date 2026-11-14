let dragState = null;
let ghostEl = null;
let markEl = null;

function isContainerNode(node) {
  if (!node || VOID_TAGS.includes(node.tag)) return false;
  return (EL_DEFS[node.def] && EL_DEFS[node.def].empty)
    || (node.children && node.children.length > 0)
    || ['div', 'section', 'header', 'footer', 'nav', 'ul'].includes(node.tag);
}

function canDropOn(dragId, targetId) {
  if (!dragId || !targetId || dragId === targetId) return false;
  const drag = findNode(dragId);
  if (!drag) return false;
  let ok = true;
  walk(drag, n => { if (n.id === targetId) ok = false; });
  return ok;
}

function resolveDrop(fracMain, insideOk) {
  if (insideOk && fracMain >= 0.25 && fracMain <= 0.75) return 'inside';
  return fracMain < 0.5 ? 'before' : 'after';
}

function applyMove(dragId, targetId, mode) {
  if (!canDropOn(dragId, targetId)) return false;
  const oldParent = findParent(dragId) || site.root;
  const oldIdx = oldParent.children.findIndex(n => n.id === dragId);
  let parentId, index;
  if (mode === 'inside') {
    parentId = targetId;
    const t = findNode(targetId);
    if (!t.children) t.children = [];
    index = t.children.length;
  } else {
    const tp = findParent(targetId) || site.root;
    const ti = tp.children.findIndex(n => n.id === targetId);
    parentId = tp.id;
    index = mode === 'before' ? ti : ti + 1;
    if (parentId === oldParent.id && oldIdx < index) index -= 1;
  }
  if (parentId === oldParent.id && oldIdx === index) return false;
  mutate(() => {
    const node = findNode(dragId);
    oldParent.children.splice(oldIdx, 1);
    findNode(parentId).children.splice(index, 0, node);
    selectedId = dragId;
  });
  return true;
}

function flowHoriz(targetId) {
  const p = findParent(targetId) || site.root;
  return p.style.display === 'flex' && p.style.flexDirection !== 'column';
}

function ensureGhost() {
  if (!ghostEl) {
    ghostEl = document.createElement('div');
    ghostEl.id = 'dnd-ghost';
    document.body.appendChild(ghostEl);
  }
  return ghostEl;
}

function showGhost(e, node) {
  if (!node) return;
  const g = ensureGhost();
  const def = EL_DEFS[node.def] || {};
  g.innerHTML = `<span class="nav-icon">${def.icon || '▫'}</span><span>${node.text ? esc(node.text.slice(0, 24)) : t('el.' + node.def)}</span>`;
  g.style.left = (e.clientX + 14) + 'px';
  g.style.top = (e.clientY + 10) + 'px';
  g.classList.add('visible');
}

function showMark(plan) {
  if (!markEl) {
    markEl = document.createElement('div');
    markEl.id = 'drop-mark';
    document.body.appendChild(markEl);
  }
  markEl.className = 'visible' + (plan.mode === 'inside' ? ' inside' : '');
  const r = plan.rect;
  if (plan.mode === 'inside') {
    markEl.style.left = r.left + 'px';
    markEl.style.top = r.top + 'px';
    markEl.style.width = r.width + 'px';
    markEl.style.height = r.height + 'px';
  } else if (plan.horiz) {
    markEl.style.left = (plan.mode === 'before' ? r.left : r.left + r.width) + 'px';
    markEl.style.top = r.top + 'px';
    markEl.style.width = '3px';
    markEl.style.height = r.height + 'px';
  } else {
    markEl.style.left = r.left + 'px';
    markEl.style.top = (plan.mode === 'before' ? r.top : r.top + r.height) + 'px';
    markEl.style.width = r.width + 'px';
    markEl.style.height = '3px';
  }
}

function hideMark() { if (markEl) markEl.className = ''; }

function clearGhost() {
  if (ghostEl) ghostEl.classList.remove('visible');
  hideMark();
}

function planFromEvent(e) {
  const scope = e.currentTarget;
  const el = e.target && e.target.closest ? e.target.closest('[data-id]') : null;
  if (!el || !scope.contains(el)) {
    if (scope.id !== 'canvas') return null;
    return { targetId: site.root.id, mode: 'inside', rect: scope.getBoundingClientRect(), horiz: false };
  }
  if (!canDropOn(dragState.id, el.dataset.id)) return null;
  const node = findNode(el.dataset.id);
  const insideOk = isContainerNode(node);
  const horiz = flowHoriz(el.dataset.id);
  const rect = el.getBoundingClientRect();
  const fracMain = horiz
    ? (e.clientX - rect.left) / (rect.width || 1)
    : (e.clientY - rect.top) / (rect.height || 1);
  const mode = resolveDrop(fracMain, insideOk);
  return { targetId: el.dataset.id, mode, rect, horiz };
}

function dragStartHandler(e) {
  if (previewMode) return;
  const el = e.target.closest && e.target.closest('[data-id]');
  if (!el) return;
  const node = findNode(el.dataset.id);
  if (!node || node.id === site.root.id) return;
  dragState = { kind: 'move', id: node.id, plan: null };
  if (e.dataTransfer) {
    e.dataTransfer.setData('text/plain', node.id);
    e.dataTransfer.effectAllowed = 'move';
  }
  el.classList.add('dragging');
  showGhost(e, node);
}

function dragOverHandler(e) {
  if (!dragState) return;
  showGhost(e, findNode(dragState.id));
  const plan = planFromEvent(e);
  dragState.plan = plan;
  if (!plan) { hideMark(); return; }
  e.preventDefault();
  if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
  showMark(plan);
}

function dropHandler(e) {
  if (!dragState) return;
  e.preventDefault();
  const plan = dragState.plan;
  clearGhost();
  if (plan) applyMove(dragState.id, plan.targetId, plan.mode);
  dragState = null;
}

function dragEndHandler() {
  $$('#canvas .dragging, #navigator .dragging').forEach(el => el.classList.remove('dragging'));
  clearGhost();
  dragState = null;
}

['#canvas', '#navigator'].forEach(sel => {
  const box = $(sel);
  box.addEventListener('dragstart', dragStartHandler);
  box.addEventListener('dragover', dragOverHandler);
  box.addEventListener('drop', dropHandler);
  box.addEventListener('dragend', dragEndHandler);
});
