/* Loads the REAL grounding and scan sections out of index.html and runs them
   against stubs.

   Everything pinned here fails SILENTLY in the app. A digest that comes back
   empty is just an ungrounded prompt — the answers still appear, they simply
   stop being the teacher's. A continuation that stops folding turns one
   question into two halves, each with half an answer, and the page looks
   perfectly tidy either way. */
import fs from 'fs';

const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');

function section(from, to) {
  const a = html.indexOf(from);
  const b = html.indexOf(to, a);
  if (a < 0 || b < 0) throw new Error('section not found: ' + from.slice(0, 48));
  return html.slice(a, b);
}

const grounding = section(
  '/* ================= Teaching notes & AI style training',
  '/* ================= Uploading notes');
const json = section(
  '/* ================= Tolerant JSON parse',
  '/* ================= Teaching notes & AI style training');
const scan = section(
  '/* =====================================================================\n   THE SCAN',
  '/* ---- Showing the answers ----');

const prelude = `
var currentUser = { uid: 'admin1', email: 'chungzhikai@gmail.com' };
var LEVELS = ['P3','P4','P5','P6','S1'];
function isAdmin(u) { return !!u && u.email === 'chungzhikai@gmail.com'; }
function subjectLabel(s) { return s === 'math' ? 'Mathematics' : s === 'science' ? 'Science' : ''; }
function levelLabel(l) { return l === 'S1' ? 'Sec 1' : (l || ''); }
function escHtml(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function $(id) { return null; }
function toast() {}
function confirm() { return true; }
var document = { getElementById: () => null, createElement: () => ({ getContext: () => ({}) }) };
var localStorage = { getItem: () => null, setItem: () => {} };
var db = { collection: () => ({ doc: () => ({
  collection: () => ({ doc: () => ({ get: () => Promise.resolve({ exists: false }) }),
                       get: () => Promise.resolve({ forEach: () => {} }) }),
  get: () => Promise.resolve({ exists: false })
}) }) };
`;

const api = new Function(prelude + json + grounding + scan + `
  return {
    set notes(v) { teachingNotes = v; },
    set style(v) { aiStyle = v; },
    set meta(v) { wsMeta = v; },
    get meta() { return wsMeta; },
    noteAppliesHere, notesRelevant, notesBlock, guidanceBlock, styleBlock,
    aiGrounding, groundingSummary, notesKeywordList,
    _parseAIJson, _scanNewItem, _scanFoldRows, _scanStr,
    SCAN_SYS, SCAN_DETAIL_RULE
  };
`)();
api.meta = { level: 'P5', subject: 'science' };

let fails = 0, ran = 0;
function ok(name, cond, extra) {
  ran++;
  if (cond) return;
  fails++;
  console.error('FAIL: ' + name + (extra ? '\n      ' + extra : ''));
}

/* ---------- The digest ---------- */
const guideNote = {
  id: 'n1', guidance: 'Always name the process — "evaporation", not "it dries up".',
  subjects: [], levels: [], keywords: [], markingStandards: '', keyFacts: ''
};
const sciNote = {
  id: 'n2', subjects: ['science'], levels: ['P5'],
  keywords: ['water vapour', 'evaporation'],
  markingStandards: 'The process must be named.', keyFacts: 'Evaporation happens at all temperatures.'
};
const mathNote = { id: 'n3', subjects: ['math'], levels: ['P6'], keywords: ['remainder'], keyFacts: '' };

api.notes = [];
api.style = null;
ok('an empty notebook grounds nothing', api.aiGrounding('answer') === '');
ok('an empty notebook says so', api.groundingSummary().length === 0);

api.notes = [guideNote, sciNote, mathNote];
const g = api.aiGrounding('answer');
ok('guidance reaches an answer', g.includes('it dries up'));
ok('guidance LEADS the digest',
   g.indexOf('GENERAL GUIDANCE') >= 0 && g.indexOf('GENERAL GUIDANCE') < g.indexOf('REFERENCE NOTES'));
ok('the keywords reach an answer', g.includes('water vapour'));
ok('the key facts reach an answer', g.includes('Evaporation happens'));
ok('the authority order is stated', g.includes('AUTHORITY ORDER'));
ok('what the paper prints wins when answering', g.includes('what the paper itself prints'));

const m = api.aiGrounding('mark');
ok('guidance reaches MARKING too — it is the only field that does', m.includes('it dries up'));
ok('marking is told the model answer wins', m.includes("teacher's model answer"));
ok('key facts stay OUT of a marking digest', !m.includes('Evaporation happens'));
ok('marking standards reach marking', m.includes('The process must be named'));

/* A note is filtered by the subject and level being scanned — and a P6 maths
   note has no business grounding a P5 science paper. */
ok('an off-subject note is filtered out', !api.aiGrounding('answer').includes('remainder'));
api.meta = { level: 'P6', subject: 'math' };
ok('the right note applies when the pickers change', api.aiGrounding('answer').includes('remainder'));
ok('an off-level science note is filtered out', !api.aiGrounding('answer').includes('water vapour'));
ok('a general note applies whatever is being scanned', api.aiGrounding('answer').includes('it dries up'));

/* Nothing matching must fall back to the WHOLE notebook rather than to
   nothing: a teacher who uploaded notes expects them to be read. */
api.meta = { level: 'P3', subject: 'science' };
api.notes = [mathNote];
ok('nothing matching falls back to the whole notebook',
   api.notesRelevant().length === 1 && api.aiGrounding('answer').includes('remainder'));

/* ---------- The style profile ---------- */
api.meta = { level: 'P5', subject: 'science' };
api.notes = [];
api.style = { profileSamples: 42, profile: {
  styleRules: 'Full sentences, always name the process.',
  phrasing: 'Because the … , the … .',
  markingStandards: 'No mark without the keyword.',
  keywords: ['evaporation'],
  exemplars: [{ q: 'Why did the water level fall?', a: 'The water evaporated into water vapour.' }]
} };
const s1 = api.aiGrounding('answer');
ok('the learned style reaches an answer', s1.includes('Full sentences'));
ok('the exemplars reach an answer', s1.includes('evaporated into water vapour'));
const s2 = api.aiGrounding('mark');
ok('the exemplars stay OUT of marking', !s2.includes('evaporated into water vapour'));
ok('how the teacher marks reaches marking', s2.includes('No mark without the keyword'));
ok('the style alone is grounding enough', api.groundingSummary().length > 0);

/* ---------- Reading a batch ---------- */
const row = (o) => Object.assign({ number: '1', page: 1, type: 'open', question: 'Q', answer: 'A' }, o);

let into = [];
api._scanFoldRows([row({ number: '1' }), row({ number: '2', page: 2 })], 0, 3, into);
ok('one entry per question', into.length === 2);
ok('page numbers are global, not batch-local', into[0].page === 1 && into[1].page === 2);

into = [];
api._scanFoldRows([row({ number: '5', page: 2 })], 3, 3, into);
ok('a later batch numbers its pages from where it starts', into[0].page === 5);

/* The page the model names is 1..n WITHIN its own batch: out of range or
   missing, it falls back to the batch's first page rather than pointing at a
   page that is not there. */
into = [];
api._scanFoldRows([row({ page: 9 }), row({ page: null }), row({ page: 0 })], 3, 2, into);
ok('an out-of-range page falls back to the batch start',
   into.every(it => it.page === 4), JSON.stringify(into.map(i => i.page)));

/* The continuation fold — the whole reason multi-page scanning works. */
into = [{ number: '7', page: 2, endPage: 2, type: 'open', question: 'A tap fills a tank in', options: [], option: '', answer: '', explanation: '' }];
api._scanFoldRows([
  row({ continuation: true, number: '7', page: 1, question: '12 minutes. How long for two taps?', answer: '6 minutes', explanation: 'Two taps together.' }),
  row({ number: '8', page: 1, question: 'Next question', answer: 'B' })
], 2, 2, into);
ok('a continuation does not become a question of its own', into.length === 2);
ok('the two halves are joined', into[0].question === 'A tap fills a tank in 12 minutes. How long for two taps?');
ok('the answer comes from the half that could see the whole question', into[0].answer === '6 minutes');
ok('the explanation comes with it', into[0].explanation === 'Two taps together.');
ok('the question is marked as running onto the next page', into[0].endPage === 3);
ok('the question AFTER a continuation is still filed', into[1].number === '8');

/* Only the FIRST entry of a batch can be a continuation — anything later is
   a question of its own, whatever it claims. */
into = [{ number: '1', page: 1, endPage: 1, type: 'open', question: 'First', options: [], option: '', answer: 'x', explanation: '' }];
api._scanFoldRows([row({ number: '2' }), row({ number: '3', continuation: true })], 1, 2, into);
ok('a continuation claimed mid-batch is ignored', into.length === 3);

/* Nothing to continue INTO: the first batch of the run. */
into = [];
api._scanFoldRows([row({ continuation: true, question: 'orphan', answer: 'A' })], 0, 1, into);
ok('a continuation with nothing before it is kept as a question', into.length === 1 && into[0].question === 'orphan');

/* An empty row is dropped rather than filed as a blank card. */
into = [];
api._scanFoldRows([{ number: '4' }, null, 'nonsense'], 0, 1, into);
ok('an empty row is dropped', into.length === 0);

/* MCQ shape survives the read. */
into = [];
api._scanFoldRows([row({ type: 'mcq', option: '2', answer: '(2) water vapour',
  options: [{ label: '1', text: 'ice' }, { label: '2', text: 'water vapour' }] })], 0, 1, into);
ok('an MCQ keeps its options', into[0].options.length === 2);
ok('an MCQ keeps the correct option', into[0].option === '2' && into[0].type === 'mcq');

/* ---------- The prompt's promises ---------- */
ok('every question is answered, MCQ included', /Multiple-choice questions are NOT/.test(api.SCAN_SYS));
ok('a lettered part is its own entry', /ONE ENTRY PER LETTERED PART/.test(api.SCAN_SYS));
ok('an answer already written on the paper is ignored', /IGNORE it and work the answer out yourself/.test(api.SCAN_SYS));
ok('there are three real detail levels',
   new Set(Object.values(api.SCAN_DETAIL_RULE)).size === 3);
ok('"answer only" really asks for no explanation', /empty string/.test(api.SCAN_DETAIL_RULE.short));

/* ---------- The JSON parser ---------- */
ok('plain JSON parses', api._parseAIJson('{"questions":[]}').questions.length === 0);
ok('a fenced reply parses', api._parseAIJson('```json\n{"questions":[{"number":"1"}]}\n```').questions[0].number === '1');
ok('trailing prose after the JSON is cut',
   api._parseAIJson('{"questions":[{"number":"1"}]}\nNote: hope this helps').questions.length === 1);
ok('a reply cut off mid-value is repaired',
   api._parseAIJson('{"questions":[{"number":"1","answer":"the water evap').questions[0].number === '1');
ok('an unescaped quote inside an answer survives',
   api._parseAIJson('{"questions":[{"answer":"it is called "evaporation""}]}').questions[0].answer.includes('evaporation'));

console.log((fails ? '✗ ' : '✓ ') + (ran - fails) + '/' + ran + ' checks passed');
process.exit(fails ? 1 : 0);
