const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

const TEXT_TAGS = ['h1', 'h2', 'h3', 'h4', 'p', 'a', 'button', 'li', 'span', 'footer'];
const VOID_TAGS = ['img'];
const STYLE_KEYS = ['display', 'flexDirection', 'justifyContent', 'alignItems', 'gap', 'width', 'height', 'padding', 'margin', 'fontSize', 'fontWeight', 'textAlign', 'color', 'background', 'borderRadius', 'opacity'];

let site = null;
let selectedId = null;
let previewMode = false;
let history = [];
let future = [];
let suppressSnapshot = false;
const collapsed = new Set();

function uid() { return 'n' + Math.random().toString(36).slice(2, 9); }

function canText(node) {
  if (!node) return false;
  return (node.text && node.text.length > 0) || TEXT_TAGS.includes(node.tag);
}

function walk(node, fn, parent = null, depth = 0) {
  fn(node, parent, depth);
  (node.children || []).forEach(c => walk(c, fn, node, depth + 1));
}

function findNode(id, node = site.root) {
  if (node.id === id) return node;
  for (const c of node.children || []) {
    const r = findNode(id, c);
    if (r) return r;
  }
  return null;
}

function findParent(id, node = site.root) {
  for (const c of node.children || []) {
    if (c.id === id) return node;
    const r = findParent(id, c);
    if (r) return r;
  }
  return null;
}

function findSiblings(id) {
  const p = findParent(id);
  return (p || site.root).children;
}

function snapshot() {
  if (suppressSnapshot) return;
  history.push(JSON.stringify(site));
  if (history.length > 100) history.shift();
  future = [];
  updateHistoryButtons();
}

function restore(json) {
  suppressSnapshot = true;
  site = JSON.parse(json);
  if (selectedId && !findNode(selectedId)) selectedId = null;
  renderAll();
  suppressSnapshot = false;
}

function undo() {
  if (!history.length) return;
  future.push(JSON.stringify(site));
  restore(history.pop());
  updateHistoryButtons();
}

function redo() {
  if (!future.length) return;
  history.push(JSON.stringify(site));
  restore(future.pop());
  updateHistoryButtons();
}

function updateHistoryButtons() {
  $('#btn-undo').disabled = !history.length;
  $('#btn-redo').disabled = !future.length;
}

function persist() {
  store.set('easy-editor:site', JSON.stringify(site));
}

function mutate(fn) {
  snapshot();
  fn();
  persist();
  renderAll();
}

function styleCss(node) {
  const parts = [];
  for (const key of STYLE_KEYS) {
    const v = node.style[key];
    if (v === '' || v == null) continue;
    parts.push(`${cssProp(key)}:${v}`);
  }
  return parts.join(';');
}

function nodeHtml(node, indent = 2) {
  const pad = ' '.repeat(indent);
  const cls = `class="e-${node.id}"`;
  const attrs = [];
  if (node.attrs.href) attrs.push(`href="${esc(node.attrs.href)}"`);
  if (node.attrs.src) attrs.push(`src="${esc(node.attrs.src)}"`);
  if (node.attrs.alt) attrs.push(`alt="${esc(node.attrs.alt)}"`);
  const tag = node.tag;
  const open = `<${tag} ${cls}${attrs.length ? ' ' + attrs.join(' ') : ''}>`;
  const close = `</${tag}>`;
  const text = node.text ? esc(node.text) : '';
  if (!node.children || !node.children.length) {
    return VOID_TAGS.includes(tag) ? `${pad}<${tag} ${cls}${attrs.length ? ' ' + attrs.join(' ') : ''}>` : `${pad}${open}${text}${close}`;
  }
  const inner = node.children.map(c => nodeHtml(c, indent + 2)).join('\n');
  return `${pad}${open}\n${text ? pad + '  ' + text + '\n' : ''}${inner}\n${pad}${close}`;
}

function cssRules(node = site.root, out = []) {
  const css = styleCss(node);
  if (css) out.push(`.e-${node.id}{${css}}`);
  (node.children || []).forEach(c => cssRules(c, out));
  return out;
}

function buildHtml() {
  const rules = cssRules();
  const base = `*{box-sizing:border-box}body{margin:0;font-family:system-ui,-apple-system,'Segoe UI',sans-serif;background:#ffffff;color:#16181d}img{max-width:100%;display:block}a{text-decoration:none}`;
  return `<!DOCTYPE html>
<html lang="${LANG}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(document.title.replace(' ' + t('app.editorSuffix'), ''))}</title>
<style>${base}</style>
<style>\n${rules.join('\n')}\n</style>
</head>
<body>
${site.root.children.map(c => nodeHtml(c)).join('\n')}
</body>
</html>`;
}

function buildDom(node, doc = document) {
  const el = doc.createElement(node.tag);
  el.className = 'e-' + node.id;
  el.dataset.id = node.id;
  el.draggable = !previewMode;
  if (node.attrs.href) el.setAttribute('href', node.attrs.href);
  if (node.attrs.src) el.setAttribute('src', node.attrs.src);
  if (node.attrs.alt) el.setAttribute('alt', node.attrs.alt);
  if (node.text) el.textContent = node.text;
  (node.children || []).forEach(c => el.appendChild(buildDom(c, doc)));
  return el;
}

function renderCanvas() {
  const canvas = $('#canvas');
  canvas.innerHTML = '';
  if (previewMode) {
    canvas.classList.add('preview');
  } else {
    canvas.classList.remove('preview');
  }
  const style = document.createElement('style');
  style.textContent = `#canvas{min-height:${site.root.style.height || '400px'}}` + cssRules().join('\n');
  canvas.appendChild(style);
  if (!site.root.children.length) {
    canvas.insertAdjacentHTML('beforeend', `<div class="empty">${t('app.empty')}</div>`);
    return;
  }
  site.root.children.forEach(c => canvas.appendChild(buildDom(c)));
  const sel = selectedId ? canvas.querySelector(`[data-id="${selectedId}"]`) : null;
  if (sel) sel.classList.add('selected');
}

function renderNavigator() {
  const box = $('#navigator');
  box.innerHTML = '';
  if (!site.root.children.length) {
    box.innerHTML = `<p class="hint">${t('app.empty')}</p>`;
    return;
  }
  site.root.children.forEach(c => navNode(c, box, 0));
}

function navNode(node, box, depth) {
  const row = document.createElement('div');
  row.className = 'nav-row' + (node.id === selectedId ? ' selected' : '');
  row.style.paddingLeft = (8 + depth * 16) + 'px';
  row.dataset.id = node.id;
  row.draggable = true;
  const def = Object.entries(EL_DEFS).find(([, d]) => d.tag === node.tag);
  const hasKids = (node.children || []).length > 0;
  const open = !collapsed.has(node.id);
  row.innerHTML = `<span class="nav-toggle${hasKids ? '' : ' leaf'}">${hasKids ? (open ? '▾' : '▸') : ''}</span><span class="nav-icon">${def ? def[1].icon : '▫'}</span><span class="nav-name">${node.name ? esc(node.name.slice(0, 24)) : (node.text ? esc(node.text.slice(0, 24)) : t('el.' + (def ? def[0] : 'container')))}</span>`;
  if (hasKids) {
    row.querySelector('.nav-toggle').addEventListener('click', e => {
      e.stopPropagation();
      if (open) collapsed.add(node.id); else collapsed.delete(node.id);
      renderNavigator();
    });
  }
  row.addEventListener('click', () => select(node.id));
  box.appendChild(row);
  if (hasKids && open) (node.children || []).forEach(c => navNode(c, box, depth + 1));
}

function renderBreadcrumbs() {
  const box = $('#breadcrumbs');
  const chain = [];
  let cur = selectedId ? findNode(selectedId) : null;
  while (cur) {
    chain.unshift(cur);
    cur = findParent(cur.id);
  }
  if (!chain.length) {
    box.innerHTML = `<span class="crumb muted">${t('app.noSelection')}</span>`;
    return;
  }
  box.innerHTML = chain.map(n => `<button class="crumb" data-id="${n.id}">${esc(n.tag)}</button>`).join('<span class="crumb-sep">›</span>');
  box.querySelectorAll('.crumb').forEach(b => b.addEventListener('click', () => select(b.dataset.id)));
}

function select(id) {
  selectedId = id;
  $$('#canvas .selected').forEach(el => el.classList.remove('selected'));
  const el = $(`#canvas [data-id="${id}"]`);
  if (el) el.classList.add('selected');
  renderNavigator();
  renderBreadcrumbs();
  renderInspector();
  renderSettings();
}

function fieldHtml(f, node) {
  const v = node.style[f.key] ?? '';
  const label = t(f.label || 'st.' + f.key);
  const common = `data-skey="${f.key}"`;
  if (f.type === 'select') {
    const opts = f.options.map(o => {
      const lbl = o === '' ? t('opt.auto') : (t('opt.' + o) !== 'opt.' + o ? t('opt.' + o) : o);
      return `<option value="${o}" ${String(v) === String(o) ? 'selected' : ''}>${lbl}</option>`;
    }).join('');
    return `<label class="fld"><span>${label}</span><select ${common}>${opts}</select></label>`;
  }
  if (f.type === 'color') {
    const color = /^#[0-9a-f]{6}$/i.test(v) ? v : '#ffffff';
    return `<label class="fld"><span>${label}</span><input type="color" value="${color}" ${common}><input type="text" class="fld-color-hex" value="${esc(v)}" placeholder="transparent" ${common}></label>`;
  }
  return `<label class="fld"><span>${label}</span><input type="text" value="${esc(v)}" placeholder="${esc(f.placeholder || '')}" ${common}></label>`;
}

function renderInspector() {
  const box = $('#inspector');
  const node = selectedId ? findNode(selectedId) : null;
  if (!node) {
    box.innerHTML = `<p class="hint">${t('app.noSelection')}</p>`;
    return;
  }
  const sections = Object.entries(STYLE_PROPS).map(([sec, fields]) => {
    const rows = fields.filter(f => !f.when || f.when(node.style, node)).map(f => fieldHtml(f, node)).join('');
    return rows ? `<div class="style-sec"><h4>${t('sec.' + sec)}</h4>${rows}</div>` : '';
  }).join('');
  box.innerHTML = `${sections}
    <div class="style-sec"><h4>${t('app.actions')}</h4>
      <div class="act-row">
        <button class="btn-ghost" data-act="up">${t('act.up')}</button>
        <button class="btn-ghost" data-act="down">${t('act.down')}</button>
        <button class="btn-ghost" data-act="dup">${t('act.dup')}</button>
        <button class="btn-ghost btn-danger" data-act="del">${t('act.del')}</button>
      </div>
      <button class="btn-ghost" data-act="reset">${t('app.resetStyle')}</button>
    </div>`;
}

function renderSettings() {
  const box = $('#settings');
  const node = selectedId ? findNode(selectedId) : null;
  if (!node) {
    box.innerHTML = `<p class="hint">${t('app.noSelection')}</p>`;
    return;
  }
  const defKey = (Object.entries(EL_DEFS).find(([, d]) => d.tag === node.tag) || ['container'])[0];
  const content = [];
  if (canText(node) && node.tag !== 'img') content.push(`<label class="fld"><span>${t('st.text')}</span><textarea rows="2" data-attr="text">${esc(node.text || '')}</textarea></label>`);
  if (node.tag === 'a') content.push(`<label class="fld"><span>${t('st.href')}</span><input type="text" value="${esc(node.attrs.href || '')}" data-attr="href"></label>`);
  if (node.tag === 'img') content.push(
    `<label class="fld"><span>${t('st.src')}</span><input type="text" value="${esc(node.attrs.src || '')}" data-attr="src"></label>`,
    `<label class="fld"><span>${t('st.alt')}</span><input type="text" value="${esc(node.attrs.alt || '')}" data-attr="alt"></label>`);
  box.innerHTML = `
    <div class="style-sec">
      <label class="fld"><span>${t('st.name')}</span><input type="text" value="${esc(node.name || '')}" placeholder="${esc(t('el.' + defKey))}" data-attr="name"></label>
      <label class="fld"><span>${t('st.tag')}</span><input type="text" value="${esc(node.tag)}" readonly></label>
      <label class="fld"><span>${t('st.id')}</span><input type="text" value="${esc(node.id)}" readonly></label>
    </div>
    ${content.length ? `<div class="style-sec"><h4>${t('app.content')}</h4>${content.join('')}</div>` : ''}`;
}

function renderLibrary() {
  const box = $('#library');
  box.innerHTML = '';
  for (const [key, def] of Object.entries(EL_DEFS)) {
    const el = document.createElement('button');
    el.className = 'lib-item';
    el.dataset.def = key;
    el.innerHTML = `<span class="lib-icon">${def.icon}</span><span>${t('el.' + key)}</span>`;
    el.addEventListener('click', () => addElement(key));
    box.appendChild(el);
  }
}

function addElement(defKey) {
  const def = EL_DEFS[defKey];
  if (!def) return;
  const node = {
    id: uid(),
    def: defKey,
    tag: def.tag,
    text: def.text ? t(def.text) : '',
    attrs: { ...(def.attrs || {}) },
    style: {},
    children: [],
  };
  if (defKey === 'image' && !node.attrs.src) node.attrs.src = phImg(t('el.image'));
  const leafTags = [...TEXT_TAGS, 'img'];
  mutate(() => {
    let parent = selectedId ? findNode(selectedId) : null;
    let insertIdx = null;
    if (parent && (VOID_TAGS.includes(parent.tag) || leafTags.includes(parent.tag))) {
      const sibs = findSiblings(parent.id);
      insertIdx = sibs.findIndex(n => n.id === parent.id) + 1;
      parent = findParent(parent.id) || site.root;
    }
    if (!parent) parent = site.root;
    if (insertIdx == null) parent.children.push(node);
    else parent.children.splice(insertIdx, 0, node);
    selectedId = node.id;
  });
}

function nodeAction(act) {
  const node = selectedId ? findNode(selectedId) : null;
  if (!node) return;
  const siblings = findSiblings(node.id);
  const idx = siblings.findIndex(n => n.id === node.id);
  if (act === 'del') {
    if (node.id === site.root.id) return;
    if (!confirm(t('app.confirmDelete'))) return;
    mutate(() => {
      siblings.splice(idx, 1);
      selectedId = null;
    });
  } else if (act === 'up' && idx > 0) {
    mutate(() => { [siblings[idx - 1], siblings[idx]] = [siblings[idx], siblings[idx - 1]]; });
  } else if (act === 'down' && idx < siblings.length - 1) {
    mutate(() => { [siblings[idx + 1], siblings[idx]] = [siblings[idx], siblings[idx + 1]]; });
  } else if (act === 'dup') {
    const cloneNode = n => ({ ...JSON.parse(JSON.stringify(n)), id: uid(), children: (n.children || []).map(cloneNode) });
    mutate(() => {
      siblings.splice(idx + 1, 0, cloneNode(node));
    });
  } else if (act === 'reset') {
    mutate(() => { node.style = {}; });
  }
}

function renderAll() {
  renderCanvas();
  renderNavigator();
  renderBreadcrumbs();
  renderInspector();
  renderSettings();
  updateHistoryButtons();
}

function setPreview(on) {
  previewMode = on;
  document.body.classList.toggle('preview-mode', on);
  $('#btn-preview').textContent = on ? t('app.edit') : t('app.preview');
  if (on) {
    selectedId = null;
    $$('#canvas .selected').forEach(el => el.classList.remove('selected'));
  }
  renderAll();
}

function downloadExport() {
  const blob = new Blob([buildHtml()], { type: 'text/html' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'index.html';
  a.click();
  URL.revokeObjectURL(a.href);
}

function loadSite() {
  const raw = store.get('easy-editor:site');
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.root && parsed.root.tag) {
        site = parsed;
        return;
      }
    } catch {}
  }
  site = starterSite();
}

function init() {
  loadSite();
  renderLibrary();
  renderAll();
  applyI18n();
}

init();

$('#canvas').addEventListener('click', e => {
  if (previewMode) return;
  if (e.target.closest('.inline-edit')) return;
  const el = e.target.closest('[data-id]');
  if (el) select(el.dataset.id);
});

$('#canvas').addEventListener('dblclick', e => {
  if (previewMode) return;
  const el = e.target.closest('[data-id]');
  if (!el) return;
  const node = findNode(el.dataset.id);
  if (!node || !canText(node) || node.tag === 'img') return;
  e.preventDefault();
  el.contentEditable = 'true';
  el.draggable = false;
  el.classList.add('inline-edit');
  el.focus();
  let done = false;
  const finish = () => {
    if (done) return;
    done = true;
    el.contentEditable = 'false';
    el.draggable = true;
    el.classList.remove('inline-edit');
    const val = el.textContent.trim();
    if (val !== node.text) mutate(() => { node.text = val; });
  };
  el.addEventListener('blur', finish);
  el.addEventListener('keydown', ev => {
    if (ev.key === 'Escape' || ev.key === 'Enter') {
      ev.preventDefault();
      el.blur();
    }
  });
});

['#inspector', '#settings'].forEach(boxSel => {
  $(boxSel).addEventListener('focusin', e => {
    if (e.target.matches('input, textarea, select')) snapshot();
  });

  $(boxSel).addEventListener('input', e => {
    const node = selectedId ? findNode(selectedId) : null;
    if (!node) return;
    const target = e.target;
    if (target.dataset.skey) {
      const pair = target.closest('.fld').querySelectorAll('[data-skey]');
      const value = target.type === 'color' ? target.value : target.value;
      pair.forEach(el => { if (el !== target) el.value = target.type === 'color' ? target.value : el.value; });
      node.style[target.dataset.skey] = value;
      persist();
      renderCanvas();
    } else if (target.dataset.attr === 'text') {
      node.text = target.value;
      persist();
      renderCanvas();
      renderNavigator();
    } else if (target.dataset.attr === 'name') {
      node.name = target.value;
      persist();
      renderNavigator();
    } else if (target.dataset.attr) {
      node.attrs[target.dataset.attr] = target.value;
      persist();
      renderCanvas();
    }
  });
});

$('#inspector').addEventListener('click', e => {
  const btn = e.target.closest('button[data-act]');
  if (btn) nodeAction(btn.dataset.act);
});

$('#btn-undo').addEventListener('click', undo);
$('#btn-redo').addEventListener('click', redo);
$('#btn-preview').addEventListener('click', () => setPreview(!previewMode));
$('#btn-export').addEventListener('click', downloadExport);

document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
    e.preventDefault();
    if (e.shiftKey) redo(); else undo();
  }
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'e') {
    e.preventDefault();
    downloadExport();
  }
  if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId && !/^(input|textarea|select)$/i.test(e.target.tagName) && e.target.contentEditable !== 'true') {
    nodeAction('del');
  }
});

document.addEventListener('langchange', () => {
  renderLibrary();
  renderAll();
});
