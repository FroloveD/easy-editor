const badge = document.createElement('div');
badge.id = 'sel-badge';
document.body.appendChild(badge);

function syncBadge() {
  const selEl = document.querySelector('#canvas .selected');
  if (!selEl || document.body.classList.contains('preview-mode')) {
    badge.style.display = 'none';
    return;
  }
  const r = selEl.getBoundingClientRect();
  badge.textContent = selEl.tagName.toLowerCase();
  badge.style.display = 'block';
  badge.style.left = r.left + 'px';
  badge.style.top = Math.max(0, r.top - 18) + 'px';
}

new MutationObserver(syncBadge).observe($('#canvas'), { subtree: true, childList: true, attributes: true, characterData: true });
window.addEventListener('resize', syncBadge);
$('#canvas-frame').addEventListener('scroll', syncBadge);

const SEG_KEYS = ['display', 'flexDirection', 'fontWeight', 'textAlign'];

function upgradeSelects() {
  $$('#inspector select[data-skey]').forEach(sel => {
    if (sel.dataset.upgraded || !SEG_KEYS.includes(sel.dataset.skey)) return;
    sel.dataset.upgraded = '1';
    const seg = document.createElement('div');
    seg.className = 'seg';
    [...sel.options].forEach(o => {
      const b = document.createElement('button');
      b.type = 'button';
      b.dataset.skey = sel.dataset.skey;
      b.dataset.val = o.value;
      b.textContent = o.textContent;
      if (o.value === sel.value) b.classList.add('active');
      b.addEventListener('click', () => {
        sel.value = o.value;
        sel.dispatchEvent(new Event('input', { bubbles: true }));
        [...seg.children].forEach(x => x.classList.toggle('active', x === b));
      });
      seg.appendChild(b);
    });
    sel.classList.add('seg-src');
    sel.before(seg);
  });
}

new MutationObserver(upgradeSelects).observe($('#inspector'), { subtree: true, childList: true });

$$('.ptab').forEach(b => b.addEventListener('click', () => {
  $$('.ptab').forEach(x => x.classList.toggle('active', x === b));
  $('#tab-library').hidden = b.dataset.tab !== 'library';
  $('#tab-navigator').hidden = b.dataset.tab !== 'navigator';
}));

$$('.rtab').forEach(b => b.addEventListener('click', () => {
  $$('.rtab').forEach(x => x.classList.toggle('active', x === b));
  $('#tab-style').hidden = b.dataset.rtab !== 'style';
  $('#tab-settings').hidden = b.dataset.rtab !== 'settings';
}));

$$('.bp-btn').forEach(b => b.addEventListener('click', () => {
  $$('.bp-btn').forEach(x => x.classList.toggle('active', x === b));
  $('#canvas-frame').style.maxWidth = b.dataset.bp === 'auto' ? '' : b.dataset.bp + 'px';
}));

syncBadge();
