(() => {
  const P = window.PRODUCTS || [];
  const CATS = [
    { id: 'necklaces',   label: 'Necklaces',        preview: 'nec-14' },
    { id: 'earrings',    label: 'Earrings',         preview: 'ear-09' },
    { id: 'lighting',    label: 'Lighting',         preview: 'lig-06' },
    { id: 'home',        label: 'Home & Desk',      preview: 'hom-03' },
    { id: 'collections', label: 'Collections',      preview: 'col-06' },
  ];
  const byId = Object.fromEntries(P.map(p => [p.id, p]));
  const count = id => P.filter(p => p.cat === id).length;
  const $ = s => document.querySelector(s);

  document.getElementById('year').textContent = new Date().getFullYear();

  /* ---------- collections index ---------- */
  const index = $('#index');
  CATS.forEach((c, i) => {
    const li = document.createElement('li');
    li.innerHTML = `<a href="#gallery" data-cat="${c.id}">
      <span class="n">0${i + 1}</span><span class="t">${c.label}</span>
      <span class="c">${count(c.id)} pieces</span></a>`;
    index.append(li);
  });
  const prev = $('#indexPreview'), prevImg = prev.querySelector('img');
  index.addEventListener('mousemove', e => {
    const a = e.target.closest('a'); if (!a) return;
    const c = CATS.find(x => x.id === a.dataset.cat);
    const src = `img/${c.preview}-s.webp`;
    if (!prevImg.src.endsWith(src)) prevImg.src = src;
    prev.style.left = e.clientX + 'px'; prev.style.top = e.clientY + 'px';
    prev.classList.add('show');
  });
  index.addEventListener('mouseleave', () => prev.classList.remove('show'));
  index.addEventListener('click', e => {
    const a = e.target.closest('a'); if (a) setFilter(a.dataset.cat);
  });

  /* ---------- gallery ---------- */
  const grid = $('#grid'), filters = $('#filters');
  let filter = 'all', shown = [];

  const fbtn = (id, label, n) =>
    `<button role="tab" data-f="${id}" aria-selected="${id === filter}">${label}<sup>${n}</sup></button>`;
  filters.innerHTML = fbtn('all', 'All', P.length) + CATS.map(c => fbtn(c.id, c.label, count(c.id))).join('');
  filters.addEventListener('click', e => {
    const b = e.target.closest('button'); if (b) setFilter(b.dataset.f);
  });

  // "All" view: round-robin across categories so every column mixes jewellery, lamps and objects.
  function interleaved() {
    const lists = CATS.map(c => P.filter(p => p.cat === c.id));
    const out = [];
    for (let i = 0; lists.some(l => i < l.length); i++)
      lists.forEach(l => { if (l[i]) out.push(l[i]); });
    return out;
  }

  function render() {
    shown = filter === 'all' ? interleaved() : P.filter(p => p.cat === filter);
    grid.innerHTML = '';
    shown.forEach((p, i) => {
      const b = document.createElement('button');
      b.className = 'tile'; b.type = 'button';
      b.setAttribute('aria-label', `View ${p.title}`);
      b.innerHTML = `<img src="img/${p.id}-s.webp" width="${p.w}" height="${p.h}" alt="${p.title}" loading="lazy" decoding="async"><span class="cap">${p.title}</span>`;
      b.addEventListener('click', () => open(i));
      const im = b.querySelector('img');
      const ok = () => im.classList.add('ok');
      if (im.complete && im.naturalWidth) ok(); else { im.onload = ok; im.onerror = ok; }
      b.addEventListener('touchstart', () => {
        b.classList.add('touched'); setTimeout(() => b.classList.remove('touched'), 1500);
      }, { passive: true });
      grid.append(b);
    });
    filters.querySelectorAll('button').forEach(b => b.setAttribute('aria-selected', b.dataset.f === filter));
  }
  function setFilter(f) { filter = f; render(); }
  render();

  /* ---------- lightbox ---------- */
  const lb = $('#lb'), lbImg = $('#lbImg');
  let cur = 0, lastFocus = null;
  const catLabel = id => (CATS.find(c => c.id === id) || {}).label || '';

  function show(i) {
    cur = (i + shown.length) % shown.length;
    const p = shown[cur];
    lbImg.src = `img/${p.id}.webp`; lbImg.alt = p.title;
    $('#lbTitle').textContent = p.title;
    $('#lbMeta').textContent = `${catLabel(p.cat)} · ${cur + 1} / ${shown.length}`;
    // Buying options hook: when p.price exists, render price + button here.
    $('#lbBuy').innerHTML = p.price
      ? `<span>₹${p.price}</span>`
      : `<span class="soon">Available soon</span>`;
    [shown[(cur + 1) % shown.length], shown[(cur - 1 + shown.length) % shown.length]]
      .forEach(n => { new Image().src = `img/${n.id}.webp`; });
  }
  function open(i) {
    lastFocus = document.activeElement;
    lb.hidden = false; document.body.style.overflow = 'hidden';
    show(i); $('#lbClose').focus();
  }
  function close() {
    lb.hidden = true; document.body.style.overflow = '';
    if (lastFocus) lastFocus.focus();
  }
  $('#lbClose').onclick = close;
  $('#lbPrev').onclick = () => show(cur - 1);
  $('#lbNext').onclick = () => show(cur + 1);
  lb.addEventListener('click', e => { if (e.target === lb || e.target.classList.contains('lb-fig')) close(); });
  addEventListener('keydown', e => {
    if (lb.hidden) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') show(cur - 1);
    if (e.key === 'ArrowRight') show(cur + 1);
  });
  let tx = null;
  lb.addEventListener('touchstart', e => { tx = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', e => {
    if (tx === null) return;
    const dx = e.changedTouches[0].clientX - tx; tx = null;
    if (Math.abs(dx) > 50) show(cur + (dx < 0 ? 1 : -1));
  });

  /* ---------- culm: highlight the node of the section in view ---------- */
  const nodes = [...document.querySelectorAll('.culm a')];
  const so = new IntersectionObserver(es => es.forEach(en => {
    if (!en.isIntersecting) return;
    const id = en.target.dataset.section;
    nodes.forEach(n => n.classList.toggle('on', n.dataset.node === id));
  }), { rootMargin: '-45% 0px -50% 0px' });
  document.querySelectorAll('[data-section]').forEach(s => so.observe(s));
})();
