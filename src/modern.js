const dataElement = document.querySelector('#modern-data');
if (dataElement) initializeModern(JSON.parse(dataElement.textContent));

function initializeModern(content) {
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];
  const film = $('#hero-film');
  const toggle = $('#film-toggle');
  const compact = matchMedia('(max-width: 767px)');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const saveData = navigator.connection?.saveData;
  let scene = content.scenes[0];
  let wantsPlay = !reduced.matches && !saveData;
  let inView = true;
  let generation = 0;

  function updateControl() {
    const playing = !film.paused;
    toggle.firstChild.textContent = playing ? '暂停画面' : '播放画面';
    toggle.dataset.paused = String(!playing);
    toggle.setAttribute('aria-label', `${playing ? '暂停' : '播放'}空间影像`);
  }
  async function play() {
    const version = generation;
    try { await film.play(); }
    catch (error) {
      if (version !== generation || error.name === 'AbortError') return;
      $('#film-status').textContent = '影像未自动播放，当前显示封面，可点击播放画面重试。';
      updateControl();
    }
  }
  function synchronize() {
    if (wantsPlay && inView && !document.hidden) play();
    else film.pause();
    updateControl();
  }
  function loadScene(next) {
    generation++;
    scene = next;
    film.pause();
    film.classList.remove('is-ready');
    const poster = compact.matches ? scene.mobilePoster : scene.poster;
    $('.film-poster source').srcset = scene.mobilePoster;
    $('.film-poster img').src = scene.poster;
    film.poster = poster;
    film.style.objectPosition = scene.position || 'center';
    film.src = compact.matches ? scene.mobile : scene.desktop;
    film.muted = true;
    film.load();
    $$('[data-film-scene]').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.filmScene === scene.id)));
    synchronize();
  }
  film.addEventListener('playing', () => { film.classList.add('is-ready'); $('#film-status').textContent = ''; updateControl(); });
  film.addEventListener('pause', updateControl);
  film.addEventListener('error', () => {
    film.classList.remove('is-ready');
    $('#film-status').textContent = '视频暂时无法加载，已显示静态封面。';
    updateControl();
  });
  toggle.addEventListener('click', () => { wantsPlay = film.paused; synchronize(); });
  $$('[data-film-scene]').forEach((button) => button.addEventListener('click', () => {
    const next = content.scenes.find((item) => item.id === button.dataset.filmScene);
    if (next && next.id !== scene.id) loadScene(next);
  }));
  compact.addEventListener('change', () => loadScene(scene));
  reduced.addEventListener('change', () => { wantsPlay = !reduced.matches && !saveData; synchronize(); });
  document.addEventListener('visibilitychange', synchronize);
  new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; synchronize(); }, { threshold: 0 }).observe($('.film-hero'));
  loadScene(scene);

  $$('[data-space-filter]').forEach((button) => button.addEventListener('click', () => {
    const filter = button.dataset.spaceFilter;
    let count = 0;
    $$('[data-space-filter]').forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
    $$('[data-space-category]').forEach((item) => { item.hidden = filter !== 'all' && item.dataset.spaceCategory !== filter; if (!item.hidden) count++; });
    $('.modern-space-grid').dataset.filtered = String(filter !== 'all');
    $('[data-space-filter-status]').textContent = `显示 ${count} 个空间示意`;
  }));

  const dialog = $('#space-dialog');
  $$('[data-space-open]').forEach((button) => button.addEventListener('click', () => {
    const space = content.spaces.find((item) => item.id === button.dataset.spaceOpen);
    if (!space) return;
    $('#space-dialog-image').src = space.image;
    $('#space-dialog-image').alt = space.alt;
    $('#space-dialog-image').style.objectPosition = space.position || 'center';
    $('#space-dialog-title').textContent = space.title;
    $('#space-dialog-description').textContent = space.description;
    $('#space-dialog-points').replaceChildren(...space.considerations.map((text) => { const item = document.createElement('li'); item.textContent = text; return item; }));
    $('#space-dialog-source').href = content.sources.find((source) => source.id === space.sourceId).page;
    dialog.showModal();
  }));
  $('[data-space-close]').addEventListener('click', () => dialog.close());
  let outside = false;
  const isOutside = (event) => { const r = dialog.getBoundingClientRect(); return event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom; };
  dialog.addEventListener('pointerdown', (event) => { outside = isOutside(event); });
  dialog.addEventListener('click', (event) => { if (outside && isOutside(event)) dialog.close(); });

  $$('[data-detail]').forEach((button) => button.addEventListener('click', () => {
    const detail = content.details.find((item) => item.id === button.dataset.detail);
    if (!detail) return;
    $$('[data-detail]').forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
    $('[data-detail-title]').textContent = detail.title;
    $('[data-detail-copy]').textContent = detail.text;
    $('#detail-photo').src = detail.image;
    $('#detail-photo').alt = detail.alt;
    $('#detail-photo').style.objectPosition = detail.position || 'center';
  }));
}
