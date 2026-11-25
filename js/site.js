const header = document.querySelector('.site-header');
const nav = document.getElementById('nav');
const menuButton = document.getElementById('menuBtn');
const menu = document.getElementById('menu');
const progress = document.querySelector('.read-progress');
const darkPanels = [...document.querySelectorAll('[data-nav-dark]')];

function setMenu(open) {
  menuButton.setAttribute('aria-expanded', String(open));
}

nav.classList.add('enhanced');
menuButton.hidden = false;
menuButton.addEventListener('click', () => {
  setMenu(menuButton.getAttribute('aria-expanded') === 'false');
});
menu.addEventListener('click', (event) => {
  if (event.target.closest('a')) setMenu(false);
});
document.addEventListener('click', (event) => {
  if (!nav.contains(event.target) && menuButton.getAttribute('aria-expanded') === 'true') setMenu(false);
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') {
    setMenu(false);
    menuButton.focus();
  }
});

function updateScroll() {
  header.classList.toggle('scrolled', scrollY > 24);
  const { top, height } = header.getBoundingClientRect();
  const midpoint = top + Math.min(height, 54) / 2;
  const dark = darkPanels.some((panel) => {
    const bounds = panel.getBoundingClientRect();
    return bounds.top <= midpoint && bounds.bottom > midpoint;
  });
  header.classList.toggle('is-dark', dark);
  if (progress) {
    const distance = document.documentElement.scrollHeight - innerHeight;
    progress.style.transform = 'scaleX(' + (distance > 0 ? scrollY / distance : 0) + ')';
  }
}
addEventListener('scroll', updateScroll, { passive: true });
addEventListener('resize', updateScroll);
updateScroll();

const motion = matchMedia('(prefers-reduced-motion: no-preference)');
if (motion.matches && 'IntersectionObserver' in window) {
  const items = Array.from(document.querySelectorAll('.reveal'));
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add('in');
      observer.unobserve(entry.target);
    }
  }, { rootMargin: '0px 0px 8% 0px' });

  function revealAnchor() {
    const target = document.getElementById(location.hash.slice(1));
    if (!target) return;
    const fold = target.getBoundingClientRect().top + innerHeight;
    for (const item of items) {
      if (item.getBoundingClientRect().top >= fold || item.classList.contains('in')) continue;
      item.classList.add('in', 'preceding-anchor');
      observer.unobserve(item);
    }
  }

  for (const group of document.querySelectorAll('[data-stagger]')) {
    group.querySelectorAll(':scope > .reveal').forEach((item, index) => {
      item.style.setProperty('--stagger', Math.min(index, 3) * 65 + 'ms');
    });
  }

  if (!location.hash || location.hash === '#top') {
    document.querySelectorAll('[data-split]').forEach(animateHeading);
  }
  revealAnchor();
  items.filter((item) => !item.classList.contains('in')).forEach((item) => observer.observe(item));
  document.documentElement.classList.add('motion-ready');
  addEventListener('hashchange', revealAnchor);
}

function animateHeading(heading) {
  const nodes = [];
  const walker = document.createTreeWalker(heading, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) nodes.push(walker.currentNode);
  let index = 0;

  for (const node of nodes) {
    const words = document.createDocumentFragment();
    for (const part of node.textContent.split(/(\s+)/)) {
      if (!part) continue;
      if (/^\s+$/.test(part)) {
        words.append(part);
        continue;
      }
      const mask = document.createElement('span');
      const word = document.createElement('span');
      mask.className = 'word-mask';
      word.textContent = part;
      word.style.setProperty('--word-delay', (80 + index * 58) + 'ms');
      word.addEventListener('animationend', () => mask.classList.add('entered'), { once: true });
      mask.append(word);
      words.append(mask);
      index += 1;
    }
    node.replaceWith(words);
  }
}
