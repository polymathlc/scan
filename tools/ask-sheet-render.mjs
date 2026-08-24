/* 🖨 Draw the Ask Mr Chung worksheet for real, in a headless browser.
   ---------------------------------------------------------------------
   There is no canvas in Node, so tools/scan-tests.mjs can only pin what
   DECIDES the sheet — the tier, the options rule, the fallbacks. This pins
   the drawing: it cuts the real renderer out of index.html, runs it in
   Chromium over the cases that matter, and writes each sheet to /tmp so a
   person can look at it.

   It is not part of the ordinary run — it needs a browser and a
   playwright-core that may not be installed — so it is a tool you reach for
   after touching the layout, not a gate. Every case here is one that has
   already gone wrong once: a figure that would not load, a crop smaller than
   the column, a question with nothing in it at all.

     npm i playwright-core && node tools/ask-sheet-render.mjs [outDir]
*/
import fs from 'fs';
import path from 'path';

const OUT = process.argv[2] || '/tmp/ask-sheets';
const CHROME = process.env.CHROME_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

let chromium;
try { ({ chromium } = await import('playwright-core')); }
catch { console.error('needs playwright-core:  npm i playwright-core'); process.exit(2); }

const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
function cut(a, b) {
  const i = html.indexOf(a), j = html.indexOf(b, i);
  if (i < 0 || j < 0) throw new Error('section not found: ' + a.slice(0, 50));
  return html.slice(i, j);
}
const src = cut('/* =====================================================================\n   🖨 THE QUESTION, SET OUT AS A WORKSHEET',
                '/* =====================================================================\n   📤 THE WORKSHEET, AND THE LINK THAT REACHES IT');

/* The handful of things the renderer calls that live elsewhere in the app. */
const shim = `
  var levelLabel = v => ({ p3:'P3', p4:'P4', p5:'P5', p6:'P6' }[v] || v);
  var subjectLabel = v => ({ math:'Mathematics', science:'Science', english:'English', chinese:'Chinese' }[v] || v);
  var _ansTrim = (s, n) => String(s || '').slice(0, n);
  var _scanStr = (s, n) => String(s == null ? '' : s).replace(/\\s*\\n\\s*/g, ' ').trim().slice(0, n);
  var _askClean = async u => u;
`;

fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ executablePath: CHROME });
const page = await browser.newPage();
await page.setContent('<!doctype html><body></body>');
await page.addScriptTag({ content: shim + src });

const fig = await page.evaluate(() => {
  const c = document.createElement('canvas'); c.width = 640; c.height = 300;
  const x = c.getContext('2d');
  x.fillStyle = '#fff'; x.fillRect(0, 0, 640, 300);
  x.strokeStyle = '#111'; x.lineWidth = 3; x.strokeRect(40, 40, 560, 220);
  x.fillStyle = '#111'; x.font = '26px sans-serif';
  x.fillText('Jim   17', 80, 100); x.fillText('Ken   x', 80, 160); x.fillText('Leo   6x - 5', 80, 220);
  return c.toDataURL('image/png');
});

const cases = [
  ['built', { id: 'a1', level: 'p5', subject: 'math', number: '10(a)', options: [],
    question: 'Express the total number of seashells in terms of x.',
    blocks: [
      { type: 'text', text: 'The table shows the number of seashells collected by 3 boys.' },
      { type: 'image', url: fig },
      { type: 'text', text: 'Express the total number of seashells the 3 boys have in terms of x, in the simplest form.' }
    ] }],
  ['built-mcq', { id: 'a2', level: 'p5', subject: 'science', number: '7',
    question: 'Which of the following is a producer?',
    blocks: [{ type: 'text', text: 'The food web below shows five organisms in a pond.' }, { type: 'image', url: fig }],
    options: [{ label: '1', text: 'Arrowhead' }, { label: '2', text: 'Water lily' },
              { label: '3', text: 'Tadpole' }, { label: '4', text: 'Heron' }] }],
  ['built-picture-options', { id: 'a3', subject: 'science', number: '5',
    question: 'Which shape has exactly one line of symmetry?',
    blocks: [{ type: 'text', text: 'Which of the shapes below has exactly one line of symmetry?' },
             { type: 'image', url: fig, role: 'options' }],
    options: [{ label: '1', text: '' }, { label: '2', text: '' }, { label: '3', text: '' }, { label: '4', text: '' }] }],
  ['whole-crop', { id: 'a4', subject: 'math', number: '8', shot: 'question', img: fig,
    question: 'the transcription', blocks: [], options: [] }],
  ['flat', { id: 'a5', level: 'p5', subject: 'science', number: '12', blocks: [], options: [],
    question: 'David left a beaker of water on the window sill for three days.\nExplain why the water level fell.' }],
  ['figure-fails', { id: 'a6', subject: 'science', number: '3', options: [], question: 'fallback wording',
    blocks: [{ type: 'text', text: 'The diagram below shows a circuit.' },
             { type: 'image', url: 'https://example.invalid/nope.png' },
             { type: 'text', text: 'Explain why bulb A did not light up.' }] }],
  ['very-long', { id: 'a7', subject: 'english', number: '1', blocks: [], options: [],
    question: 'This is a long sentence that goes on and on. '.repeat(90) }],
  ['nothing-at-all', { id: 'a8', question: '', blocks: [], options: [] }]
];

let bad = 0;
for (const [name, m] of cases) {
  let url = '';
  try { url = await page.evaluate(q => askSheetFor(q), m); }
  catch (e) { console.log('✗ ' + name + ' THREW ' + e.message); bad++; continue; }
  if (!url) { console.log('· ' + name + ' — no sheet (the crop is sent instead)'); continue; }
  const buf = Buffer.from(url.split(',')[1], 'base64');
  const file = path.join(OUT, name + '.jpg');
  fs.writeFileSync(file, buf);
  const dim = await page.evaluate(u => new Promise(r => {
    const i = new Image(); i.onload = () => r(i.width + '×' + i.height); i.src = u;
  }), url);
  console.log('✓ ' + name.padEnd(24) + dim.padEnd(12) + file);
}
await browser.close();
console.log(bad ? '\n✗ ' + bad + ' threw' : '\nLook at them — a sheet that renders is not the same as one that reads.');
process.exit(bad ? 1 : 0);
