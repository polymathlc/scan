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
   and measures the page in three phone viewports:

     • the document is never wider than the screen        ← the shrink-to-fit
     • nothing pressed is under 44px                      ← Apple's own floor
     • the header title is not clipped                    ← "Scan & A…er"

   No network: every <script> is stripped and the logo is swapped for the
   inline SVG the header already falls back to, so this runs offline and the
   same way every time.

     npm i playwright-core && node tools/mobile-check.mjs [outDir]

   It writes a screenshot per viewport to look at, because a page that
   measures clean is not the same as one that reads well.
*/
import fs from 'fs';
import path from 'path';

const OUT = process.argv[2] || '/tmp/mobile-check';
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
function itemSubjectWhy(it){var own=(it&&SUBJECT_OK[it.subject])?it.subject:'';if(own)return{key:own,from:'question'};var set=(wsMeta.subject&&SUBJECT_OK[wsMeta.subject])?wsMeta.subject:'';if(set)return{key:set,from:'setting'};return{key:'',from:''};}
function itemSubject(it){return itemSubjectWhy(it).key;}
var document={getElementById:function(){return null;},createElement:function(){return {getContext:function(){return {};}};}};
var window={}; var localStorage={getItem:function(){return null;},setItem:function(){}};
var location={href:'x',hostname:'y'}; var navigator={}; var storage=null;
var db={collection:function(){return {doc:function(){return {collection:function(){return {doc:function(){return {get:function(){return Promise.resolve({exists:false});}};},get:function(){return Promise.resolve({forEach:function(){}});}};},get:function(){return Promise.resolve({exists:false});}};}};}};
`;
const api = new Function(prelude +
  cut('/* ================= Tolerant JSON parse', '/* ================= Teaching notes & AI style training') +
  cut('/* ================= Teaching notes & AI style training', '/* ================= Uploading notes') +
  cut('/* =====================================================================\n   THE SCAN', '/* ---- Showing the answers ----') +
  cut('/* ---- Showing the answers ----', '/* =====================================================================\n   📋 THE REPORT') +
  `\n  var _vetCardFootHtml = function () { return '<div class="ansSend noPrint"><button class="btn btnScan">📥 Send to Maths vetting</button></div>'; };
  return { answerCardHtml: answerCardHtml, setAnswers: function (v) { _answers = v; }, setMeta: function (v) { wsMeta = v; } };`
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
  // the dock is what the Snap tab is laid out around, so it has to be up
  .replace('<div class="camDock hidden" id="camDock">', '<div class="camDock" id="camDock">')
  .replace('<span class="mbCount hidden" id="mbBadge">0</span>', '<span class="mbCount" id="mbBadge">22</span>')
  .replace('<span id="versionTag"></span>', '<span id="versionTag">v' + (src.match(/APP_VERSION = '([^']+)'/) || [, '?'])[1].replace(/^v/, '') + '</span>');
page = page.replace('<h2 id="answersTitle" style="margin:0">The answers</h2>',
                    '<h2 id="answersTitle" style="margin:0">Marked &amp; answered (3)</h2>');

fs.mkdirSync(OUT, { recursive: true });
const file = path.join(OUT, 'page.html');
fs.writeFileSync(file, page);

/* The phones this is actually opened on: a current iPhone, a small one, and
   the narrowest thing still in service. */
const VIEWPORTS = [
  { name: 'iphone-15-pro', width: 393, height: 852 },
  { name: 'iphone-se',     width: 375, height: 667 },
  { name: 'galaxy-fold',   width: 320, height: 800 }
];
const TAP_MIN = 44;

const browser = await chromium.launch({ executablePath: CHROME });
let fails = 0;
function ok(name, cond, extra) {
  if (cond) { console.log('  ✓ ' + name); return; }
  fails++;
  console.log('  ✗ ' + name + (extra ? '  → ' + extra : ''));
}

for (const vp of VIEWPORTS) {
  console.log('\n' + vp.name + '  (' + vp.width + '×' + vp.height + ')');
  const ctx = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: 2, isMobile: true, hasTouch: true
  });
  const p = await ctx.newPage();
  await p.goto('file://' + file, { waitUntil: 'load' });
  await p.waitForTimeout(120);

  /* ① THE ONE THAT MATTERS. A document wider than the screen is the whole
     page shrunk to fit on iOS, and every other complaint follows from it. */
  const w = await p.evaluate(() => ({
    doc: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
    inner: window.innerWidth
  }));
  ok('the page is no wider than the screen', w.doc <= w.inner + 1,
     'document is ' + w.doc + 'px in a ' + w.inner + 'px screen');

  /* …and WHICH element is doing it, because "something overflows" is not a
     thing anybody can go and fix. */
  const wide = await p.evaluate((limit) => {
    const out = [];
    document.querySelectorAll('body *').forEach((el) => {
      if (!el.offsetParent && el !== document.body) return;
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

  /* ② Everything pressed is thumb-sized. */
  const small = await p.evaluate((min) => {
    const out = [];
    document.querySelectorAll('button:not([hidden]), .tab, .shotBtn').forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return;          // not on screen
      if (el.closest('.shotBar')) return;                    // the strip's own tiny arrows
      if (r.height < min - 0.5) {
        out.push((el.id ? '#' + el.id : el.className || el.tagName) + ' ' +
                 Math.round(r.width) + '×' + Math.round(r.height));
      }
    });
    return out.slice(0, 8);
  }, TAP_MIN);
  ok('every button is at least ' + TAP_MIN + 'px tall', small.length === 0, small.join(' | '));

  /* ③ The header title is not clipped mid-word. "Scan & A…er" is what a
     visitor sees before they see anything else. */
  const title = await p.evaluate(() => {
    const el = document.querySelector('.brandTitle');
    return { clipped: el.scrollWidth > el.clientWidth + 1, text: el.textContent };
  });
  ok('the app\'s own name fits in the header', !title.clipped, 'clipped: ' + title.text);

  /* ④ The dock never covers the last card. */
  const covered = await p.evaluate(() => {
    const dock = document.querySelector('.camDock');
    const list = document.getElementById('answersList');
    if (!dock || !list) return false;
    window.scrollTo(0, document.body.scrollHeight);
    return list.getBoundingClientRect().bottom > dock.getBoundingClientRect().top;
  });
  ok('the camera dock does not sit on top of the last answer', !covered);

  await p.evaluate(() => window.scrollTo(0, 0));
  await p.screenshot({ path: path.join(OUT, vp.name + '.png'), fullPage: true });
  await ctx.close();
}
await browser.close();

console.log('\nscreenshots in ' + OUT);
console.log(fails ? '✗ ' + fails + ' problem' + (fails === 1 ? '' : 's') : '✓ every viewport is clean');
process.exit(fails ? 1 : 0);
