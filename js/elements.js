const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const phImg = (label, bg = '#e3e6f0', fg = '#5b6478') =>
  'data:image/svg+xml;utf8,' + encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect width="100%" height="100%" fill="${bg}"/><text x="50%" y="50%" fill="${fg}" font-family="sans-serif" font-size="40" text-anchor="middle" dominant-baseline="middle">${label}</text></svg>`
  );

const EL_DEFS = {
  container: { icon: '□', tag: 'div', empty: true },
  section: { icon: '▤', tag: 'section', empty: true },
  header: { icon: '⌂', tag: 'header', empty: true },
  footer: { icon: '▁', tag: 'footer', empty: true },
  nav: { icon: '☰', tag: 'nav', empty: true },
  heading: { icon: 'H', tag: 'h2', text: 'el.heading' },
  text: { icon: '¶', tag: 'p', text: 'el.text' },
  link: { icon: '🔗', tag: 'a', text: 'el.link', attrs: { href: '#' } },
  button: { icon: '⬭', tag: 'button', text: 'el.button' },
  image: { icon: '🖼', tag: 'img', attrs: { src: '', alt: '' } },
  list: { icon: '☰', tag: 'ul', empty: true },
  listItem: { icon: '•', tag: 'li', text: 'el.listItem' },
};

const STYLE_PROPS = {
  layout: [
    { key: 'display', type: 'select', options: ['', 'flex', 'grid', 'block', 'inline-block'] },
    { key: 'flexDirection', type: 'select', options: ['', 'row', 'column'], label: 'st.flexDirection', when: s => s.display === 'flex' },
    { key: 'justifyContent', type: 'select', options: ['', 'flex-start', 'center', 'flex-end', 'space-between'], label: 'st.justifyContent', when: s => s.display === 'flex' },
    { key: 'alignItems', type: 'select', options: ['', 'flex-start', 'center', 'flex-end', 'stretch'], label: 'st.alignItems', when: s => s.display === 'flex' },
    { key: 'gap', type: 'text', placeholder: '16px', when: s => s.display === 'flex' || s.display === 'grid' },
  ],
  sizing: [
    { key: 'width', type: 'text', placeholder: 'auto / 100% / 400px' },
    { key: 'height', type: 'text', placeholder: 'auto / 300px' },
  ],
  spacing: [
    { key: 'padding', type: 'text', placeholder: '16px / 24px 32px' },
    { key: 'margin', type: 'text', placeholder: '0 / 16px 0' },
  ],
  typography: [
    { key: 'fontSize', type: 'text', placeholder: '16px / 2rem', when: (s, node) => canText(node) },
    { key: 'fontWeight', type: 'select', options: ['', 'normal', 'bold'], label: 'st.fontWeight', when: (s, node) => canText(node) },
    { key: 'textAlign', type: 'select', options: ['', 'left', 'center', 'right'], label: 'st.textAlign', when: (s, node) => canText(node) },
    { key: 'color', type: 'color', when: (s, node) => canText(node) },
  ],
  appearance: [
    { key: 'background', type: 'color' },
    { key: 'borderRadius', type: 'text', placeholder: '0 / 12px / 999px' },
    { key: 'opacity', type: 'text', placeholder: '1 / 0.5' },
  ],
};

const CSS_ALIASES = {
  flexDirection: 'flex-direction',
  justifyContent: 'justify-content',
  alignItems: 'align-items',
  fontSize: 'font-size',
  fontWeight: 'font-weight',
  textAlign: 'text-align',
  borderRadius: 'border-radius',
};

function cssProp(key) { return CSS_ALIASES[key] || key.replace(/[A-Z]/g, c => '-' + c.toLowerCase()); }

function starterSite() {
  let n = 0;
  const mk = (def, props = {}) => ({
    id: 'n' + (++n),
    def,
    tag: EL_DEFS[def].tag,
    text: props.text ?? (EL_DEFS[def].text ? t(EL_DEFS[def].text) : ''),
    attrs: { ...(EL_DEFS[def].attrs || {}), ...(props.attrs || {}) },
    style: props.style || {},
    children: [],
  });
  const root = mk('container', { style: { display: 'flex', flexDirection: 'column', minHeight: '100vh' } });
  const header = mk('header', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 32px', background: '#0f1220' } });
  const logo = mk('link', { text: 'IPSUM', attrs: { href: '#' }, style: { color: '#ffffff', fontSize: '20px', fontWeight: 'bold' } });
  const nav = mk('nav', { style: { display: 'flex', gap: '24px' } });
  ['# home', '# projects', '# contact'].forEach(txt => {
    nav.children.push(mk('link', { text: txt, attrs: { href: txt.slice(1) || '#' }, style: { color: '#9aa1ad', fontSize: '15px' } }));
  });
  header.children.push(logo, nav);
  const hero = mk('section', { style: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '96px 24px', textAlign: 'center' } });
  hero.children.push(
    mk('heading', { text: t('tpl.heroTitle'), style: { fontSize: '44px', color: '#16181d', margin: '0' } }),
    mk('text', { text: t('tpl.heroSubtitle'), style: { color: '#5b6478', fontSize: '18px', margin: '0' } }),
    mk('link', { text: t('tpl.heroButton'), attrs: { href: '#contact' }, style: { background: '#4f46e5', color: '#ffffff', padding: '13px 30px', borderRadius: '999px', fontSize: '16px' } }),
    mk('image', { attrs: { src: phImg(t('el.image')), alt: t('el.image') }, style: { width: '420px', borderRadius: '16px' } }),
  );
  const footer = mk('footer', { text: t('tpl.footer'), style: { padding: '24px 32px', background: '#0f1220', color: '#9aa1ad', textAlign: 'center' } });
  root.children.push(header, hero, footer);
  return { version: 1, root };
}
