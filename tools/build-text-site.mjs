#!/usr/bin/env node
/* Static generator for the text-first site at /text/.
 *
 * Reads shared project records from ../js/projectData.js (so one edit updates
 * both the 3D and text presentations) plus hand-authored copy from
 * ./text-content.mjs, resolves manifests to real R2 URLs, and writes plain,
 * accessible HTML for every route. No Three.js, scene code, or framework is
 * imported or referenced by the output.
 *
 * Usage:  node tools/build-text-site.mjs            (fast build)
 *         CHECK_MEDIA=1 node tools/build-text-site.mjs   (also HEAD-check media)
 */

import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import https from 'node:https';

import { projects } from '../js/projectData.js';
import {
  SITE, NAV, PROJECT_SLUGS, CHILD_SLUGS, PROJECT_META, HOME_ORDER,
  ABOUT, RESEARCH, TRANSLATIONS, PRESS, CONTACT, MISSING,
} from './text-content.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const OUT = join(ROOT, 'text');

const missingMedia = [];
const warnings = [];

/* ───────────────────────── helpers ───────────────────────── */

const esc = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

// For first-party rich text that already contains intended <a>/<em> markup.
const richText = (s) =>
  String(s ?? '')
    .split('\n\n')
    .map((para) => `<p>${para.replace(/\n/g, '<br>')}</p>`)
    .join('\n');

const slugify = (s) =>
  String(s)
    .toLowerCase()
    .replace(/[’'"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

const isExternal = (url) => /^https?:\/\//i.test(url);
const isPdf = (url) => /\.pdf(\?.*)?$/i.test(url);

function writePage(routeDir, html) {
  const dir = join(OUT, routeDir);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.html'), html, 'utf8');
}

function dimsFromWixUrl(url) {
  const m = String(url).match(/[\/,]w_(\d+),h_(\d+)/);
  if (m) return { width: Number(m[1]), height: Number(m[2]) };
  return {};
}

/* Resolve a project/child manifest into concrete R2 image records, matching the
 * 3D site's resolution rules (../js/project.js). */
function readManifest(manifestPath) {
  const abs = join(ROOT, manifestPath);
  if (!existsSync(abs)) {
    warnings.push(`manifest missing: ${manifestPath}`);
    return [];
  }
  const text = readFileSync(abs, 'utf8');
  const baseDir = manifestPath.split('/').slice(0, -1).join('/');
  const out = [];
  let inImages = false;
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (!line) continue;
    if (line === '[IMAGES]') { inImages = true; continue; }
    if (line === '[VIDEOS]') break;
    if (!inImages) continue;
    const parts = line.split('\t');
    const fileName = parts[0];
    if (!fileName || fileName === 'NONE') continue;
    if (parts[1] === 'LOCAL' && parts[2]) {
      out.push({ src: `${SITE.r2}${baseDir}/${parts[2]}` });
    } else {
      out.push({
        src: `${SITE.r2}${baseDir}/images/${fileName}`,
        ...dimsFromWixUrl(parts[1] || ''),
      });
    }
  }
  return out;
}

function resolveMedia(p) {
  if (p.manifestPath) return readManifest(p.manifestPath);
  if (Array.isArray(p.media)) return p.media.map((src) => ({ src }));
  return [];
}

function coverFor(p, meta) {
  const alt = meta.coverAlt || `${meta.display || p.title} — cover image`;
  if (meta.coverUrl) return { src: meta.coverUrl, alt };
  if (p.screenImage) return { src: `${SITE.r2}${p.screenImage}`, alt };
  const media = resolveMedia(p);
  if (media.length) return { ...media[0], alt };
  return null;
}

/* ───────────────────────── layout ───────────────────────── */

function navHtml(activeHref) {
  const items = NAV.map((n) => {
    const current = n.href === activeHref ? ' aria-current="page"' : '';
    return `<li><a href="${n.href}"${current}>${esc(n.label)}</a></li>`;
  }).join('');
  return `<nav class="primary" aria-label="Primary"><ul>${items}</ul></nav>`;
}

function footerHtml() {
  return `<footer class="site-footer">
  <p class="row"><a href="/text/">Text home</a> &middot; <a href="/">3D experience</a></p>
  <p class="row muted">${esc(SITE.nameFull)} &middot; ting.directory</p>
</footer>`;
}

function layout({ title, desc, path, bodyHtml, ogImage, imageToggle }) {
  const canonical = `${SITE.origin}${path}`;
  const fullTitle = title === SITE.name ? title : `${title} — ${SITE.name}`;
  const og = ogImage
    ? `\n  <meta property="og:image" content="${escAttrUrl(ogImage)}">`
    : '';
  // Set the hide-images preference before paint to avoid a flash.
  const preScript = imageToggle
    ? `\n  <script>try{if(localStorage.getItem('ting-text-hide-images')==='1')document.documentElement.className+=' no-images';}catch(e){}</script>`
    : '';
  const appScript = `\n  <script src="/text/text.js" defer></script>`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(fullTitle)}</title>
  <meta name="description" content="${escAttr(desc)}">
  <link rel="canonical" href="${escAttrUrl(canonical)}">
  <meta property="og:type" content="website">
  <meta property="og:title" content="${escAttr(fullTitle)}">
  <meta property="og:description" content="${escAttr(desc)}">
  <meta property="og:url" content="${escAttrUrl(canonical)}">${og}
  <meta name="twitter:card" content="${ogImage ? 'summary_large_image' : 'summary'}">
  <link rel="stylesheet" href="/text/text.css">${preScript}${appScript}
</head>
<body>
  <a class="skip-link" href="#main">Skip to content</a>
  <div class="wrap">
    <header class="masthead">
      <p class="site-name"><a href="/text/">${esc(SITE.nameFull)}</a></p>
      ${navHtml(path)}
    </header>
    <main id="main">
${bodyHtml}
    </main>
    ${footerHtml()}
  </div>
</body>
</html>
`;
}

const escAttr = (s) => esc(s);
const escAttrUrl = (s) => String(s ?? '').replace(/"/g, '%22');

/* ───────────────────────── fragments ───────────────────────── */

function metaLine(meta, { year } = {}) {
  const bits = [];
  const y = year || meta.year;
  if (y) bits.push(esc(y));
  if (meta.medium) bits.push(esc(meta.medium));
  let html = bits.join(' &middot; ');
  if (meta.status) {
    html += `${bits.length ? ' &middot; ' : ''}<span class="status">${esc(meta.status)}</span>`;
  }
  return html;
}

function linksList(links) {
  if (!links || !links.length) return '';
  const items = links
    .map((l) => {
      const cls = [isExternal(l.url) && !isPdf(l.url) ? 'ext' : '', isPdf(l.url) ? 'pdf' : '']
        .filter(Boolean)
        .join(' ');
      const rel = isExternal(l.url) ? ' target="_blank" rel="noopener"' : '';
      return `<li><a class="${cls}" href="${escAttrUrl(l.url)}"${rel}>${esc(l.label || l.text)}</a></li>`;
    })
    .join('');
  return `<ul class="links">${items}</ul>`;
}

function figureHtml(m, { eager = false } = {}) {
  const dims = m.width && m.height ? ` width="${m.width}" height="${m.height}"` : '';
  const loading = eager ? 'eager' : 'lazy';
  const alt = m.alt ? escAttr(m.alt) : '';
  const cap = [m.caption, m.credit].filter(Boolean).map(esc).join(' — ');
  const capHtml = cap ? `\n  <figcaption>${cap}</figcaption>` : '';
  const cls = m.height && m.width && m.height > m.width ? ' class="portrait"' : '';
  return `<figure${cls}>
  <a href="${escAttrUrl(m.src)}" target="_blank" rel="noopener"><img src="${escAttrUrl(m.src)}" alt="${alt}" loading="${loading}" decoding="async"${dims}></a>${capHtml}
</figure>`;
}

function galleryHtml(media, { labelPrefix } = {}) {
  if (!media.length) return '';
  return media
    .map((m, i) => {
      const withAlt = m.alt
        ? m
        : { ...m, alt: labelPrefix ? `${labelPrefix} — image ${i + 1} of ${media.length}` : '' };
      return figureHtml(withAlt, { eager: i === 0 });
    })
    .join('\n');
}

function youtubeId(url) {
  const m = String(url).match(/(?:embed\/|watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{6,})/);
  return m ? m[1] : null;
}

function videoHtml(vid) {
  const isFile = /\.(mp4|webm|ogg|ogv|mov|m4v)(\?.*)?$/i.test(vid.url);
  const caption = vid.caption ? `\n  <p class="video-caption muted">${vid.caption}</p>` : '';
  if (isFile) {
    const poster = vid.poster ? ` poster="${escAttrUrl(vid.poster)}"` : '';
    return `<div class="video">
  <video controls preload="none" playsinline${poster} src="${escAttrUrl(vid.url)}"></video>${caption}
</div>`;
  }
  const id = youtubeId(vid.url);
  const embed = id ? `https://www.youtube.com/embed/${id}?autoplay=1` : vid.url;
  const watch = id ? `https://www.youtube.com/watch?v=${id}` : vid.url;
  const thumb = id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : '';
  const posterImg = thumb
    ? `<img src="${escAttrUrl(thumb)}" alt="Video thumbnail" loading="lazy" decoding="async" width="480" height="360">`
    : '';
  return `<div class="video">
  <a class="poster" href="${escAttrUrl(watch)}" target="_blank" rel="noopener" data-embed="${escAttrUrl(embed)}" data-title="Video player">${posterImg}<span class="play">Play &#9654;</span></a>
  <p class="alt-link"><a href="${escAttrUrl(watch)}" target="_blank" rel="noopener">Watch on YouTube \u2197</a></p>${caption}
</div>`;
}

/* ───────────────────────── model ───────────────────────── */

function normalize(p, index) {
  const meta = PROJECT_META[p.title] || {};
  const slug = PROJECT_SLUGS[p.title] || slugify(p.title);
  const children = Array.isArray(p.children) ? p.children : [];
  return {
    raw: p,
    index,
    slug,
    title: p.title,
    display: meta.display || p.title,
    summary: p.subtitle || '',
    meta,
    isCollection: children.length > 0,
    children,
    cover: coverFor(p, meta),
    url: `/text/projects/${slug}/`,
  };
}

const model = projects.map(normalize);
const bySlug = Object.fromEntries(model.map((m) => [m.title, m]));

function childIsPage(child) {
  return !!CHILD_SLUGS[child.title];
}
function childSlug(child) {
  return CHILD_SLUGS[child.title] || slugify(child.title);
}

/* ───────────────────────── cards / index ───────────────────────── */

function entryHtml(project, { collectionNote } = {}) {
  const cover = project.cover;
  const thumb = cover
    ? `<a class="thumb" href="${project.url}"><img src="${escAttrUrl(cover.src)}" alt="${escAttr(cover.alt)}" loading="lazy" decoding="async"></a>`
    : '';
  const meta = metaLine(project.meta);
  const note = collectionNote ? ` <span class="muted">${esc(collectionNote)}</span>` : '';
  return `<li>
  <div class="entry">
    ${thumb}
    <div class="body">
      <h2 class="title"><a href="${project.url}">${esc(project.display)}</a></h2>
      ${meta ? `<p class="meta">${meta}</p>` : ''}
      ${project.summary ? `<p class="summary">${esc(project.summary)}${note}</p>` : (note ? `<p class="summary">${note.trim()}</p>` : '')}
    </div>
  </div>
</li>`;
}

/* ───────────────────────── pages ───────────────────────── */

function buildHome() {
  const featured = HOME_ORDER.map((t) => bySlug[t]).filter(Boolean);
  const rows = featured.map((p) => entryHtml(p)).join('\n');
  const body = `
<h1>${esc(SITE.nameFull)}</h1>
<p class="lede">${esc(SITE.intro)}</p>
<p>This is a fast, text-first entrance to the portfolio. The same work is also
explorable as a <a href="/">3D computer-lab experience</a>.</p>

<h2>Selected work</h2>
<div class="controls" data-image-toggle></div>
<ul class="index">
${rows}
</ul>
<p><a href="/text/work/">All work and archive &rarr;</a> &middot;
<a href="/text/about/">About</a> &middot;
<a href="/text/contact/">Contact</a></p>
`;
  writePage('', layout({
    title: SITE.name,
    desc: SITE.intro,
    path: '/text/',
    bodyHtml: body,
    ogImage: bySlug['InFlux']?.cover?.src,
    imageToggle: true,
  }));
}

function buildWork() {
  const rows = model
    .map((p) => {
      if (p.isCollection) {
        const n = p.children.length;
        return entryHtml(p, { collectionNote: `Collection — ${n} entr${n === 1 ? 'y' : 'ies'} inside.` });
      }
      return entryHtml(p);
    })
    .join('\n');
  const body = `
<h1>Work</h1>
<p class="lede">All public art and design projects, including collections and the archive.</p>
<div class="controls" data-image-toggle></div>
<ul class="index">
${rows}
</ul>
`;
  writePage('work', layout({
    title: 'Work',
    desc: 'All public art and design projects by Wun Ting Chan, including collections and archive.',
    path: '/text/work/',
    bodyHtml: body,
    imageToggle: true,
  }));
}

function buildProjectPage(project) {
  const p = project.raw;
  const meta = project.meta;

  let body = `
<p class="breadcrumb"><a href="/text/work/">&larr; Work</a></p>
<h1>${esc(project.display)}</h1>`;
  const ml = metaLine(meta);
  if (ml) body += `\n<p class="meta muted">${ml}</p>`;
  if (project.summary) body += `\n<p class="lede">${esc(project.summary)}</p>`;

  // Collaborators explicitly present in the data (first-party anchors kept).
  // (none structured in source today; statements carry them inline.)

  if (project.isCollection) {
    // List children: those with a page link internally; link-only children link out.
    const items = project.children
      .map((child) => {
        if (childIsPage(child)) {
          const href = `/text/projects/${childSlug(child)}/`;
          return `<li><div class="entry"><div class="body"><h2 class="title"><a href="${href}">${esc(child.title)}</a></h2>${child.subtitle ? `<p class="summary">${esc(child.subtitle)}</p>` : ''}</div></div></li>`;
        }
        if (child.href) {
          const cls = isPdf(child.href) ? 'pdf' : 'ext';
          return `<li><div class="entry"><div class="body"><h2 class="title"><a class="${cls}" href="${escAttrUrl(child.href)}" target="_blank" rel="noopener">${esc(child.title)}</a></h2>${child.subtitle ? `<p class="summary">${esc(child.subtitle)}</p>` : ''}</div></div></li>`;
        }
        // Child with media but no chosen slug — still render inline images.
        return `<li><div class="entry"><div class="body"><h3 class="title">${esc(child.title)}</h3>${galleryHtml(resolveMedia(child))}</div></div></li>`;
      })
      .join('\n');
    body += `\n<ul class="index">\n${items}\n</ul>`;
  } else {
    // External links / PDFs
    if (p.links && p.links.length) body += `\n${linksList(p.links.map((l) => ({ label: l.text, url: l.url })))}`;
    if (p.directUrl) body += `\n${linksList([{ label: 'Visit the live site', url: p.directUrl }])}`;

    // Cover first (if we have one, it isn't already in the gallery, and it isn't
    // merely a video thumbnail that the video block already shows).
    const media = resolveMedia(p);
    const coverIsVideoThumb = project.cover && /img\.youtube\.com/.test(project.cover.src);
    if (project.cover && !media.some((m) => m.src === project.cover.src) && !coverIsVideoThumb) {
      body += `\n${figureHtml({ ...project.cover }, { eager: true })}`;
    }

    // Videos (click-to-load; never autoplay).
    if (Array.isArray(p.videos)) {
      for (const v of p.videos) body += `\n${videoHtml(v)}`;
    }

    // Statement / process sections.
    for (const s of p.sections || []) {
      if (s.heading) body += `\n<h2>${esc(s.heading)}</h2>`;
      if (s.text) body += `\n${richText(s.text)}`;
    }

    // Gallery.
    if (media.length) {
      body += `\n<h2>Documentation</h2>\n${galleryHtml(media, { labelPrefix: project.display })}`;
    }
  }

  writePage(`projects/${project.slug}`, layout({
    title: project.display,
    desc: project.summary || `${project.display} — work by ${SITE.name}.`,
    path: project.url,
    bodyHtml: body,
    ogImage: project.cover?.src,
    imageToggle: false,
  }));
}

function buildChildPage(parent, child) {
  const slug = childSlug(child);
  const media = resolveMedia(child);
  let body = `
<p class="breadcrumb"><a href="/text/work/">&larr; Work</a> / <a href="${parent.url}">${esc(parent.display)}</a></p>
<h1>${esc(child.title)}</h1>`;
  if (child.subtitle) body += `\n<p class="lede">${esc(child.subtitle)}</p>`;
  if (child.links && child.links.length) body += `\n${linksList(child.links.map((l) => ({ label: l.text, url: l.url })))}`;
  if (child.href) body += `\n${linksList([{ label: 'Open', url: child.href }])}`;
  for (const s of child.sections || []) {
    if (s.heading) body += `\n<h2>${esc(s.heading)}</h2>`;
    if (s.text) body += `\n${richText(s.text)}`;
  }
  if (media.length) body += `\n<h2>Documentation</h2>\n${galleryHtml(media, { labelPrefix: child.title })}`;

  const cover = media[0];
  writePage(`projects/${slug}`, layout({
    title: child.title,
    desc: child.subtitle || `${child.title} — part of ${parent.display} by ${SITE.name}.`,
    path: `/text/projects/${slug}/`,
    bodyHtml: body,
    ogImage: cover?.src,
    imageToggle: false,
  }));
}

function buildAbout() {
  const body = `
<h1>About</h1>
<p class="lede">${esc(ABOUT.shortBio)}</p>
<h2>Biography</h2>
${ABOUT.longBio.map((t) => `<p>${esc(t)}</p>`).join('\n')}
<h2>Location</h2>
<p>${esc(ABOUT.location)}</p>
<h2>Education</h2>
<ul class="links">${ABOUT.education.map((e) => `<li>${esc(e)}</li>`).join('')}</ul>
<h2>CV</h2>
<ul class="links"><li><a class="pdf" href="${escAttrUrl(SITE.cvUrl)}" target="_blank" rel="noopener">Download CV</a> <span class="muted">(updated ${esc(SITE.cvUpdated)})</span></li></ul>
`;
  writePage('about', layout({
    title: 'About',
    desc: `About ${SITE.nameFull}: artist, translator, and computer scientist from Hong Kong, based in New York.`,
    path: '/text/about/',
    bodyHtml: body,
  }));
}

function buildResearch() {
  const groups = RESEARCH.groups
    .map((g) => {
      const items = g.items
        .map((it) => {
          let h = `<h3>${esc(it.title)}</h3>`;
          if (it.plain) h += `\n<p>${esc(it.plain)}</p>`;
          if (it.status) h += `\n<p class="muted">${esc(it.status)}</p>`;
          const cross = [];
          if (it.project) cross.push(`<a href="${it.project}">Project page</a>`);
          if (it.writing) cross.push(`<a href="${it.writing}">In writings</a>`);
          if (cross.length) h += `\n<p>${cross.join(' &middot; ')}</p>`;
          h += `\n${linksList(it.links)}`;
          return h;
        })
        .join('\n<hr>\n');
      return `<h2>${esc(g.heading)}</h2>\n${items}`;
    })
    .join('\n');
  const body = `
<h1>Research</h1>
<p class="lede">${esc(RESEARCH.intro)}</p>
${groups}
`;
  writePage('research', layout({
    title: 'Research',
    desc: 'Selected research and applied work by Wun Ting Chan, with links to papers and code.',
    path: '/text/research/',
    bodyHtml: body,
  }));
}

function buildTranslations() {
  const items = TRANSLATIONS.items
    .map((it) => {
      const rows = [];
      if (it.sourceAuthor) rows.push(`Original author: ${esc(it.sourceAuthor)}`);
      if (it.sourceTitle) rows.push(`Original: ${esc(it.sourceTitle)}`);
      if (it.sourceNote) rows.push(esc(it.sourceNote));
      if (it.languages) rows.push(`Languages: ${esc(it.languages)}`);
      if (it.translator) rows.push(`Translator: ${esc(it.translator)}`);
      if (it.published) rows.push(esc(it.published));
      let h = `<h2>${esc(it.translatedTitle)}</h2>\n<p class="muted">${rows.join('<br>')}</p>`;
      if (it.project) h += `\n<p><a href="${it.project}">Project page</a></p>`;
      h += `\n${linksList(it.links)}`;
      return h;
    })
    .join('\n<hr>\n');
  const body = `
<h1>Translations</h1>
<p class="lede">${esc(TRANSLATIONS.intro)}</p>
${items}
`;
  writePage('translations', layout({
    title: 'Translations',
    desc: 'Translation credits by Wun Ting Chan, with source authors, languages, dates, and reading links.',
    path: '/text/translations/',
    bodyHtml: body,
  }));
}

function buildActing() {
  // No publicly approved acting credit is available; keep a concise inquiry
  // route only. Unapproved production details are intentionally excluded.
  const body = `
<h1>Acting</h1>
<p class="lede">For acting inquiries, please get in touch.</p>
<p><a href="/text/contact/">Contact &rarr;</a></p>
`;
  writePage('acting', layout({
    title: 'Acting',
    desc: 'Acting inquiries for Wun Ting Chan.',
    path: '/text/acting/',
    bodyHtml: body,
  }));
}

function buildPress() {
  const selected = PRESS.selected.map((t) => bySlug[t]).filter(Boolean);
  const selHtml = selected
    .map((p) => {
      const cover = p.cover
        ? `${figureHtml({ ...p.cover }, { eager: false })}`
        : '';
      const meta = metaLine(p.meta);
      return `<h3>${esc(p.display)}</h3>${meta ? `<p class="meta muted">${meta}</p>` : ''}${p.summary ? `<p>${esc(p.summary)}</p>` : ''}${cover}<p><a href="${p.url}">Project page</a></p>`;
    })
    .join('\n<hr>\n');

  const body = `
<h1>Press</h1>
<p class="lede">${esc(PRESS.intro)}</p>

<h2>Short bio</h2>
<div class="copyblock"><p>${esc(ABOUT.shortBio)}</p></div>

<h2>CV</h2>
<ul class="links"><li><a class="pdf" href="${escAttrUrl(SITE.cvUrl)}" target="_blank" rel="noopener">Download CV</a> <span class="muted">(updated ${esc(SITE.cvUpdated)})</span></li></ul>

<h2>Selected projects</h2>
${selHtml}

<h2>Interview topics</h2>
<ul class="links">${PRESS.interviewTopics.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
`;
  writePage('press', layout({
    title: 'Press',
    desc: 'Press materials for Wun Ting Chan: bios, CV, selected projects, and interview topics.',
    path: '/text/press/',
    bodyHtml: body,
    ogImage: selected[0]?.cover?.src,
  }));
}

function buildContact() {
  const profiles = CONTACT.profiles
    .map((p) => `<li><a class="ext" href="${escAttrUrl(p.url)}" target="_blank" rel="noopener">${esc(p.label)}</a></li>`)
    .join('');
  const body = `
<h1>Contact</h1>
<p class="lede">${esc(CONTACT.intro)}</p>
<h2>Profiles</h2>
<ul class="links">${profiles}</ul>
<h2>CV</h2>
<ul class="links"><li><a class="pdf" href="${escAttrUrl(SITE.cvUrl)}" target="_blank" rel="noopener">Download CV</a></li></ul>
`;
  writePage('contact', layout({
    title: 'Contact',
    desc: 'Contact and verified profiles for Wun Ting Chan.',
    path: '/text/contact/',
    bodyHtml: body,
  }));
}

/* ───────────────────────── sitemap / robots / assets ───────────────────────── */

function collectRoutes() {
  const routes = new Set([
    '/text/', '/text/work/', '/text/about/', '/text/research/',
    '/text/translations/', '/text/acting/', '/text/press/', '/text/contact/',
  ]);
  for (const p of model) {
    routes.add(p.url);
    for (const c of p.children) if (childIsPage(c)) routes.add(`/text/projects/${childSlug(c)}/`);
  }
  return [...routes];
}

function buildSitemap() {
  const urls = ['/', ...collectRoutes()];
  const body = urls
    .map((u) => `  <url><loc>${SITE.origin}${u}</loc></url>`)
    .join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>
`;
  writeFileSync(join(ROOT, 'sitemap.xml'), xml, 'utf8');
}

function buildRobots() {
  const txt = `User-agent: *
Allow: /

Sitemap: ${SITE.origin}/sitemap.xml
`;
  writeFileSync(join(ROOT, 'robots.txt'), txt, 'utf8');
}

function copyAssets() {
  mkdirSync(OUT, { recursive: true });
  copyFileSync(join(__dirname, 'assets', 'text.css'), join(OUT, 'text.css'));
  copyFileSync(join(__dirname, 'assets', 'text.js'), join(OUT, 'text.js'));
}

/* ───────────────────────── optional media HEAD check ───────────────────────── */

function headOk(url) {
  return new Promise((res) => {
    try {
      const req = https.request(url, { method: 'HEAD', timeout: 8000 }, (r) => {
        res(r.statusCode >= 200 && r.statusCode < 400);
        r.resume();
      });
      req.on('timeout', () => { req.destroy(); res(false); });
      req.on('error', () => res(false));
      req.end();
    } catch { res(false); }
  });
}

async function checkMedia() {
  const urls = new Set();
  for (const p of model) {
    if (p.cover) urls.add(p.cover.src);
    for (const m of resolveMedia(p.raw)) urls.add(m.src);
    for (const c of p.children) for (const m of resolveMedia(c)) urls.add(m.src);
  }
  const list = [...urls];
  const CONC = 8;
  let i = 0;
  async function worker() {
    while (i < list.length) {
      const u = list[i++];
      const ok = await headOk(u);
      if (!ok) missingMedia.push(u);
    }
  }
  await Promise.all(Array.from({ length: CONC }, worker));
}

/* ───────────────────────── run ───────────────────────── */

async function main() {
  copyAssets();
  buildHome();
  buildWork();
  for (const p of model) {
    buildProjectPage(p);
    for (const c of p.children) if (childIsPage(c)) buildChildPage(p, c);
  }
  buildAbout();
  buildResearch();
  buildTranslations();
  buildActing();
  buildPress();
  buildContact();
  buildSitemap();
  buildRobots();

  if (process.env.CHECK_MEDIA) await checkMedia();

  const routes = collectRoutes();
  console.log(`\n✓ Generated ${routes.length} text routes under /text/`);
  routes.forEach((r) => console.log('   ' + r));
  if (warnings.length) {
    console.log('\n⚠ Build warnings:');
    warnings.forEach((w) => console.log('   - ' + w));
  }
  if (process.env.CHECK_MEDIA) {
    console.log(`\nMedia check: ${missingMedia.length} missing of resolved set.`);
    missingMedia.forEach((m) => console.log('   MISSING ' + m));
  }
  console.log('\nMissing owner inputs (handoff — not rendered publicly):');
  MISSING.forEach((m) => console.log('   - ' + m));
}

main().catch((e) => { console.error(e); process.exit(1); });
