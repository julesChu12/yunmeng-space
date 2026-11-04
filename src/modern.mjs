import { documentPage, escapeHtml as e } from './templates.mjs';

const arrow = '<span aria-hidden="true">↗</span>';
const image = (src, alt, position = 'center', extra = '') => `<img src="${e(src)}" alt="${e(alt)}" width="1600" height="1067" loading="lazy" decoding="async" style="object-position:${e(position)}" ${extra}>`;
const options = { active: 'modern', bodyClass: 'modern-page', styles: ['/modern.css'], scripts: ['/modern.js'] };

export function modernPage(site, content) {
  const first = content.scenes[0];
  const detail = content.details[0];
  const main = `<section class="film-hero" aria-labelledby="film-title">
    <div class="film-media">
      <picture class="film-poster"><source media="(max-width: 767px)" srcset="${e(first.mobilePoster)}"><img src="${e(first.poster)}" alt="公开授权的居家空间影像，非云梦空间项目实拍。" width="1280" height="720" fetchpriority="high"></picture>
      <video id="hero-film" muted playsinline loop preload="metadata" aria-hidden="true" poster="${e(first.poster)}"></video>
    </div>
    <div class="film-shade" aria-hidden="true"></div>
    <div class="film-copy"><p>${e(site.tagline)}</p><h1 id="film-title">${content.headline.map(e).join('<br>')}</h1><a href="#spaces" class="film-link">从一个空间开始 ${arrow}</a></div>
    <div class="film-controls"><div class="film-scenes" aria-label="切换空间影像">${content.scenes.map((scene, index) => `<button type="button" data-film-scene="${e(scene.id)}" aria-pressed="${index === 0}">${e(scene.label)}</button>`).join('')}</div><button type="button" id="film-toggle" aria-controls="hero-film" aria-label="播放空间影像">播放画面<span class="film-play-symbol" aria-hidden="true"></span></button></div>
    <p class="sr-only" id="film-status" role="status" aria-live="polite"></p>
  </section>
  <p class="modern-media-notice shell">${e(content.mediaNotice)} <a href="/modern/sources/">素材来源 ${arrow}</a></p>
  <section class="modern-intro modern-shell"><h2>一个家，<br>先从好用开始。</h2><div><p>${e(content.intro)}</p><p>先说说你想留下什么、想改变什么，再一起考虑收纳、材料和搭配。</p><button type="button" class="modern-link" data-contact-open>聊聊你家的想法 ${arrow}</button></div></section>
  <section class="modern-spaces modern-shell" id="spaces"><div class="modern-section-heading"><h2>空间里的不同安排。</h2><p>看看几种生活场景，和它们背后的设计考虑。</p></div><div class="modern-filters" aria-label="筛选空间方向"><button type="button" data-space-filter="all" aria-pressed="true">全部</button><button type="button" data-space-filter="木作收纳" aria-pressed="false">木作收纳</button><button type="button" data-space-filter="软装搭配" aria-pressed="false">软装搭配</button></div><p class="sr-only" data-space-filter-status aria-live="polite">显示 ${content.spaces.length} 个空间示意</p><div class="modern-space-grid">${content.spaces.map((space) => `<article class="modern-space" data-space-category="${e(space.category)}"><button type="button" class="modern-space-photo" data-space-open="${e(space.id)}" aria-label="查看${e(space.title)}的设计考虑">${image(space.image, space.alt, space.position)}<span class="modern-view">看设计考虑 ${arrow}</span></button><div class="modern-space-meta"><span>${e(space.space)}</span><span>公开素材示意</span></div><h3><button type="button" data-space-open="${e(space.id)}">${e(space.title)} ${arrow}</button></h3><p>${e(space.description)}</p></article>`).join('')}</div></section>
  <section class="modern-approach" id="approach"><div class="modern-approach-inner modern-shell"><figure>${image(detail.image, detail.alt, detail.position, 'id="detail-photo"')}<figcaption>材质、比例与日常使用。<span>公开素材示意</span></figcaption></figure><div class="modern-detail-copy"><p class="modern-kicker">设计思路</p><h2>好看的背后，<br>也有好用的考虑。</h2><div class="modern-detail-tabs" aria-label="选择设计考虑">${content.details.map((item, index) => `<button type="button" data-detail="${e(item.id)}" aria-pressed="${index === 0}" aria-controls="modern-detail-text">${e(item.label)}</button>`).join('')}</div><div id="modern-detail-text" aria-live="polite"><h3 data-detail-title>${e(detail.title)}</h3><p data-detail-copy>${e(detail.text)}</p></div><button class="modern-link" type="button" data-contact-open>从你的需求开始 ${arrow}</button></div></div></section>
  <section class="modern-designer modern-shell" id="designer"><div><p class="modern-kicker">关于设计师</p><h2>你好，<br>我是${e(site.designer)}。</h2></div><div>${site.about.paragraphs.map((text) => `<p>${e(text)}</p>`).join('')}<a class="modern-link" href="/journal/">读读设计手记 ${arrow}</a></div></section>
  <section class="modern-services modern-shell"><h2>从你需要的部分开始。</h2><div>${site.services.map((service) => `<details><summary>${e(service.title)}<span aria-hidden="true">＋</span></summary><p>${e(service.description)}</p></details>`).join('')}</div></section>
  <div class="modern-provenance modern-shell"><p>空间图像用于说明设计方向，真实案例整理后陆续更新。</p><a href="/modern/sources/">查看图片与视频来源 ${arrow}</a></div>
  <dialog id="space-dialog" class="modern-space-dialog" aria-labelledby="space-dialog-title"><div class="modern-dialog-header"><span>空间与设计考虑</span><button type="button" class="icon-button" data-space-close aria-label="关闭空间详情">×</button></div><img id="space-dialog-image" alt=""><div class="modern-space-dialog-copy"><p class="modern-kicker">公开素材示意，非本工作室项目</p><h2 id="space-dialog-title"></h2><p id="space-dialog-description"></p><ul id="space-dialog-points"></ul><a id="space-dialog-source" target="_blank" rel="noopener noreferrer">查看原始素材 ${arrow}</a></div></dialog>
  <script type="application/json" id="modern-data">${JSON.stringify(content).replace(/</g, '\\u003c')}</script>`;
  return documentPage(site, { ...options, title: `${site.brand}｜室内软装与木作设计`, path: '/modern/', image: first.poster, main });
}

export function modernSourcesPage(site, content) {
  return documentPage(site, { ...options, title: `展示素材来源｜${site.brand}`, path: '/modern/sources/', main: `<section class="modern-sources modern-shell"><a class="back-link" href="/modern/">← 回到影像首页</a><h1>展示素材来源。</h1><p>本页列出影像首页使用的公开素材。视频与图片均不是云梦空间的项目记录，也不表示素材作者与本工作室存在合作或背书关系。</p><div class="modern-source-list">${content.sources.map((source) => `<article id="${e(source.id)}"><p>${e(source.creator)}</p><h2>${e(source.title)}</h2><p>${e(source.use)}</p><div><a href="${e(source.page)}" target="_blank" rel="noopener noreferrer">素材原页 ${arrow}</a><a href="${e(source.licenseUrl)}" target="_blank" rel="noopener noreferrer">${e(source.license)} ${arrow}</a></div></article>`).join('')}</div><p>查询日期：2026-11-04。影片已进行静音、网页压缩与手机画幅处理。正式案例上线时，会更新图片、说明与来源信息。</p></section>` });
}
