// 页面只负责展示；案例、手记与联系方式来自 content 中的数据文件。
import { socialPlatforms, socialIcon } from './socials.mjs';

export const escapeHtml = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const e = escapeHtml;
const arrow = '<span aria-hidden="true">↗</span>';
const paragraph = (text) => `<p>${e(text)}</p>`;

function navigation(site, active) {
  const modern = active === 'modern';
  const links = modern ? [['spaces', '/modern/#spaces', '空间提案'], ['approach', '/modern/#approach', '设计思路'], ['designer', '/modern/#designer', `关于${site.designer}`]] : [['projects', '/projects/', '看设计'], ['journal', '/journal/', '设计手记'], ['about', '/#about', '关于Gina']];
  const items = links.map(([key, href, label]) => `<a href="${e(href)}" ${active === key ? 'aria-current="page"' : ''}>${e(label)}</a>`).join('');
  return `<header class="site-header shell">
    <a class="brand" href="${modern ? '/modern/' : '/'}" aria-label="${e(site.brand)}首页"><span class="wordmark">${e(site.brand)}</span><span class="brand-description">${e(site.tagline)}</span></a>
    <nav class="desktop-nav" aria-label="主导航">
      ${items}
    </nav>
    <button class="header-contact" type="button" data-contact-open>聊聊你家 ${arrow}</button>
    <button class="menu-toggle" type="button" aria-controls="mobile-menu" aria-expanded="false">菜单<span aria-hidden="true">＋</span></button>
    <nav id="mobile-menu" class="mobile-nav" aria-label="手机导航" hidden>${items}<button type="button" data-contact-open>聊聊你家 ${arrow}</button></nav>
  </header>`;
}

function contactDialog(site) {
  const { contact } = site;
  return `<dialog id="contact-dialog" class="contact-dialog" aria-labelledby="contact-title">
    <div class="dialog-heading"><span>云梦空间 / 需求沟通</span><button class="icon-button" type="button" data-dialog-close aria-label="关闭需求窗口">×</button></div>
    <div class="dialog-body"><h2 id="contact-title">先说说，你家的事。</h2><p class="muted">不必有完整的方案，从现在最困扰你的地方开始。</p>
    ${contact.wechat || contact.qrImage || contact.phone ? `<div class="contact-channels">${contact.qrImage ? `<img class="qr-image" src="${e(contact.qrImage)}" alt="${e(site.designer)}的微信二维码" width="160" height="160">` : ''}${contact.wechat ? `<p>微信：<strong>${e(contact.wechat)}</strong></p><button class="text-link" type="button" data-copy-wechat="${e(contact.wechat)}">复制微信号 ${arrow}</button>` : ''}${contact.phone ? `<p><a href="tel:${e(contact.phone)}">电话：${e(contact.phone)}</a></p>` : ''}</div>` : '<p class="contact-pending">咨询联系方式整理中。你可以先保存需求清单，之后发给设计师。</p>'}
    <form id="brief-form">
      <div class="form-grid"><label>房子在哪里<input name="location" maxlength="80" placeholder="例如：北京，朝阳" autocomplete="off"></label><label>想安排哪个空间<select name="space"><option value="">先选一个方向</option><option>柜体与收纳</option><option>软装搭配</option><option>多个空间一起考虑</option><option>还没想好，先聊聊</option></select></label></div>
      <label>最想解决的问题 <span class="muted">（必填）</span><textarea name="needs" rows="3" maxlength="1800" required placeholder="比如：玄关不够放鞋，客厅想增加收纳，还想保留现在的沙发。"></textarea></label>
      <div class="form-grid"><label>空间目前的状态<select name="stage"><option>还在了解和计划</option><option>毛坯，准备开始</option><option>装修中</option><option>已经入住，想局部调整</option></select></label><label>预算或补充想法<input name="budget" maxlength="160" placeholder="可选，按你的实际计划填写"></label></div>
      <p class="form-privacy">内容只用于在你的设备上生成清单，不会自动发送或上传。</p>
      <button class="button primary" type="submit">生成需求清单 ${arrow}</button>
    </form>
    <section id="brief-result" class="brief-result" aria-labelledby="brief-result-title" hidden><h3 id="brief-result-title">这份清单，带着一起聊。</h3><label class="sr-only" for="brief-output">生成的需求清单</label><textarea id="brief-output" rows="9" readonly></textarea><div class="result-actions"><button class="button primary" type="button" data-copy-brief>复制清单</button><button class="button secondary" type="button" data-download-brief>下载文字版</button><button class="text-link" type="button" data-edit-brief>返回修改</button></div></section>
    <p class="feedback" role="status" aria-live="polite"></p></div>
  </dialog>`;
}

function socialChannels(site) {
  const { contact } = site;
  const channels = socialPlatforms;
  const hasWechat = Boolean(contact.wechat || contact.qrImage);
  return `<section class="social-section shell" aria-labelledby="social-title"><div class="social-intro"><p class="section-label">关注云梦空间</p><h2 id="social-title">设计之外，也有日常。</h2><p>关于家的想法，在这里继续分享。</p></div><div class="social-channels">${channels.map(({ key, label, icon, description }) => {
    const content = `<span class="social-icon social-icon-${icon}">${socialIcon(icon)}</span><span class="social-copy"><span class="social-name">${label}</span><span class="social-description">${contact[key] ? description : '账号筹备中'}</span></span>${contact[key] ? arrow : ''}`;
    return contact[key] ? `<a class="social-channel" href="${e(contact[key].trim())}" target="_blank" rel="noopener noreferrer" aria-label="在新窗口打开${e(site.brand)}的${label}主页">${content}</a>` : `<button class="social-channel" type="button" disabled aria-label="${label}账号筹备中">${content}</button>`;
  }).join('')}<button class="social-channel" type="button" ${hasWechat ? 'data-contact-open' : 'disabled'} aria-label="${hasWechat ? '打开微信咨询方式' : '微信咨询方式筹备中'}"><span class="social-icon">${socialIcon('wechat')}</span><span class="social-copy"><span class="social-name">微信咨询</span><span class="social-description">${hasWechat ? '聊聊你家的具体需求' : '联系方式筹备中'}</span></span>${hasWechat ? arrow : ''}</button></div></section>`;
}

function footer(site) {
  return `<section class="contact-section shell" id="contact"><div><p class="section-label">一起想想家的安排</p><h2>你家的想法，<br>可以慢慢聊。</h2><p>先了解空间、生活习惯和预算，<br>再一起确定设计范围。</p></div><div class="contact-action"><button class="button primary" type="button" data-contact-open>整理我的需求 ${arrow}</button><p>${e(site.serviceArea)}</p></div></section>
    ${socialChannels(site)}<footer class="site-footer shell"><a href="/" class="footer-brand">${e(site.brand)}</a><span>室内软装 / 柜体与木作设计</span><div class="footer-links">${site.companyRegistered ? `<span>${e(site.proposedCompanyName)}</span>` : '<span>和Gina一起，想想家的安排。</span>'}</div></footer>${contactDialog(site)}`;
}

export function documentPage(site, { title, description, path = '/', active = '', main, image, bodyClass = '', styles = [], scripts = [] }) {
  const canonical = site.siteUrl ? new URL(path, site.siteUrl).href : '';
  const indexable = site.indexable === true && Boolean(canonical);
  return `<!doctype html><html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="color-scheme" content="light dark"><meta name="theme-color" content="#fafcf9"><title>${e(title)}</title><meta name="description" content="${e(description || site.description)}"><meta name="robots" content="${indexable ? 'index,follow' : 'noindex,nofollow'}">${canonical ? `<link rel="canonical" href="${e(canonical)}">` : ''}<meta property="og:type" content="website"><meta property="og:title" content="${e(title)}"><meta property="og:description" content="${e(description || site.description)}">${canonical ? `<meta property="og:url" content="${e(canonical)}">` : ''}${image && site.siteUrl ? `<meta property="og:image" content="${e(new URL(image, site.siteUrl).href)}">` : ''}<link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="/styles.css">${styles.map((href) => `<link rel="stylesheet" href="${e(href)}">`).join('')}<script src="/app.js" type="module"></script>${scripts.map((src) => `<script src="${e(src)}" type="module"></script>`).join('')}</head><body class="${e(bodyClass)}"><a href="#main" class="skip-link">跳到主要内容</a>${navigation(site, active)}<main id="main">${main}</main>${footer(site)}</body></html>`;
}

function picture(src, alt, { className = '', eager = false, position = 'center', width = 1100, height = 825 } = {}) {
  return `<img class="${e(className)}" src="${e(src)}" alt="${e(alt)}" width="${width}" height="${height}" loading="${eager ? 'eager' : 'lazy'}" ${eager ? 'fetchpriority="high"' : ''} decoding="async" style="object-position:${e(position)}">`;
}

export function projectCard(project) {
  return `<article class="project-card" data-categories="${e(project.categories.join('|'))}"><a href="/projects/${e(project.slug)}/" class="project-image-link">${picture(project.cover, project.coverAlt, { position: project.coverPosition })}<span class="image-open" aria-hidden="true">↗</span></a><div class="project-meta"><span>${e(project.space)}</span><span>${project.kind === 'concept' ? '概念提案' : '项目案例'}</span></div><h3><a href="/projects/${e(project.slug)}/">${e(project.title)} ${arrow}</a></h3><p>${e(project.summary)}</p><p class="image-credit">${e(project.imageCredit)}</p></article>`;
}

function filters(projects) {
  const categories = [...new Set(projects.flatMap((project) => project.categories))];
  return `<div class="filters" aria-label="按设计方向筛选"><button type="button" data-filter="all" aria-pressed="true">全部<span>${projects.length}</span></button>${categories.map((category) => `<button type="button" data-filter="${e(category)}" aria-pressed="false">${e(category)}</button>`).join('')}</div>`;
}

function projectCollection(projects, home = false) {
  return `<div data-project-collection>${filters(projects)}<p class="sr-only" aria-live="polite" data-filter-status>显示 ${projects.length} 个提案</p><div class="project-grid ${home ? 'project-grid-home' : ''}">${projects.map(projectCard).join('')}</div><p class="empty-state" data-filter-empty hidden>这个方向的案例还在整理中，可以先看看其他提案。</p></div>`;
}

function noteCard(note) {
  return `<article class="note-card"><a class="note-image" href="/journal/${e(note.slug)}/">${picture(note.image, `${note.category}文章配图，AI 生成居家意向，非项目实拍。`, { position: note.imagePosition })}</a><div class="note-text"><p class="section-label">${e(note.category)}</p><h3><a href="/journal/${e(note.slug)}/"><span class="note-title-copy">${e(note.title).replace('，', '，<br class="mobile-break">')}</span>${arrow}</a></h3><p>${e(note.summary)}</p></div></article>`;
}

export function homePage(site, projects, notes) {
  const { hero } = site;
  const current = hero.notes[0];
  const main = `<section class="hero shell" aria-labelledby="hero-title"><div class="hero-copy"><p class="greeting">${e(hero.greeting)}</p><h1 id="hero-title">${hero.title.map(e).join('<br>')}</h1><p class="hero-description">${e(hero.description)}</p><a class="text-link hero-link" href="#design">看看家的不同安排 ${arrow}</a></div><div class="hero-visual"><figure><div class="annotated-image">${picture(hero.image, hero.alt, { eager: true })}${hero.notes.map((note, i) => `<button type="button" class="image-note ${note.x > 50 ? 'image-note-to-left' : 'image-note-to-right'}" data-note="${e(note.id)}" aria-label="查看${e(note.label)}说明" aria-pressed="${i === 0}" aria-controls="hero-note" style="--x:${note.x}%;--y:${note.y}%"><span class="image-note-label">${e(note.label)}</span><span class="image-note-leader" aria-hidden="true"></span></button>`).join('')}</div><figcaption class="hero-caption"><span>${e(hero.caption)}</span><span>${e(hero.imageCredit)}</span></figcaption></figure><div class="hero-note" id="hero-note"><div class="note-tabs" aria-label="选择设计细节">${hero.notes.map((note, i) => `<button type="button" data-note="${e(note.id)}" aria-pressed="${i === 0}">${e(note.label)}</button>`).join('')}</div><div class="note-content" aria-live="polite"><h2 data-note-title>${e(current.title)}</h2><p data-note-copy>${e(current.text)}</p></div></div></div></section>
    <section class="design-section shell" id="design"><div class="section-heading"><p class="section-label">关于家的设计提案</p><h2>好住，藏在这些小考虑里。</h2><p>先看看空间里的安排，和每一次选择背后的想法。</p></div>${projectCollection(projects.filter((p) => p.featured), true)}<a class="text-link section-more" href="/projects/">浏览全部设计 ${arrow}</a></section>
    <section class="about-section" id="about"><div class="about-inner shell"><figure class="about-image">${picture(hero.image, 'AI 意向图中的木质餐桌、绿植与自然光，用作设计理念配图。', { position: '85% 80%' })}<figcaption>从一个角落，想想每天的生活。<span>AI 居家意向图</span></figcaption></figure><div class="about-copy"><p class="section-label">关于Gina</p><h2>${e(site.about.title).replace('，', '，<br>')}</h2>${site.about.paragraphs.map(paragraph).join('')}<a class="text-link" href="#services">看看可以一起做什么 ${arrow}</a><span class="signature" aria-label="Gina">Gina</span></div></div></section>
    <section class="services-section shell" id="services"><div class="section-heading"><h2>一个柜子，一间房，<br>都可以是开始。</h2><p>先说清楚想解决什么，再确认服务范围与交付内容。</p></div><div class="service-list">${site.services.map((service, i) => `<details ${i === 0 ? 'open' : ''}><summary><span><strong>${e(service.title)}</strong><span class="service-summary">${e(service.summary)}</span></span><span class="details-mark" aria-hidden="true">＋</span></summary><div class="service-description"><p>${e(service.description)}</p><p class="deliverables">${e(service.deliverables)}</p></div></details>`).join('')}</div><div class="process" aria-label="设计合作流程">${[['需求沟通', '空间、习惯与预算'], ['量房与方案', '确认条件，讨论安排'], ['选材与深化', '把材料和细节落到图上'], ['交付与核对', '明确图纸和清单']].map(([title, text]) => `<div><h3>${title}</h3><p>${text}</p></div>`).join('')}</div></section>
    <section class="journal-section shell" id="journal"><div class="section-heading"><p class="section-label">设计手记</p><h2>把设计，说得具体一点。</h2><p>收纳、木作和搭配，从平常的小问题说起。</p></div><div class="note-grid">${notes.map(noteCard).join('')}</div><a class="text-link section-more" href="/journal/">读更多手记 ${arrow}</a></section>
    <section class="faq-section shell"><h2>你可能还想问。</h2><div>${site.faq.map((item) => `<details><summary>${e(item.question)}<span class="details-mark" aria-hidden="true">＋</span></summary><p>${e(item.answer)}</p></details>`).join('')}</div></section>`;
  const data = JSON.stringify(hero.notes).replace(/</g, '\\u003c');
  return documentPage(site, { title: `${site.brand}｜${site.tagline}`, main: `${main}<script type="application/json" id="hero-notes-data">${data}</script>`, image: hero.image });
}

export function projectsPage(site, projects) {
  return documentPage(site, { title: `看设计｜${site.brand}`, path: '/projects/', active: 'projects', main: `<div class="shell page-intro"><a class="back-link" href="/">← 回到首页</a><p class="section-label">看设计</p><h1>空间里的安排，<br>都有它的原因。</h1><p>从柜体收纳到软装搭配，看看家的不同可能。</p><p class="page-notice">目前展示概念提案与 AI 居家意向，真实项目整理后陆续更新。</p></div><section class="shell collection-section" aria-label="设计提案">${projectCollection(projects)}</section>` });
}

export function projectPage(site, project, next) {
  return documentPage(site, { title: `${project.title}｜${site.brand}`, description: project.summary, path: `/projects/${project.slug}/`, active: 'projects', image: project.cover, main: `<article><div class="shell project-intro"><a class="back-link" href="/projects/">← 全部设计</a><p class="section-label">${e(project.space)} / ${project.kind === 'concept' ? '概念提案' : '项目案例'}</p><h1>${e(project.title)}</h1><p class="intro-subtitle">${e(project.subtitle)}</p>${project.kind === 'concept' ? '<p class="page-notice">本页为设计表达示意，配图由 AI 生成，非真实业主项目或完工记录。</p>' : ''}</div><figure class="shell case-cover">${picture(project.cover, project.coverAlt, { eager: true, position: project.coverPosition })}<figcaption>${e(project.imageCredit)}</figcaption></figure><div class="shell case-body"><aside class="case-facts"><h2>关于这个${project.kind === 'concept' ? '提案' : '项目'}</h2><dl>${project.facts.map((fact) => `<div><dt>${e(fact.label)}</dt><dd>${e(fact.value)}</dd></div>`).join('')}</dl></aside><div class="case-story"><p class="story-lead">${e(project.summary)}</p>${project.sections.map((section) => `<section><h2>${e(section.title)}</h2><p>${e(section.text)}</p></section>`).join('')}</div></div><div class="shell case-gallery">${project.gallery.map((photo) => `<figure><button type="button" class="lightbox-trigger" data-lightbox="${e(photo.src)}" data-lightbox-alt="${e(photo.alt)}" aria-label="放大图片：${e(photo.caption)}">${picture(photo.src, photo.alt)}<span>放大查看 ↗</span></button><figcaption>${e(photo.caption)}</figcaption></figure>`).join('')}</div>${next ? `<a href="/projects/${e(next.slug)}/" class="next-project shell"><span>再看看另一个安排</span><strong>${e(next.title)}</strong>${arrow}</a>` : ''}</article><dialog class="lightbox" aria-label="图片大图"><button class="icon-button" data-lightbox-close type="button" aria-label="关闭大图">×</button><img alt=""><p></p></dialog>` });
}

export function journalPage(site, notes) {
  return documentPage(site, { title: `设计手记｜${site.brand}`, path: '/journal/', active: 'journal', main: `<div class="shell page-intro"><a class="back-link" href="/">← 回到首页</a><p class="section-label">设计手记</p><h1>把设计，<br>说得具体一点。</h1><p>一些关于收纳、木作和搭配的想法，慢慢写给你看。</p></div><section class="shell journal-list" aria-label="设计文章"><div class="note-grid">${notes.map(noteCard).join('')}</div></section>` });
}

export function notePage(site, note, next) {
  return documentPage(site, { title: `${note.title}｜${site.brand}`, description: note.summary, path: `/journal/${note.slug}/`, active: 'journal', image: note.image, main: `<article class="reading-page"><header class="shell article-intro"><a class="back-link" href="/journal/">← 全部手记</a><p class="section-label">${e(note.category)}</p><h1>${e(note.title).replace('，', '，<br class="mobile-break">')}</h1><p>${e(note.summary)}</p><p class="article-byline">Gina / 云梦空间</p></header><figure class="shell article-cover">${picture(note.image, 'AI 生成的居家意向图，作为本文的设计讨论配图，非项目实拍。', { eager: true, position: note.imagePosition })}<figcaption>AI 居家意向图，非项目实拍。</figcaption></figure><div class="article-body">${note.sections.map((section) => `<section><h2>${e(section.title)}</h2><p>${e(section.text)}</p></section>`).join('')}</div>${next ? `<a class="next-article" href="/journal/${e(next.slug)}/"><span>接着读</span><strong>${e(next.title)}</strong>${arrow}</a>` : ''}</article>` });
}

export function notFoundPage(site) {
  return documentPage(site, { title: `页面未找到｜${site.brand}`, path: '/404.html', main: '<section class="shell not-found"><p class="section-label">页面未找到</p><h1>这个角落，还没有内容。</h1><p>链接可能已调整，回首页看看其他设计吧。</p><a class="button primary" href="/">回到首页 ↗</a></section>' });
}
