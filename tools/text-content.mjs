// Shared authoring content for the text-first site (ting.directory/text/).
//
// PROJECT records come from ../js/projectData.js so the 3D site and the text
// site stay in sync. This module only holds (a) small per-project overrides that
// the 3D data does not carry (stable slug, year, medium, status, chosen cover)
// and (b) the hand-written copy for the non-project pages (about, research,
// translations, press, contact), using only publicly verifiable facts.
//
// Anything that is not yet publicly confirmed is intentionally OMITTED from the
// generated HTML and listed in MISSING (surfaced to the maintainer only, never
// rendered on a public page).

export const SITE = {
  origin: 'https://ting.directory',
  base: '/text/',
  name: 'Wun Ting Chan',
  nameFull: 'Wun Ting Chan (Ting)',
  // Provisional intro — Ting to confirm final wording (see MISSING).
  intro:
    'Wun Ting Chan (Ting) is an artist, translator, and computer scientist from Hong Kong, based in New York.',
  r2: 'https://pub-c13cdb673b934fa282c9bb3c6f22046e.r2.dev/',
  cvUrl:
    'https://pub-c13cdb673b934fa282c9bb3c6f22046e.r2.dev/projects/CV/ting-CV-all.pdf',
  cvUpdated: 'April 2026', // from the file's commit date; confirm with Ting.
  github: 'https://github.com/wunting-chan',
};

// Primary visible navigation (order per spec).
export const NAV = [
  { label: 'Home', href: '/text/' },
  { label: 'Work', href: '/text/work/' },
  { label: 'Research', href: '/text/research/' },
  { label: 'Translations', href: '/text/translations/' },
  { label: 'Acting', href: '/text/acting/' },
  { label: 'About', href: '/text/about/' },
  { label: 'Press', href: '/text/press/' },
  { label: 'Contact', href: '/text/contact/' },
];

// Stable slug for each top-level project, keyed by its title in projectData.js.
export const PROJECT_SLUGS = {
  'writings': 'writings',
  'past shows': 'past-shows',
  'Evading Online Keyword Censorship': 'evading-online-keyword-censorship',
  'humanjuices': 'humanjuices',
  'eliza': 'eliza',
  'Temporary Autonomous Zone Traditional Chinese Translation': 'taz',
  'Sculpture Work': 'sculpture-work',
  'InFlux': 'influx',
};

// Stable slug for individual child entries that get their own page, keyed by
// child title. Children not listed here that are plain external links render as
// a link on their collection page instead of a standalone page.
export const CHILD_SLUGS = {
  'Island Air Vol V: Wilderness': 'island-air-vol-v',
  'Island Air Vol IV': 'island-air-vol-iv',
  'The Space that Remains': 'the-space-that-remains',
  'ICU everywhere': 'icu-everywhere',
  'parallel.': 'parallel',
};

// Light, evidence-based metadata the 3D data does not carry. Only fields that
// are directly supported by the existing statements/links are filled in; the
// rest are left undefined on purpose rather than guessed.
export const PROJECT_META = {
  'writings': {
    kind: 'collection',
    medium: 'Writing & essays',
    display: 'Writings',
  },
  'past shows': {
    kind: 'collection',
    medium: 'Group exhibitions',
    display: 'Past shows',
  },
  'Evading Online Keyword Censorship': {
    medium: 'Research · software · steganography',
    status: 'completed',
    display: 'Evading Online Keyword Censorship (PixelStacks)',
    // The data's screenImage (keyword-censorship/images/00.png) 404s on R2, so
    // use the demo video's YouTube thumbnail as the cover instead.
    coverUrl: 'https://img.youtube.com/vi/InVZqq3yDvM/hqdefault.jpg',
    coverAlt: 'Still from the PixelStacks demo video showing the steganography web tool.',
  },
  'humanjuices': {
    medium: 'Web design',
    status: 'completed',
    coverAlt: 'humanjuices.com homepage for designer Giannina Gomez.',
  },
  'eliza': {
    medium: 'Web-based art',
    status: 'ongoing',
    coverAlt: 'eliza — maze-like web project interface (work in progress).',
  },
  'Temporary Autonomous Zone Traditional Chinese Translation': {
    medium: 'Translation · book · civic action',
    year: '2020',
    status: 'completed',
    display: 'Temporary Autonomous Zone — Traditional Chinese Translation',
    coverAlt: 'TAZ Traditional Chinese edition cover/spread.',
  },
  'Sculpture Work': {
    medium: 'Sculpture',
    year: '2019–2022',
    status: 'completed',
    coverAlt: 'Polycephalic creature sculpture.',
  },
  'InFlux': {
    medium: 'Performance · video · machine learning',
    status: 'completed',
    coverAlt: 'InFlux performance still (video frame).',
    // No still image in the shared data; use the work's own video thumbnail.
    coverUrl: 'https://img.youtube.com/vi/tt6TRfiM3Jg/hqdefault.jpg',
  },
};

// Which top-level projects appear, and in what order, on the Home index.
// Existing data order is used as-is (not labeled editorially selected) until
// Ting chooses featured projects. Collections are surfaced on Work.
export const HOME_ORDER = [
  'InFlux',
  'Evading Online Keyword Censorship',
  'Temporary Autonomous Zone Traditional Chinese Translation',
  'eliza',
  'humanjuices',
  'Sculpture Work',
];

// ─────────────────────────────────────────────────────────────────────────
// Non-project page copy — publicly verifiable facts only.
// ─────────────────────────────────────────────────────────────────────────

export const ABOUT = {
  shortBio: SITE.intro,
  longBio: [
    'Wun Ting Chan (Ting) is an artist, translator, and computer scientist from Hong Kong, based in New York. Ting’s work moves across translation, performance, web-based art, sculpture, and computing research.',
    'Ting is currently completing an MS in Computer Science at New York University’s Courant Institute of Mathematical Sciences.',
  ],
  location: 'New York, United States',
  education: [
    'MS, Computer Science — New York University, Courant Institute of Mathematical Sciences (current).',
  ],
};

// Research items that are backed by existing public links. Items in the spec
// without an authoritative public citation are omitted and listed in MISSING.
export const RESEARCH = {
  intro:
    'Selected research and applied work. Interdisciplinary items are cross-listed with their project, translation, or writing pages rather than duplicated.',
  groups: [
    {
      heading: 'Software & applied research',
      items: [
        {
          title:
            'PixelStacks: High-capacity image steganography for censorship circumvention of long-form content',
          plain:
            'Can hidden-text-in-images carry banned or sensitive long-form writing past automated keyword filtering while keeping image quality high?',
          status: 'Research document and open-source tool (public).',
          project: '/text/projects/evading-online-keyword-censorship/',
          links: [
            {
              label: 'Research document (PDF)',
              url:
                'https://pub-c13cdb673b934fa282c9bb3c6f22046e.r2.dev/projects/pixel-ninja/pdf/PixelStacks__High_Capacity_Image_Steganography_for_Censorship_Circumvention_of_Long_Form_Content.pdf',
              pdf: true,
            },
            { label: 'Web tool', url: 'https://main.d3v90zo52exf1d.amplifyapp.com/' },
            { label: 'Source code (GitHub)', url: 'https://github.com/wunting-chan/Chaos_LSB' },
          ],
        },
      ],
    },
    {
      heading: 'Essays',
      items: [
        {
          title:
            'Between Flesh and Code: Free Translation from Biology to Computer Algorithm',
          plain:
            'An essay reading across biology and computation as a problem of translation.',
          writing: '/text/projects/writings/',
          links: [
            {
              label: 'Read (PDF)',
              url:
                'https://pub-c13cdb673b934fa282c9bb3c6f22046e.r2.dev/projects/writings/pdf/WunTingChan-TTT-2025-IU-pf-03629-91428-en.pdf',
              pdf: true,
            },
          ],
        },
      ],
    },
  ],
};

export const TRANSLATIONS = {
  intro: 'Translation credits with sources, languages, dates, and reading links.',
  items: [
    {
      translatedTitle:
        'Temporary Autonomous Zone — Traditional Chinese translation',
      sourceAuthor: 'Hakim Bey (Peter Lamborn Wilson)',
      sourceTitle: 'T.A.Z.: The Temporary Autonomous Zone',
      languages: 'English → Traditional Chinese',
      translator: 'Wun Ting Chan (translation, book design, project organization)',
      published: '2020 — 5,000 free copies distributed in Hong Kong with 40+ volunteers',
      project: '/text/projects/taz/',
      links: [
        {
          label: 'Read TAZ in Traditional Chinese (PDF)',
          url:
            'https://pub-c13cdb673b934fa282c9bb3c6f22046e.r2.dev/projects/taz/pdf/TAZ_zh.pdf',
          pdf: true,
        },
        {
          label: 'Translation process notes',
          url:
            'https://docs.google.com/document/d/1F7h-lngSmDhhjcMpVPkd9AAi8zhH9ubmwZjliRNsQNU/edit?usp=sharing',
        },
      ],
    },
    {
      translatedTitle:
        'Human Germline Gene Editing is Bioart: An Open Letter to Lulu and Nana — Simplified Chinese translation',
      sourceNote:
        'Original open letter as published by Hackteria. The original essay’s positions remain attributed to its author.',
      languages: '→ Simplified Chinese',
      translator: 'Wun Ting Chan (Simplified Chinese translation)',
      published: 'Online release January 2026 — hosted by Hackteria',
      links: [
        {
          label: 'Read on Hackteria',
          url:
            'https://www.hackteria.org/projects/news/open-letter-to-lulu-and-nana/',
        },
      ],
    },
  ],
};

export const PRESS = {
  intro:
    'Press materials. Bios may be selected and copied directly. Please credit photographers where noted.',
  interviewTopics: [
    'Cantonese dialogue choices in translation and performance',
    'Translation decisions across English, Traditional, and Simplified Chinese',
    'Body-to-image performance and the limits of digital augmentation',
    'Video adaptation and uncertainty in machine-learning systems',
  ],
  // Three projects for press use (cover + short description + date + role).
  selected: ['InFlux', 'Evading Online Keyword Censorship', 'Temporary Autonomous Zone Traditional Chinese Translation'],
};

export const CONTACT = {
  intro: 'Public contact and verified profiles.',
  profiles: [{ label: 'GitHub', url: 'https://github.com/wunting-chan' }],
};

// Items that are specified but not yet publicly confirmed. Surfaced to the
// maintainer in the build log and handoff only — never rendered publicly.
export const MISSING = [
  'Final short (60-word) and 150-word biographies, and approved intro wording.',
  'Chosen public contact email (no address found in repo) — blocks Contact/Press email and mailto.',
  'Approved personal pronouns, and any Chinese name / Chinese bios if desired.',
  'Acting: approved Superfakes credit wording, character spelling, platform, date, stills/clip access, role description (none published here).',
  'Portraits (headshot + editorial + working) with photographer and usage credits.',
  'Research citations/authorship/venues for: personalized immersive design paper (online Oct 2025, April 2026 issue), Gaussian-process histopathology paper, video test-time adaptation work, 3D captioning experiments, AdaSteer (status). These were omitted to avoid fabricated citations.',
  'Original author name(s) for the Lulu & Nana open letter (credit the source author, not the translator).',
  'Confirm prior education/experience (e.g., undergraduate institution) for About/Press.',
  'Confirm current exhibition/completion status for art projects; confirm years where unset.',
  'Photographer/crop/collaboration credits for project covers and gallery images.',
  'CV: confirm "updated" date and fix the institution-name error noted in the CV file (use NYU Courant Institute of Mathematical Sciences).',
  'Decide whether the existing "conjuring-failures-war-machines" / "copy-of-what-you-lose-to-us" project (images present on R2 but absent from js/projectData.js) should be added to the shared data; omitted here to avoid inventing its title/statement.',
];
