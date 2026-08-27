/* 📱 Lay the real page out in a real phone, and measure it.
   ---------------------------------------------------------------------
   THE WAY THIS APP BREAKS ON A PHONE IS NOT A BROKEN ROW, IT IS A BROKEN
   APP. When one row is wider than the screen, iOS lays the whole document
   out at that row's width and shrinks the lot to fit: every word on every
   card goes small, the header title clips mid-word, the last button on the
   row is cut in half, and the page scrolls sideways. Nothing throws, nothing
   is logged, and on a desktop browser it all looks perfect — which is why it
   shipped that way.

   So this takes the REAL markup and the REAL stylesheet out of index.html,
   puts a real answer card on the page (built by the real `answerCardHtml`,
   cut out of the file the same way tools/scan-tests.mjs cuts its sections),
   and measures the page across seven viewports — three phones, the first
   pixel above the phone breakpoint, a phone in landscape, an iPad in portrait
   and a desktop regression row:

     • the document is never wider than the screen        ← the shrink-to-fit
     • …and nor is any WINDOW, opened one at a time
     • nothing pressed is under 44px, in any window       ← Apple's own floor
     • the header title is not clipped                    ← "Scan & A…er"
     • the version badge is on the screen                 ← the deploy check
     • the dock does not sit on the last answer

   AND EVERY ONE OF THEM IS MUTATION-TESTED (`--selftest`): two of the first
   five could not fail at all, and they were the two the documentation led
   with. A check that cannot fail is not a check.

   No network: every <script> is stripped and the logo is swapped for the
   inline SVG the header already falls back to, so this runs offline and the
   same way every time.

     npm i playwright-core && node tools/mobile-check.mjs [outDir]

   It writes a screenshot per viewport to look at, because a page that
   measures clean is not the same as one that reads well.
*/
import fs from 'fs';
import path from 'path';

const OUT = process.argv.slice(2).filter((a) => !a.startsWith('--'))[0] || '/tmp/mobile-check';
/* A CHECK TOOL DOES NOT WRITE INTO THE TREE IT CHECKS. Before the argument
   parsing above learned to skip flags, `--selftest` was read as the output
   directory — so a run created a folder literally called `--selftest` holding
   two near-copies of index.html, and they were committed. Stale duplicates of
   the app rot silently, and the folder's name breaks every shell tool that
   takes options. Parsing is one guard; this is the one that cannot be argued
   with. */
const REPO = path.resolve(new URL('..', import.meta.url).pathname);
if (!path.relative(REPO, path.resolve(OUT)).startsWith('..')) {
  console.error('refusing to write inside the repository: ' + path.resolve(OUT) +
                '\nthis tool writes copies of index.html — give it a path outside ' + REPO);
  process.exit(2);
}
const CHROME = process.env.CHROME_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

let chromium;
try { ({ chromium } = await import('playwright-core')); }
catch { console.error('needs playwright-core:  npm i playwright-core'); process.exit(2); }

const src = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
function cut(a, b) {
  const i = src.indexOf(a), j = src.indexOf(b, i);
  if (i < 0 || j < 0) throw new Error('section not found: ' + a.slice(0, 50));
  return src.slice(i, j);
}

/* ---- the real card renderer, run in node over a realistic paper ---- */
const prelude = `
var currentUser = { uid:'a', email:'chungzhikai@gmail.com' };
var LEVELS=['P3','P4','P5','P6','S1'];
var SUBJECTS=[{value:'science',label:'Science'},{value:'math',label:'Mathematics'},{value:'english',label:'English'},{value:'chinese',label:'Chinese'}];
var SUBJECT_OK={};SUBJECTS.forEach(function(x){SUBJECT_OK[x.value]=1;});
function isAdmin(u){return !!u && u.email==='chungzhikai@gmail.com';}
function subjectLabel(s){if(s==='both')return 'Maths & Science';var h=SUBJECTS.filter(function(x){return x.value===s;})[0];return h?h.label:'';}
function levelLabel(l){return l==='S1'?'Sec 1':(l||'');}
function escHtml(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function $(){return null;}
function toast(){}
function renderReport(){} function renderStepAllBtn(){} function renderVetAllBtn(){}
function renderGroundingLine(){} function renderEngineLine(){} function renderAskedLine(){} function renderTally(){}
function reportAsText(){return '';}
/* The real chip's own markup — it is a BUTTON, and it was 19px tall. */
function mbCardChipHtml(){return '<button class="mbBookChip" onclick="void 0">📕 Keep this mistake</button>';}
var _mistakes = [], _mbSel = {}, _mbTab = 'mistake';
var MB_LIST_MISTAKE = 'mistake', MB_LIST_LEARNING = 'learning', MB_CLEAR_WINS = 2;
function mbListOf(m){return m && m.list === MB_LIST_LEARNING ? MB_LIST_LEARNING : MB_LIST_MISTAKE;}
function mbIsLearning(m){return mbListOf(m) === MB_LIST_LEARNING;}
function mbInList(k){return _mistakes.filter(function(m){return mbListOf(m) === k;});}
function mbAskRoute(){return 'share';}   // a phone that CAN share a file: 📎 is drawn
var _askBusy = false;
function levelLabel2(){return '';}
var document={getElementById:function(){return null;},createElement:function(){return {getContext:function(){return {};}};}};
var window={}; var localStorage={getItem:function(){return null;},setItem:function(){}};
var location={href:'x',hostname:'y'}; var navigator={}; var storage=null;
var db={collection:function(){return {doc:function(){return {collection:function(){return {doc:function(){return {get:function(){return Promise.resolve({exists:false});}};},get:function(){return Promise.resolve({forEach:function(){}});}};},get:function(){return Promise.resolve({exists:false});}};}};}};
`;
/* `itemSubjectWhy` is cut out of the file like everything else rather than
   written again here: a second reading of the subject is the one thing
   CLAUDE.md says never to add, and a harness is not an exemption. */
const api = new Function(prelude +
  cut('/* ---- WHICH LIST A QUESTION BELONGS IN ----', '/* Split a run into one batch per destination list') +
  /* THE MISTAKE BOOK'S OWN ROWS. Opening that window with an empty body
     measured its ✕ and its foot and NOTHING a student touches — no row, no
     tick box, no 📕/📗 tab, no 💬 Ask, no 📎 — which is exactly where the
     controls under the floor were. `mbRowHtml` and `mbTabsHtml` are cut out
     of the file like everything else so the window is measured with something
     in it. */
  cut('function mbRowHtml(m) {', '/* Switching tabs CLEARS the ticks.') +
  cut('/* ================= Tolerant JSON parse', '/* ================= Teaching notes & AI style training') +
  cut('/* ================= Teaching notes & AI style training', '/* ================= Uploading notes') +
  cut('/* =====================================================================\n   THE SCAN', '/* ---- Showing the answers ----') +
  cut('/* ---- Showing the answers ----', '/* =====================================================================\n   📋 THE REPORT') +
  `\n  var _vetCardFootHtml = function () { return '<div class="ansSend noPrint"><button class="btn btnScan">📥 Send to Maths vetting</button></div>'; };
  return { answerCardHtml: answerCardHtml, mbRowHtml: mbRowHtml, mbTabsHtml: mbTabsHtml,
           setAnswers: function (v) { _answers = v; }, setMeta: function (v) { wsMeta = v; },
           setBook: function (v) { _mistakes = v; } };`
)();
api.setMeta({ level: 'P5', subject: '' });

const paper = [
  { kind: 'page', subject: 'math', number: '16(a)', page: 1, endPage: 1, type: 'open',
    question: 'The figures below are made up of identical squares. Study the pattern and answer the questions that follow. How many squares are there in Figure 5?',
    options: [], option: '', answer: '31 squares',
    explanation: 'Each figure adds one more row than the one before it, so the totals go up by 3, 5, 7 and 9.',
    steps: [
      { do: 'Figure 1 has 1 square, Figure 2 has 4, Figure 3 has 9.', why: 'Count the squares in each figure printed on the page.' },
      { do: 'Figure 5 has 5 × 5 = 25 squares, plus the 6 shaded ones = 31 squares.', why: 'The pattern is a square of side equal to the figure number.' }
    ],
    stepsShown: 0, marked: false, studentAnswer: '', verdict: '', marks: '', feedback: '' },
  { kind: 'page', subject: 'math', number: '16(b)', page: 1, endPage: 1, type: 'open',
    question: 'Find the number in the 20th and 21st figures of the pattern.',
    options: [], option: '', answer: '400 and 441',
    explanation: 'Square the figure number each time.',
    steps: [{ do: '20 × 20 = 400', why: 'Square the figure number.' },
            { do: '21 × 21 = 441', why: 'And again for the next one.' }],
    stepsShown: 2, marked: true, studentAnswer: '400 and 440', verdict: 'partial', marks: '1/2',
    feedback: 'The first is right. Check the second multiplication — 21 × 21 is not 440.' },
  { kind: 'page', subject: 'science', number: '17', page: 2, endPage: 2, type: 'mcq',
    question: 'Which of the following best explains why the puddle dried up on a hot day?',
    options: [{ label: '1', text: 'The water was absorbed by the ground.' },
              { label: '2', text: 'The water evaporated into water vapour.' },
              { label: '3', text: 'The water condensed on the road.' },
              { label: '4', text: 'The water froze and disappeared.' }],
    option: '2', answer: '(2) The water evaporated into water vapour.',
    explanation: 'Heat from the sun gives the water enough energy to evaporate.',
    steps: [], stepsShown: 0, marked: true, studentAnswer: '(1)', verdict: 'wrong', marks: '0/1',
    feedback: 'Absorption is not what dries a puddle on a hot day — name the process.' }
];
api.setAnswers(paper);
const cards = paper.map(function (it, i) { return api.answerCardHtml(it, i); }).join('');

/* The 📕 window with something in it. Every control the round-one floor
   missed lives on one of these rows — the tick box, the 📕/📗 tabs, 💬 Ask
   Mr Chung and its 📎 — and an empty body measured none of them. */
const BOOK = [
  { id: 'm1', list: 'mistake', streak: 1, at: '2026-08-20', subject: 'math', level: 'P5',
    number: '16(b)', question: 'Find the number in the 20th and 21st figures of the pattern.',
    studentAnswer: '400 and 440', answer: '400 and 441', img: '' },
  { id: 'm2', list: 'mistake', streak: 0, at: '2026-08-21', subject: 'science', level: 'P5',
    number: '17', question: 'Which of the following best explains why the puddle dried up on a hot day?',
    studentAnswer: '(1)', answer: '(2) The water evaporated into water vapour.', img: '' }
];
api.setBook(BOOK);
const bookBody = api.mbTabsHtml() +
  '<div class="mbList">' + BOOK.map(api.mbRowHtml).join('') + '</div>';

/* ---- the real page, with nothing that needs the network ---- */
const SVG_LOGO = "data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2240%22 height=%2240%22 viewBox=%220 0 40 40%22%3E%3Crect width=%2240%22 height=%2240%22 rx=%228%22 fill=%22%234a7c59%22/%3E%3Ctext x=%2220%22 y=%2229%22 font-size=%2224%22 font-weight=%22700%22 fill=%22white%22 text-anchor=%22middle%22%3EP%3C/text%3E%3C/svg%3E";
let page = src
  .replace(/<script[\s\S]*?<\/script>/g, '')
  .replace(/https:\/\/dl\.dropboxusercontent\.com[^"']*/g, SVG_LOGO)
  .replace(/<link rel="(?:preconnect|icon|apple-touch-icon|stylesheet)"[^>]*>/g, '')
  // signed in, on the Snap tab, with a paper already read
  .replace(/id="(stuBtn|mbBtn|quickNoteBtn|notesBtn|signOutBtn)"([^>]*) style="display:none"/g, 'id="$1"$2')
  .replace('id="signInBtn"', 'id="signInBtn" style="display:none"')
  .replace('<nav class="tabs hidden"', '<nav class="tabs"')
  .replace('<section class="card" id="signedOutCard">', '<section class="card hidden" id="signedOutCard">')
  .replace('<section id="scanPage" class="hidden snapDrop">', '<section id="scanPage" class="snapDrop">')
  .replace('<div id="answersWrap" class="hidden"', '<div id="answersWrap"')
  .replace('<button class="btn btnScan hidden" id="vetAllBtn"', '<button class="btn btnScan" id="vetAllBtn"')
  .replace('<button class="btn hidden" id="stepAllBtn"', '<button class="btn" id="stepAllBtn"')
  .replace('<div id="answersList"></div>', '<div id="answersList">' + cards + '</div>')
  .replace('<div class="modalBody" id="mbBody"></div>',
           '<div class="modalBody" id="mbBody">' + bookBody + '</div>')
  // the dock is what the Snap tab is laid out around, so it has to be up
  .replace('<div class="camDock hidden" id="camDock">', '<div class="camDock" id="camDock">')
  .replace('<span class="mbCount hidden" id="mbBadge">0</span>', '<span class="mbCount" id="mbBadge">22</span>')
  /* SIGNED IN AS SOMEBODY. Left empty, the header measures 136px narrower
     than it ever is in front of a teacher — which is most of the reason the
     tablet overflow went unseen. */
  .replace('<span id="whoAmI" class="hint"></span>',
           '<span id="whoAmI" class="hint">chungzhikai@gmail.com</span>')
  .replace('<span id="versionTag"></span>', '<span id="versionTag">v' + (src.match(/APP_VERSION = '([^']+)'/) || [, '?'])[1].replace(/^v/, '') + '</span>');
page = page.replace('<h2 id="answersTitle" style="margin:0">The answers</h2>',
                    '<h2 id="answersTitle" style="margin:0">Marked &amp; answered (3)</h2>');

fs.mkdirSync(OUT, { recursive: true });
const file = path.join(OUT, 'page.html');
fs.writeFileSync(file, page);

/* EVERY ONE OF THESE IS A WIDTH SOMEBODY HOLDS, AND THEY MUST NOT ALL SIT ON
   ONE SIDE OF A BREAKPOINT. The first pass tested 393, 375 and 320 — all three
   below the 620px media query, so the tool only ever exercised the code that
   had just been rewritten. It printed "every viewport is clean" while the
   header was 771px wide on an iPad in portrait and Sign out was off the edge.
   So the list straddles the breakpoint on purpose: 621 is the first pixel the
   phone rules do NOT apply to, and a phone in landscape is 852. */
const VIEWPORTS = [
  { name: 'iphone-15-pro',   width: 393, height: 852 },
  { name: 'iphone-se',       width: 375, height: 667 },
  { name: 'galaxy-fold',     width: 320, height: 800 },
  { name: 'breakpoint-edge', width: 621, height: 800 },
  { name: 'iphone-landscape', width: 852, height: 393 },
  { name: 'ipad-portrait',   width: 768, height: 1024 },
  { name: 'desktop',         width: 1280, height: 900, desktop: true }
];
const TAP_MIN = 44;
const browser = await chromium.launch({ executablePath: CHROME });
let fails = 0;
let results = [];
function ok(name, cond, extra) {
  results.push({ name, pass: !!cond, extra: extra || '' });
}

/* One viewport, measured. Everything above is setup; this is the whole check,
   pulled out as a function so the self-test below can run it over a page that
   has been broken ON PURPOSE. */
async function measure(url, vp) {
  results = [];
  /* The desktop row is a REGRESSION guard, so it is emulated as a desktop:
     a fine pointer, no touch, no shrink-to-fit. Everything else is a finger. */
  const ctx = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: vp.desktop ? 1 : 2,
    isMobile: !vp.desktop, hasTouch: !vp.desktop
  });
  const p = await ctx.newPage();
  await p.goto(url, { waitUntil: 'load' });
  await p.waitForTimeout(120);

  /* ① THE ONE THAT MATTERS — AND IT WAS MEASURED AGAINST THE WRONG NUMBER.
     Under `isMobile` Chromium emulates the very shrink-to-fit this check
     exists to catch, so `window.innerWidth` GROWS to the overflowed layout
     width and `scrollWidth <= innerWidth` is true no matter how broken the
     page is. Run against the file before the fix it reported all three
     viewports clean while the document was 585px in a 393px screen.

     The screen is the number we asked for. Compare against that. */
  const w = await p.evaluate(() => ({
    doc: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
    client: document.documentElement.clientWidth,
    inner: window.innerWidth
  }));
  ok('the page is no wider than the screen', w.doc <= vp.width + 1,
     'document is ' + w.doc + 'px in a ' + vp.width + 'px screen' +
     (w.inner !== vp.width ? '  (innerWidth reads ' + w.inner + ' — that is the shrink-to-fit)' : ''));

  /* …and WHICH element is doing it, because "something overflows" is not a
     thing anybody can go and fix. */
  const wide = await p.evaluate((limit) => {
    const out = [];
    document.querySelectorAll('body *').forEach((el) => {
      /* NOT `offsetParent`, which is null for every position:fixed box — that
         quietly exempted the camera dock, the whole camera overlay and the
         toast, which is to say the app's primary one-handed control surface,
         from the one check this tool exists for. */
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden') return;
      const r = el.getBoundingClientRect();
      if (r.width === 0) return;
      if (r.right > limit + 1 || r.left < -1) {
        out.push((el.id ? '#' + el.id : el.tagName.toLowerCase()) +
                 (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).join('.') : '') +
                 ' [' + Math.round(r.left) + '→' + Math.round(r.right) + ']');
      }
    });
    return out.slice(0, 6);
  }, vp.width);
  ok('nothing hangs off either edge', wide.length === 0, wide.join(' | '));

  /* ② Everything pressed is thumb-sized — EVERY control, in every window.
     The first pass asked only for `button` on the Snap tab and only about
     HEIGHT, so it missed the three Settings pickers (41px), the mistake
     book's own tick box (19×19), ✎ Edit's "remember this" (17×17), 💬 Ask
     Mr Chung (30px) and the camera overlay's Cancel and Done — every one of
     them a real control, most of them in the two windows a student uses most.
     A floor with a list of exceptions is not a floor, so the modals are
     opened and measured too. */
  /* `camLive` is the camera overlay — the app's primary one-handed control
     surface — and it is NOT a `.modalBack`, so listing only the modals left it
     out of every measurement. */
  const MODALS = vp.desktop ? [] : ['mbModal', 'notesModal', 'quickNoteModal', 'ansEditModal',
                  'noteEditModal', 'stuModal', 'vetModal', 'camLive'];
  /* The floor is about FINGERS: on a fine pointer there is nothing to check. */
  const states = vp.desktop ? [] : [{ name: '', open: '' }].concat(MODALS.map((m) => ({ name: m, open: m })));
  const small = [], wideWin = [];
  for (const st of states) {
    const found = await p.evaluate((arg) => {
      const [min, openId] = arg;
      document.querySelectorAll('.modalBack, .camLive').forEach((m) => m.classList.remove('open'));
      if (openId) document.getElementById(openId).classList.add('open');
      const out = [];
      const sel = 'button, [role="button"], .tab, select, summary, a[href], ' +
                  'input[type="checkbox"], input[type="radio"], input[type="file"]';
      document.querySelectorAll(sel).forEach((el) => {
        const cs = getComputedStyle(el);
        if (cs.display === 'none' || cs.visibility === 'hidden' || el.hidden) return;
        /* The page strip's ◀ ▶ ✕ are the one deliberate exception: they live
           inside a 116px thumbnail, and a 44px bar under a 96px picture is a
           control bar bigger than the thing it controls. */
        if (el.closest('.shotBar')) return;
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) return;
        /* A tick box wrapped in a label is pressed by the label. */
        /* A tick box is pressed by whatever label is bound to it — the one
           wrapped round it, or the one pointing at it with `for`. Both are
           the same press to a finger. */
        let box = r;
        if (el.type === 'checkbox' || el.type === 'radio') {
          const lab = el.closest('label') ||
            (el.id ? document.querySelector('label[for="' + el.id + '"]') : null);
          if (lab) box = lab.getBoundingClientRect();
        }
        if (box.height < min - 0.5 || box.width < min - 0.5) {
          out.push((openId ? openId + ' ' : '') +
                   (el.id ? '#' + el.id : (typeof el.className === 'string' && el.className.trim()
                     ? '.' + el.className.trim().split(/\s+/)[0] : el.tagName.toLowerCase())) +
                   ' ' + Math.round(box.width) + '×' + Math.round(box.height));
        }
      });
      return out;
    }, [TAP_MIN, st.open]);
    found.forEach((f) => { if (small.indexOf(f) < 0) small.push(f); });

    /* …AND THE OVERFLOW SCAN RUNS IN EVERY WINDOW TOO. Checks ① and ② above
       measure the page with every modal at `display: none`, so they skip the
       modal rules entirely — a `.modalCard` 900px wide passed all of them.
       The windows are already being opened for the floor; measuring them
       while they are open is the same loop. */
    if (st.open) {
      const over = await p.evaluate((arg) => {
        const [limit, openId] = arg;
        const out = [];
        const root = document.getElementById(openId);
        root.querySelectorAll('*').forEach((el) => {
          const cs = getComputedStyle(el);
          if (cs.display === 'none' || cs.visibility === 'hidden') return;
          const r = el.getBoundingClientRect();
          if (r.width === 0) return;
          if (r.right > limit + 1 || r.left < -1) {
            out.push(openId + ' ' + (el.id ? '#' + el.id : el.tagName.toLowerCase()) +
                     ' [' + Math.round(r.left) + '→' + Math.round(r.right) + ']');
          }
        });
        if (document.documentElement.scrollWidth > limit + 1) {
          out.push(openId + ' widens the page to ' + document.documentElement.scrollWidth + 'px');
        }
        return out;
      }, [vp.width, st.open]);
      over.forEach((o) => { if (wideWin.indexOf(o) < 0) wideWin.push(o); });
    }
  }
  if (!vp.desktop) ok('no window lays itself out wider than the screen',
     wideWin.length === 0, wideWin.slice(0, 6).join(' | '));
  await p.evaluate(() => document.querySelectorAll('.modalBack, .camLive').forEach((m) => m.classList.remove('open')));
  if (!vp.desktop) ok('every control is at least ' + TAP_MIN + 'px, in every window',
     small.length === 0, small.slice(0, 10).join(' | ') +
     (small.length > 10 ? '  (+' + (small.length - 10) + ' more)' : ''));

  /* ③ The header title is not clipped mid-word — "Scan & A…er" is what a
     visitor sees before they see anything else.

     MEASURED ONE LEVEL UP, because `.brandTitle` sits in a column flex box
     with no `min-width: 0` and is therefore ALWAYS laid out at its own content
     width: `scrollWidth === clientWidth` unconditionally, so the check could
     not fail. `.brand` is where the squeezing actually happens — on the file
     before the fix it was 75px wide at 393px and 2px at 320px, logo and name
     pressed out of existence, and none of that was visible from inside the
     title. */
  const title = await p.evaluate(() => {
    /* MEASURE THE TEXT, NOT THE BOX. Every box measurement here is a lie in
       one direction or another: `.brandTitle.scrollWidth` equals its
       clientWidth because a column flex box lays it out at its own content
       width, and `.brand.scrollWidth` does not grow for `overflow: visible`
       children. What is actually true is simple — how wide is the name, and
       how much room was it given? A Range over the text node answers it and
       cannot be fooled by the layout above it. */
    const el = [].slice.call(document.querySelectorAll('.brandTitle span, .brandTitle'))
      .filter((n) => getComputedStyle(n).display !== 'none' && n.textContent.trim())[0];
    if (!el) return { squeezed: true, text: '(no name in the header at all)', needs: 0, has: 0 };
    const r = document.createRange();
    r.selectNodeContents(el);
    const needs = r.getBoundingClientRect().width;
    /* The room it was given is the narrowest box between the text and the
       header — whichever ancestor is doing the clipping. */
    let has = Infinity, n = el;
    while (n && n !== document.body) { has = Math.min(has, n.clientWidth || Infinity); n = n.parentElement; }
    /* TWO WAYS THE NAME LOSES, and a check that watches one of them misses
       the other. With `.brandText` able to shrink, the text is ELLIPSISED —
       it needs more than its box ("Scan & A…er"). With it unable to shrink,
       the brand OVERFLOWS instead and the name simply lies under the toolbar,
       every pixel of it "fitting" its own box. The brand needing more room
       than it was given is the second, and both are the same complaint. */
    const brand = document.querySelector('.brand');
    const overflows = brand.scrollWidth > brand.clientWidth + 1;
    return { squeezed: needs > has + 1 || overflows, text: el.textContent.trim(),
             needs: Math.round(overflows ? brand.scrollWidth : needs),
             has: Math.round(overflows ? brand.clientWidth : has) };
  });
  ok('the app\'s own name fits in the header', !title.squeezed,
     '"' + title.text + '" needs ' + title.needs + 'px and was given ' + title.has + 'px');
  /* Whatever else gives way, the version badge does not: it is the only thing
     on the screen that says whether the deploy landed. */
  const badge = await p.evaluate(() => {
    const el = document.getElementById('versionTag');
    const r = el ? el.getBoundingClientRect() : { width: 0, height: 0 };
    return { w: Math.round(r.width), h: Math.round(r.height), text: el ? el.textContent : '' };
  });
  ok('the version badge is on the screen', badge.w > 0 && badge.h > 0,
     'versionTag is ' + badge.w + '×' + badge.h + ' ("' + badge.text + '")');

  /* ④ The dock never covers the last card. */
  const covered = await p.evaluate(() => {
    const dock = document.querySelector('.camDock');
    const list = document.getElementById('answersList');
    if (!dock || !list) return false;
    window.scrollTo(0, document.body.scrollHeight);
    return list.getBoundingClientRect().bottom > dock.getBoundingClientRect().top;
  });
  ok('the camera dock does not sit on top of the last answer', !covered);

  return { results, page: p, ctx };
}

/* ---------------------------------------------------------------------
   DOES ANY OF THIS ACTUALLY FAIL?
   ---------------------------------------------------------------------
   Two of the first five checks could not. `scrollWidth <= innerWidth` is
   always true under mobile emulation because `innerWidth` GROWS to the
   overflowed width; `.brandTitle.scrollWidth > clientWidth` is always false
   because the title is laid out at its own content width inside a column flex
   box. Both printed a tick on a page that was visibly broken, and both were
   the checks the documentation led with.

   So each one is now mutation-tested: break the page in the exact way the
   check names, and the check must go red. A check that cannot fail is not a
   check, and the only way to know which kind you have is to try.

     node tools/mobile-check.mjs --selftest
   --------------------------------------------------------------------- */
const MUTANTS = [
  { check: 'the page is no wider than the screen',
    why: 'a 900px block dropped on the page',
    css: '', body: '<div style="width:900px;height:12px"></div>' },
  { check: 'nothing hangs off either edge',
    why: 'the answers row put back the way it shipped',
    css: '.ansActions { flex-wrap: nowrap !important; } .ansActions .btn { flex: none !important; }' },
  { check: 'every control is at least 44px, in every window',
    why: '✎ Edit shrunk back under the floor',
    css: '.ansEditBtn { width: 20px !important; height: 20px !important; min-height: 0 !important; }' },
  { check: "the app's own name fits in the header",
    /* The long name ALONE no longer clips — with the header wrapping, the
       brand simply takes the room and the toolbar drops to its own row. To
       reproduce the reported symptom the header has to be put back the way it
       shipped as well: unable to wrap, so the brand is squeezed instead. */
    why: 'the long name in a header put back the way it shipped, unable to wrap',
    css: 'header { flex-wrap: nowrap !important; } .headTools { flex-wrap: nowrap !important; } ' +
         '.brandFull { display: inline !important; } .brandShort { display: none !important; }' },
  { check: 'the version badge is on the screen',
    why: 'the version badge hidden',
    css: '#versionTag { display: none !important; }' },
  { check: 'the camera dock does not sit on top of the last answer',
    why: 'the padding that clears the dock taken away',
    css: '#scanPage { padding-bottom: 0 !important; }' },
  /* A control that exists ONLY inside a window. Without this the modal loop
     could quietly stop working — a renamed `.open`, a null getElementById —
     and every check would stay green. */
  { check: 'every control is at least 44px, in every window',
    why: "the ✎ window's own tick-box label shrunk — a control no other check can see",
    css: '.aeCheck label { min-height: 0 !important; height: 12px !important; }' },
  /* …and the same for a window laid out too wide, which every check missed
     until the scan was run with the windows open. */
  { check: 'no window lays itself out wider than the screen',
    why: 'a vetting window 900px wide',
    /* `min-width`, not `width`: a `.modalCard` is a flex item, so a plain
       `width: 900px` is only its BASE size and `flex-shrink` pulls it straight
       back to the screen — the mutant looked broken and laid out fine. */
    css: '#vetModal .modalCard { min-width: 900px !important; max-width: none !important; }' },
  /* THE HEADLINE FAILURE, FROM CONTENT RATHER THAN FROM A CONTROL ROW: one
     token with no spaces in it, which `pre-wrap` will not break. */
  { check: 'the page is no wider than the screen',
    why: 'one unbroken token in an answer, with the wrap guard removed',
    css: '.ansQ, .ansText, .stepDo, .stepWhy, .youText, .whyText, .fbText ' +
         '{ overflow-wrap: normal !important; word-break: normal !important; }',
    seed: 'https://firebasestorage.googleapis.com/v0/b/mathgen--app.appspot.com/o/' +
          'scan-mistakes%2Fuid_example%2Fm_abc123_question.jpg?alt=media&token=00000000-0000-0000-0000-000000000000' }
];

if (process.argv.includes('--selftest')) {
  const vp = { name: 'selftest', width: 393, height: 852 };
  console.log('SELF-TEST — each check is given a page broken in the way it names.\n');
  let bad = 0;
  for (const m of MUTANTS) {
    let mutated = page
      .replace('</head>', '<style>' + (m.css || '') + '</style></head>')
      .replace('</body>', (m.body || '') + '</body>');
    /* Some defects are in the CONTENT, not the stylesheet. */
    /* Into a field that is actually on the SCREEN: card one's answer is behind
       its steps (`.ansHidden`), so seeding there tested nothing. The marked
       card shows its answer at once. */
    if (m.seed) mutated = mutated.replace('400 and 441', m.seed);
    const f = path.join(OUT, 'mutant.html');
    fs.writeFileSync(f, mutated);
    const r = await measure('file://' + f, vp);
    await r.ctx.close();
    const hit = r.results.filter((x) => x.name === m.check)[0];
    if (!hit) { console.log('  ✗ ' + m.check + ' — check never ran'); bad++; continue; }
    if (hit.pass) {
      console.log('  ✗ ' + m.check + '\n      still passed with ' + m.why + ' — this check cannot fail');
      bad++;
    } else {
      console.log('  ✓ ' + m.check + '\n      goes red on ' + m.why);
    }
  }
  await browser.close();
  console.log('\n' + (bad ? '✗ ' + bad + ' check' + (bad === 1 ? '' : 's') + ' cannot fail'
                          : '✓ every check fails when it should'));
  process.exit(bad ? 1 : 0);
}

for (const vp of VIEWPORTS) {
  console.log('\n' + vp.name + '  (' + vp.width + '×' + vp.height + ')');
  const r = await measure('file://' + file, vp);
  r.results.forEach((x) => {
    if (x.pass) { console.log('  ✓ ' + x.name); return; }
    fails++;
    console.log('  ✗ ' + x.name + (x.extra ? '  → ' + x.extra : ''));
  });
  /* The dock is position:fixed, so a fullPage shot paints it across the middle
     of the page and hides whichever card it lands on. Taken down for the
     photograph only — it has already been measured where it really is. */
  await r.page.evaluate(() => {
    window.scrollTo(0, 0);
    const d = document.querySelector('.camDock');
    if (d) d.style.visibility = 'hidden';
  });
  await r.page.screenshot({ path: path.join(OUT, vp.name + '.png'), fullPage: true });
  await r.ctx.close();
}
await browser.close();

console.log('\nscreenshots in ' + OUT);
console.log(fails ? '✗ ' + fails + ' problem' + (fails === 1 ? '' : 's') : '✓ every viewport is clean');
process.exit(fails ? 1 : 0);
