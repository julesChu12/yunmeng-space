const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

// 移动导航不接管页面滚动，保留浏览器原生锚点与键盘行为。
const menuButton = $('.menu-toggle');
const mobileMenu = $('#mobile-menu');
function closeMenu() {
  if (!mobileMenu) return;
  mobileMenu.hidden = true;
  menuButton.setAttribute('aria-expanded', 'false');
}
menuButton?.addEventListener('click', () => {
  const expanded = menuButton.getAttribute('aria-expanded') === 'true';
  menuButton.setAttribute('aria-expanded', String(!expanded));
  mobileMenu.hidden = expanded;
});
$$('a, button', mobileMenu).forEach((link) => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeMenu(); });
matchMedia('(min-width: 768px)').addEventListener('change', closeMenu);

// 批注内容来自同一份配置，图内标签与图下文字按钮保持同步。
const notesData = $('#hero-notes-data');
if (notesData) {
  const notes = JSON.parse(notesData.textContent);
  $$('[data-note]').forEach((button) => button.addEventListener('click', () => {
    const note = notes.find((item) => item.id === button.dataset.note);
    if (!note) return;
    $('[data-note-title]').textContent = note.title;
    $('[data-note-copy]').textContent = note.text;
    $$('[data-note]').forEach((item) => item.setAttribute('aria-pressed', String(item.dataset.note === note.id)));
  }));
}

$$('[data-project-collection]').forEach((collection) => {
  const buttons = $$('[data-filter]', collection);
  const projects = $$('.project-card', collection);
  function filter(value, updateUrl = true) {
    let count = 0;
    buttons.forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.filter === value)));
    projects.forEach((project) => {
      const visible = value === 'all' || project.dataset.categories.split('|').includes(value);
      project.hidden = !visible;
      if (visible) count++;
    });
    $('[data-filter-empty]', collection).hidden = count !== 0;
    $('[data-filter-status]', collection).textContent = `显示 ${count} 个${value === 'all' ? '' : value}提案`;
    if (updateUrl) {
      const url = new URL(location.href);
      if (value === 'all') url.searchParams.delete('direction');
      else url.searchParams.set('direction', value);
      history.replaceState(null, '', url);
    }
  }
  buttons.forEach((button) => button.addEventListener('click', () => filter(button.dataset.filter)));
  const initial = new URL(location.href).searchParams.get('direction');
  if (buttons.some((button) => button.dataset.filter === initial)) filter(initial, false);
});

const contactDialog = $('#contact-dialog');
const feedback = $('.feedback', contactDialog);
$$('[data-contact-open]').forEach((button) => button.addEventListener('click', () => {
  closeMenu();
  feedback.textContent = '';
  contactDialog.showModal();
}));
$('[data-dialog-close]', contactDialog)?.addEventListener('click', () => contactDialog.close());

function closeOnBackdrop(dialog) {
  let startedOutside = false;
  const isOutside = (event) => {
    const rect = dialog.getBoundingClientRect();
    return event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom;
  };
  dialog?.addEventListener('pointerdown', (event) => { startedOutside = isOutside(event); });
  dialog?.addEventListener('click', (event) => { if (startedOutside && isOutside(event)) dialog.close(); });
}
closeOnBackdrop(contactDialog);

const briefForm = $('#brief-form');
const briefResult = $('#brief-result');
const briefOutput = $('#brief-output');
briefForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  const data = new FormData(briefForm);
  const needs = String(data.get('needs') || '').trim();
  if (!needs) {
    briefForm.elements.needs.setCustomValidity('请先写下你最想解决的问题。');
    briefForm.elements.needs.reportValidity();
    return;
  }
  const text = (key, fallback = '待沟通') => String(data.get(key) || '').trim() || fallback;
  briefOutput.value = `给云梦空间的居家设计需求\n\n房子位置：${text('location')}\n想安排的空间：${text('space')}\n目前状态：${text('stage')}\n预算与补充：${text('budget')}\n\n最想解决的问题：\n${needs}\n\n希望进一步确认：服务范围、交付内容、修改安排与设计费用。`;
  briefForm.hidden = true;
  briefResult.hidden = false;
  feedback.textContent = '清单已在本机生成，尚未发送。';
  briefOutput.focus();
});
briefForm?.elements.needs.addEventListener('input', () => briefForm.elements.needs.setCustomValidity(''));
$('[data-edit-brief]')?.addEventListener('click', () => {
  briefResult.hidden = true;
  briefForm.hidden = false;
  feedback.textContent = '';
  briefForm.elements.needs.focus();
});

async function copyText(value, success, fallback) {
  try {
    await navigator.clipboard.writeText(value);
    feedback.textContent = success;
  } catch {
    if (fallback) { fallback.focus(); fallback.select(); }
    feedback.textContent = fallback ? '自动复制未成功，已选中清单，请长按或按 Ctrl / ⌘ + C 复制，也可下载文字版。' : `自动复制未成功，请手动复制：${value}`;
  }
}
$('[data-copy-brief]')?.addEventListener('click', () => copyText(briefOutput.value, '已复制，可以粘贴到微信或其他聊天里。', briefOutput));
$('[data-copy-wechat]')?.addEventListener('click', (event) => copyText(event.currentTarget.dataset.copyWechat, '微信号已复制，请打开微信搜索添加。'));
$('[data-download-brief]')?.addEventListener('click', () => {
  const url = URL.createObjectURL(new Blob(['\uFEFF', briefOutput.value], { type: 'text/plain;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = '云梦空间-我的居家设计需求.txt';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  feedback.textContent = '已发起文字版下载，请在设备的下载记录中查看。';
});

const lightbox = $('.lightbox');
if (lightbox) {
  $$('[data-lightbox]').forEach((button) => button.addEventListener('click', () => {
    const image = $('img', lightbox);
    image.src = button.dataset.lightbox;
    image.alt = button.dataset.lightboxAlt;
    $('p', lightbox).textContent = button.dataset.lightboxAlt;
    lightbox.showModal();
  }));
  $('[data-lightbox-close]', lightbox).addEventListener('click', () => lightbox.close());
  closeOnBackdrop(lightbox);
}

// 本地素材优先；出现图片错误时给出文字提示，避免只留下破图。
$$('img').filter((image) => image.getAttribute('src') && !image.closest('.lightbox')).forEach((image) => {
  function showImageError() {
    if (image.nextElementSibling?.classList.contains('image-error')) return;
    const message = document.createElement('span');
    message.className = 'image-error';
    message.textContent = '图片暂时无法加载，请稍后刷新。';
    image.insertAdjacentElement('afterend', message);
  }
  image.addEventListener('error', showImageError);
  if (image.complete && image.naturalWidth === 0) showImageError();
});
