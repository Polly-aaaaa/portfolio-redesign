// Разметку кейсов генерирует tools/build.mjs. В браузере этот файл включает просмотр изображений.
const attr = (value) => String(value).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');

function picture(key, { alt = '', eager = false } = {}) {
  const [width, height] = DIMS[key] || [1600, 1000];
  return `<img src="assets/${key}.webp" width="${width}" height="${height}" alt="${attr(alt)}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async" />`;
}

function zoomPicture(key, alt, eager = false) {
  const label = alt ? `Увеличить: ${alt}` : 'Увеличить изображение';
  return `<a class="case-media-view" href="assets/${key}.webp" data-zoom aria-label="${attr(label)}">${picture(key, { alt, eager })}</a>`;
}

function breadcrumbs(project) {
  const parent = project.parent
    ? `<li><span aria-hidden="true">/</span><a class="case-link" href="case-${project.parent}.html">${CASES[project.parent].title}</a></li>`
    : '';
  return `<nav class="case-breadcrumb" aria-label="Путь к кейсу">
    <ol>
      <li><a class="case-link" href="index.html#work">Проекты</a></li>
      ${parent}
      <li><span aria-hidden="true">/</span><span aria-current="page">${project.title}</span></li>
    </ol>
  </nav>`;
}

function caseMetadata(project) {
  const audience = project.tags.filter((tag) => /^B2[A-Z]$/.test(tag));
  const format = project.tags.filter((tag) => !audience.includes(tag));
  const entries = [
    project.period ? ['Период', project.period] : ['Часть проекта', project.kicker],
    ['Аудитория', audience.join(' · ')],
    ['Формат', format.join(' · ')],
    ['В браузере', project.phones ? '<a class="case-link" href="#prototypes">Открыть прототипы</a>' : ''],
  ];
  return `<dl class="case-meta">
    ${entries.filter(([, value]) => value).map(([label, value]) => `<div><dt>${label}</dt><dd>${value}</dd></div>`).join('\n')}
  </dl>`;
}

function caseIntro(project, context) {
  const lead = project.lead || context?.html;
  const leadLabel = context ? `<span class="sr-only">${context.label}. </span>` : '';
  const longestWord = Math.max(...project.title.split(/\s+/).map((word) => word.length));
  const titleSize = longestWord >= 15 ? ' case-title--long-word' : longestWord >= 12 ? ' case-title--medium-word' : '';
  return `
  <section class="panel case-hero" aria-labelledby="case-title">
    <div class="shell case-hero-inner">
      ${breadcrumbs(project)}
      <h1 id="case-title" class="display case-title${titleSize}">${project.title}</h1>
      ${lead ? `<p class="case-lead">${leadLabel}${lead}</p>` : ''}
      ${caseMetadata(project)}
    </div>
  </section>
  <figure class="panel case-cover" style="--case-cover: ${project.coverBg}">
    ${zoomPicture(project.cover, project.title, true)}
  </figure>`;
}

function caseLayout(content, label = '') {
  return `<div class="shell case-layout">
    ${label}
    <div class="case-copy">${content}</div>
  </div>`;
}

function summarySection(project, introContext) {
  const fields = project.summary.filter((field) => field !== introContext);
  if (!fields.length) return '';
  const content = fields.map((field, index) => `
    <div class="case-brief-field">
      <h3 class="${index === 0 ? 'display case-section-title' : 'case-subtitle'}">${field.label}</h3>
      <p>${field.html}</p>
      ${field.list ? `<ul class="case-item-list">${field.list.map((item) => `<li>${item}</li>`).join('')}</ul>` : ''}
    </div>`).join('');
  return `
  <section class="case-section" aria-labelledby="case-summary-title">
    ${caseLayout(`<div class="case-brief">${content}</div>`, '<h2 id="case-summary-title" class="section-label case-side-label">Задача и итог</h2>')}
  </section>`;
}

function figure(key, caption = '', narrow = false) {
  const [width, height] = DIMS[key] || [1600, 1000];
  const size = narrow ? ' case-shot--narrow' : width / height > 2.5 ? ' case-shot--wide' : '';
  return `<figure class="case-shot${size}">
    ${zoomPicture(key, caption)}
    ${caption ? `<figcaption class="case-caption">${caption}</figcaption>` : ''}
  </figure>`;
}

function renderBlock(block) {
  if (block.h) return `<h3 class="case-subtitle">${block.h}</h3>`;
  if (block.p) return `<p>${block.p}</p>`;
  if (block.label) return `<p class="case-gallery-label">${block.label}</p>`;
  if (block.ul) return `<ul class="case-text-list">${block.ul.map((item) => `<li>${item}</li>`).join('')}</ul>`;
  if (block.img) return figure(block.img, block.caption, block.narrow);
  if (block.pair) return `<div class="case-media-pair">${block.pair.map((key, index) => figure(key, block.captions?.[index])).join('')}</div>`;
  return '';
}

function renderNarrative(blocks) {
  const groups = [];
  for (const block of blocks) {
    const media = Boolean(block.img || block.pair);
    const previous = groups.at(-1);
    if (previous?.media === media) previous.blocks.push(block);
    else groups.push({ media, blocks: [block] });
  }
  return groups.map((group) => {
    const html = group.blocks.map(renderBlock).join('\n');
    if (!group.media) return caseLayout(`<div class="case-prose">${html}</div>`);
    const stacked = group.blocks.length > 1 && group.blocks.every((block) => block.img);
    return `<div class="panel case-gallery${stacked ? ' case-gallery--stacked' : ''}">${html}</div>`;
  }).join('\n');
}

function chapter(section, index) {
  const title = section.title || (section.stages ? 'Как шла работа' : '');
  const headingId = `case-chapter-${index + 1}`;
  const steps = section.stages
    ? `<ol class="case-stages">${section.stages.map((stage) => `<li>${stage}</li>`).join('')}</ol>`
    : '';
  const note = section.note ? `<p class="case-note">${section.note}</p>` : '';
  const label = section.stages ? '<p class="section-label case-side-label">Этапы</p>' : '';
  const header = title || note ? caseLayout(`
    ${title ? `<h2 id="${headingId}" class="display case-section-title">${title}</h2>` : ''}
    ${note}${steps}`, label) : '';
  const tag = title ? 'section' : 'div';
  return `
  <${tag} class="case-section case-chapter"${title ? ` aria-labelledby="${headingId}"` : ''}>
    ${header}
    ${renderNarrative(section.blocks)}
  </${tag}>`;
}

function resultsSection(project) {
  if (!project.results?.length) return '';
  const items = project.results.map((result) => `<li>${result}</li>`).join('');
  const note = project.resultsNote ? `<p class="case-caption">* ${project.resultsNote}</p>` : '';
  return `
  <section class="case-section case-results" aria-labelledby="case-results-title">
    ${caseLayout(`<ul class="case-results-list">${items}</ul>${note}`, '<h2 id="case-results-title" class="section-label case-side-label">Результаты</h2>')}
  </section>`;
}

function prototypesSection(phones) {
  return `
  <section id="prototypes" class="case-section case-prototypes" aria-labelledby="case-prototypes-title">
    ${caseLayout('<h2 id="case-prototypes-title" class="display case-section-title">Прототипы</h2>')}
    <div class="panel case-media-pair">
      ${phones.map((phone) => `<figure class="case-shot case-phone">
        <div class="proto"><iframe src="${phone.src}" title="${attr(phone.title)}" loading="${phone.eager ? 'eager' : 'lazy'}" allow="autoplay; fullscreen"></iframe></div>
        <figcaption class="case-caption"><a class="case-link" href="${phone.src}" target="_blank" rel="noopener">${phone.caption}</a></figcaption>
      </figure>`).join('\n')}
    </div>
  </section>`;
}

function caseCard(id) {
  const project = CASES[id];
  return `<a href="case-${id}.html" class="case-card">
    <div class="case-card-image" style="--case-cover: ${project.coverBg}">
      ${picture(project.cover)}
      <span class="case-card-action" aria-hidden="true">Смотреть кейс</span>
    </div>
    <p class="project-meta">${project.kicker || project.tags.join(' · ')}</p>
    <h3 class="project-title">${project.title}</h3>
  </a>`;
}

function relatedCases(id, project) {
  const mainCases = CASE_ORDER.filter((caseId) => !CASES[caseId].parent);
  const index = mainCases.indexOf(project.parent || id);
  const next = [1, 2].map((offset) => mainCases[(index + offset) % mainCases.length]);
  const sibling = project.parent && CASES[project.parent].subcases.find((caseId) => caseId !== id);
  return sibling ? [sibling, next[0]] : next;
}

function cardSection(ids, heading, headingId) {
  return `
  <section class="shell case-section case-related" aria-labelledby="${headingId}">
    <h2 id="${headingId}" class="display case-section-title">${heading}</h2>
    <div class="case-card-grid">${ids.map(caseCard).join('\n')}</div>
  </section>`;
}

function caseHTML(id) {
  const project = CASES[id];
  const introContext = project.lead ? null : project.summary.find((field) => field.label === 'Проблема');
  return [
    caseIntro(project, introContext),
    summarySection(project, introContext),
    project.phones ? prototypesSection(project.phones) : '',
    project.sections.map(chapter).join('\n'),
    resultsSection(project),
    project.subcases ? cardSection(project.subcases, 'Кейсы проекта', 'case-children-title') : '',
    cardSection(relatedCases(id, project), 'Другие проекты', 'case-related-title'),
  ].join('\n');
}

if (typeof document !== 'undefined') {
  const lightbox = document.getElementById('lightbox');
  const image = document.createElement('img');
  lightbox.append(image);

  document.addEventListener('click', (event) => {
    const link = event.target.closest('[data-zoom]');
    if (!link || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || lightbox.open) return;
    event.preventDefault();
    const thumbnail = link.querySelector('img');
    image.src = thumbnail.currentSrc || thumbnail.src;
    image.alt = thumbnail.alt;
    lightbox.showModal();

    if (matchMedia('(prefers-reduced-motion: no-preference)').matches) {
      image.animate([{ opacity: .3, transform: 'scale(.97)' }, { opacity: 1, transform: 'none' }], {
        duration: 280,
        easing: 'cubic-bezier(.22, 1, .36, 1)'
      });
    }
  });
  lightbox.addEventListener('click', (event) => {
    if (event.target === lightbox) lightbox.close();
  });
}
