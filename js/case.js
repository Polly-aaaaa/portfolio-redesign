// Разметку кейсов генерирует tools/build.mjs. В браузере этот файл включает просмотр изображений.
const attr = (value) => String(value).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');

function picture(key, { alt = '', cls = '', eager = false } = {}) {
  const [width, height] = DIMS[key] || [1600, 1000];
  return `<img src="assets/${key}.webp" width="${width}" height="${height}" alt="${attr(alt)}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async" class="${cls}" />`;
}

function zoomPicture(key, alt, eager = false) {
  const label = alt ? `Увеличить: ${alt}` : 'Увеличить изображение';
  return `<a href="assets/${key}.webp" data-zoom aria-label="${attr(label)}">${picture(key, { alt, eager })}</a>`;
}

function figure(key, caption = '', { narrow = false } = {}) {
  return `<figure class="reveal ${narrow ? 'mx-auto max-w-xl' : ''}">
    <div class="case-figure">${zoomPicture(key, caption)}</div>
    ${caption ? `<figcaption class="case-caption">${caption}</figcaption>` : ''}
  </figure>`;
}

function renderBlock(block) {
  if (block.h) return `<h3 class="case-subtitle reveal mx-auto max-w-2xl">${block.h}</h3>`;
  if (block.p) return `<p class="reveal prose-case mx-auto max-w-2xl text-base leading-relaxed sm:text-lg">${block.p}</p>`;
  if (block.label) return `<div class="reveal mx-auto max-w-2xl"><span class="pill">${block.label}</span></div>`;
  if (block.ul) return `<ul class="reveal prose-case mx-auto max-w-2xl list-disc space-y-2.5 pl-5 text-base leading-relaxed sm:text-lg">${block.ul.map((item) => `<li>${item}</li>`).join('')}</ul>`;
  if (block.img) return figure(block.img, block.caption, { narrow: block.narrow });
  if (block.pair) return `<div class="grid gap-6 sm:grid-cols-2">${block.pair.map((key, index) => figure(key, block.captions?.[index] || '')).join('')}</div>`;
  return '';
}

function stagesBlock(stages) {
  return `<div class="reveal mx-auto max-w-2xl">
    <p class="text-sm">Этапы</p>
    <ol class="mt-3 flex flex-wrap gap-2">${stages.map((stage, index) =>
      `<li class="case-rule flex items-center gap-2 rounded-full border py-1 pl-1 pr-3.5 text-sm"><span class="stage-dot grid h-6 w-6 place-items-center rounded-full" aria-hidden="true">${index + 1}</span>${stage}</li>`).join('')}
    </ol>
  </div>`;
}

function problemGoal(problem, goal) {
  if (!problem || !goal) return '';
  return `<div class="grid gap-4 md:grid-cols-2">
    ${[problem, goal].map(({ label, html }) => `<div class="reveal case-note">
      <p class="case-note-title">${label}</p>
      <p class="prose-case mt-3 leading-relaxed">${html}</p>
    </div>`).join('')}
  </div>`;
}

function detailRow(detail) {
  const list = detail.list
    ? `<ul class="mt-4 flex flex-wrap gap-2">${detail.list.map((item) => `<li class="pill">${item}</li>`).join('')}</ul>`
    : '';
  return `<div class="case-rule reveal grid gap-3 border-t py-6 md:grid-cols-[11rem_1fr] md:gap-10">
    <p class="case-marker pt-1 text-sm font-semibold">${detail.label}</p>
    <div><p class="prose-case max-w-[62ch] text-base leading-relaxed sm:text-lg">${detail.html}</p>${list}</div>
  </div>`;
}

function resultsBlock(project) {
  if (!project.results) return '';
  const items = project.results.map((result) =>
    `<li class="case-rule reveal border-t pt-4 text-base leading-relaxed sm:text-xl">${result}</li>`).join('');
  const note = project.resultsNote ? `<p class="case-caption mt-6">* ${project.resultsNote}</p>` : '';
  return `<div class="case-results mt-12">
    <h3 class="reveal display case-section-title">Результаты</h3>
    <ul class="mt-6 space-y-4">${items}</ul>
    ${note}
  </div>`;
}

function caseCard(id) {
  const project = CASES[id];
  return `<a href="case-${id}.html" class="project reveal">
    <div class="project-media" style="--cover: ${project.coverBg}">
      ${picture(project.cover, { alt: project.title })}
    </div>
    <div class="project-copy">
      <p class="project-meta">${project.kicker || 'Кейс'}</p>
      <h3 class="project-title">${project.title}</h3>
    </div>
  </a>`;
}

function phonesBlock(phones) {
  return `<div class="grid items-start gap-x-10 gap-y-12 md:grid-cols-2">${phones.map((phone) => `
    <figure class="proto-wrap">
      <div class="case-cover proto"><iframe src="${phone.src}" title="${attr(phone.title)}" loading="${phone.eager ? 'eager' : 'lazy'}" allow="autoplay; fullscreen"></iframe></div>
      <figcaption class="case-caption text-center"><a class="link-u" href="${phone.src}" target="_blank" rel="noopener">${phone.caption}</a></figcaption>
    </figure>`).join('')}</div>`;
}

function caseHTML(id) {
  const project = CASES[id];
  const parent = project.parent && CASES[project.parent];
  const kicker = project.kicker || project.period;
  const backHref = parent ? `case-${project.parent}.html` : 'index.html#work';
  const hero = `
  <section class="panel case-hero">
    <div class="shell">
      <a class="back-link link-u" href="${backHref}">${parent ? parent.title : 'Все проекты'}</a>
      ${kicker ? `<p class="case-kicker section-label reveal">${kicker}</p>` : ''}
      <h1 data-split class="display case-title">${project.title}</h1>
      ${project.lead ? `<p class="case-lead reveal" style="--stagger: 160ms">${project.lead}</p>` : ''}
      <p class="case-tags reveal" style="--stagger: 230ms">${project.tags.map((tag) => `<span class="pill">${tag}</span>`).join('')}</p>
    </div>
  </section>
  <div class="shell case-body">
  <div class="case-visual">
    ${project.phones ? phonesBlock(project.phones) : `<div class="case-figure" style="background: ${project.coverBg}">${zoomPicture(project.cover, project.title, true)}</div>`}
  </div>`;

  const problem = project.summary.find((item) => item.label === 'Проблема');
  const goal = project.summary.find((item) => item.label === 'Задача' || item.label === 'Цель');
  const details = problem && goal ? project.summary.filter((item) => item !== problem && item !== goal) : project.summary;
  const summary = `
  <section class="case-section">
    <h2 class="reveal display case-section-title">Задача и итог</h2>
    <div class="mt-8">
      ${problemGoal(problem, goal)}
      ${details.length ? `<div class="mt-8">${details.map(detailRow).join('')}</div>` : ''}
      ${resultsBlock(project)}
    </div>
  </section>`;

  const sections = project.sections.map((section) => {
    const title = section.title || (section.stages ? 'Как шла работа' : '');
    return `<section class="case-section">
      ${title ? `<h2 class="reveal display case-section-title mb-8">${title}</h2>` : ''}
      <div class="space-y-7">
        ${section.note ? `<p class="case-note reveal mx-auto max-w-2xl">${section.note}</p>` : ''}
        ${section.stages ? stagesBlock(section.stages) : ''}
        ${section.blocks.map(renderBlock).join('\n')}
      </div>
    </section>`;
  }).join('');

  const subcases = project.subcases ? `<section class="case-section">
    <h2 class="reveal display case-section-title mb-8">Кейсы проекта</h2>
    <div class="grid gap-8 sm:grid-cols-2" data-stagger>${project.subcases.map(caseCard).join('')}</div>
  </section>` : '';

  const next = CASE_ORDER[(CASE_ORDER.indexOf(id) + 1) % CASE_ORDER.length];
  const nextProject = CASES[next];
  const nextBlock = `
  <section class="case-section">
    <a href="case-${next}.html" class="project project-featured reveal">
      <div class="project-media" style="--cover: ${nextProject.coverBg}">
        ${picture(nextProject.cover, { alt: nextProject.title })}
      </div>
      <div class="project-copy">
        <p class="project-meta">${nextProject.parent ? 'Следующий кейс' : 'Следующий проект'}</p>
        <h2 class="project-title">${nextProject.title}</h2>
      </div>
    </a>
  </section>`;

  return hero + summary + sections + subcases + nextBlock + '\n  </div>';
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
