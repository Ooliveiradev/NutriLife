// ui.js - helpers de UI e renderização básica

export function el(tag, props = {}, ...children) {
  const e = document.createElement(tag);
  Object.entries(props || {}).forEach(([k, v]) => {
    if (k === 'class') e.className = v;
    else if (k.startsWith('on') && typeof v === 'function') e.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === 'html') e.innerHTML = v;
    else if (v !== undefined && v !== null) e.setAttribute(k, v);
  });
  children.flat().forEach(ch => { if (ch == null) return; if (typeof ch === 'string') e.appendChild(document.createTextNode(ch)); else e.appendChild(ch); });
  return e;
}

export function openModal(modal) { if (!modal) return; modal.setAttribute('aria-hidden', 'false'); }
export function closeModal(modal) { if (!modal) return; modal.setAttribute('aria-hidden', 'true'); }

export function accordion(container, items = []) {
  container.innerHTML = '';
  items.forEach(({ id, title, body }) => {
    const header = el('button', { class: 'acc-header', 'aria-expanded': 'false', id: `${id}-hdr` }, title);
    const content = el('div', { class: 'acc-body', id: `${id}-cnt`, role: 'region', 'aria-labelledby': `${id}-hdr` }, body);
    header.addEventListener('click', () => {
      const exp = header.getAttribute('aria-expanded') === 'true';
      header.setAttribute('aria-expanded', String(!exp));
    });
    const wrap = el('div', { class: 'acc-item' }, header, content);
    container.appendChild(wrap);
  });
}

export function toast(msg) {
  const t = el('div', { class: 'toast' }, msg);
  Object.assign(t.style, { position: 'fixed', bottom: '16px', left: '50%', transform: 'translateX(-50%)', background: '#0b1220', color: '#e2e8f0', border: '1px solid #1f2937', padding: '10px 14px', borderRadius: '10px', zIndex: 10000 });
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 1800);
}

