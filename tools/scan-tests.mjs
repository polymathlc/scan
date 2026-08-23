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
/* 📋 The report on the whole script. Every number on that card is counted
   HERE, in plain code, from the verdicts already on the answer cards — so a
   score that drifts is the app contradicting itself in front of a parent,
   with nothing on screen to say which half is lying. */
const report = section(
  '/* =====================================================================\n   📋 THE REPORT',
  '/* =====================================================================\n   📥 SENDING A SCANNED QUESTION');
/* 📕 The mistake book, and the worksheet it makes. The one place this app
   keeps a child's work, so every guard on it matters — and the collection
   NAME most of all: `mistakes` under this same uid is the Science portal's
   own log, and sharing it would merge two apps' data with nothing throwing. */
const book = section(
  '/* =====================================================================\n   📕 THE MISTAKE BOOK',
  '/* =====================================================================\n   📥 SENDING A SCANNED QUESTION');
/* 📥 The admin's door into the four portals' vetting lists. Everything it can
   get wrong is silent: a document written in the wrong SHAPE renders as a
   question with no answer in it, and a `source` that stops saying 'scan'
   lands a card that is no longer purple and no longer says where it came
   from — in an app this one cannot see. */
const vet = section(
  '/* =====================================================================\n   📥 SENDING A SCANNED QUESTION',
  '/* ================= Sign in ================= */');

/* ⚙️ The two engines. This block lives in the MODULE at the foot of the file,
   so it is loaded on its own with its own stubs — it must not depend on
   Firebase, on fetch, or on anything else the classic script has.

   Every way it goes wrong is silent and the app carries on looking exactly as
   it did the day the spending cap was hit: an engine that stops being tried,
   a "down" note that never clears so the backup becomes permanent, a
   preference with no key behind it that refuses every call, or the wrong
   error reported for a paper that failed on both. And the four slot NAMES are
   the whole contract with the other four portals — rename one and this app is
   signed out of a key it can plainly see. */
const engine = section(
  '\nconst AI_ENGINE_STORE = {',
  '/* ===== end of the two-engine block ===== */');

const prelude = `
var currentUser = { uid: 'admin1', email: 'chungzhikai@gmail.com' };
var LEVELS = ['P3','P4','P5','P6','S1'];
var SUBJECTS = [
  { value: 'science', label: 'Science' },
  { value: 'math',    label: 'Mathematics' },
  { value: 'english', label: 'English' },
  { value: 'chinese', label: 'Chinese' }
];
var SUBJECT_OK = {}; SUBJECTS.forEach(x => { SUBJECT_OK[x.value] = 1; });
function isAdmin(u) { return !!u && u.email === 'chungzhikai@gmail.com'; }
function subjectLabel(s) {
  if (s === 'both') return 'Maths & Science';
  const hit = SUBJECTS.filter(x => x.value === s)[0];
  return hit ? hit.label : '';
}
function levelLabel(l) { return l === 'S1' ? 'Sec 1' : (l || ''); }
function escHtml(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function $(id) { return null; }
function toast() {}
function confirm() { return true; }
var document = { getElementById: () => null, createElement: () => ({ getContext: () => ({}) }) };
/* No dictation in node, which is exactly the case the app has to survive:
   the 🎤 is only shown where the browser really has the Web Speech API. */
var window = {};
var localStorage = { getItem: () => null, setItem: () => {} };
var location = { href: 'https://polymathlc.github.io/scan/' };
var navigator = {};
var storage = null;
var db = { collection: () => ({ doc: () => ({
  collection: () => ({ doc: () => ({ get: () => Promise.resolve({ exists: false }) }),
                       get: () => Promise.resolve({ forEach: () => {} }) }),
  get: () => Promise.resolve({ exists: false })
}) }) };
`;

const api = new Function(prelude + json + grounding + scan + report + book + vet + `
  return {
    set notes(v) { teachingNotes = v; },
    set style(v) { aiStyle = v; },
    set meta(v) { wsMeta = v; },
    get meta() { return wsMeta; },
    noteAppliesHere, noteSubjects, notesRelevant, notesBlock, guidanceBlock, styleBlock,
    aiGrounding, groundingSummary, notesKeywordList,
    _parseAIJson, _scanNewItem, _scanFoldRows, _scanStr, _scanPrompt, scanSubjectRule,
    _askPrompt, _askNewItem, _askFoldRows, _markFields, micAvailable, micLang,
    _ansEditApply, _ansEditNote, _ansTrim, _ansNoteTitle, _ansOptionFrom,
    SCAN_SYS, SCAN_DETAIL_RULE, SCAN_SUBJECT_RULE, SCAN_MARK_RULE,
    SCAN_ASK_SYS, SCAN_ASK_WITH_PAGES_RULE,
    _reportMarkStr, reportScore, reportEligible, _reportPrompt, _reportNew, _reportRefs,
    reportScoreText, reportCountsText, reportBasisText, reportAsText, reportCardHtml,
    REPORT_SYS, REPORT_MIN_MARKED, REPORT_MAX_GAPS, REPORT_MAX_LIST,
    set answers(v) { _answers = v; },
    set report(v) { _report = v; },
    get report() { return _report; },
    MB_COL, MB_PAPER_COL, MB_IMG_PATH, MB_PAPER_MAX, MB_PAPER_DAYS, MB_VIEWER_PATH, MB_MAIL_COL,
    mbIsWrong, mbIsRight, mbFindByKey, MB_CLEAR_WINS, MB_KEY_PREFIX,
    mbKeyOf, mbHasKey, _mbBoxOk, _mbShotForPage, _mbPaperUrl, _mbPaperTitle,
    _mbPaperDoc, _mbMailDoc, camAvailable,
    set mistakes(v) { _mistakes = v; },
    set shots(v) { _shots = v; },
    VET_TARGETS, vetTarget, VET_SOURCE, _vetPortalDoc, _vetMathDoc,
    _vetTitle, _vetHtml, _vetCorrectIndex, _vetIsMcq, _vetCardFootHtml,
    _scanSubject, itemSubject, itemTarget, _vetGroupBySubject,
    _textUsesAlgebra, _itemAsksAlgebra, _itemUsesAlgebra, _applyAlgebraFix,
    SCAN_ALGEBRA_FIX_CALLS, SCAN_ALGEBRA_FIX_MAX, SCAN_NO_ALGEBRA_RULE,
    set user(v) { currentUser = v; }
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

/* ---------- Four subjects ----------
   English and Chinese notes have to be filtered exactly as science and maths
   ones are. A note that grounds every subject grounds none of them properly:
   a Chinese 词语 rule pushed into an English comprehension answer is a wrong
   answer that reads as a confident one. */
const engNote = { id: 'n4', subjects: ['english'], levels: [], keywords: ['topic sentence'], keyFacts: '' };
const chiNote = { id: 'n5', subjects: ['chinese'], levels: [], keywords: ['错别字'], keyFacts: '' };
const bothNote = { id: 'n6', subjects: ['both'], levels: [], keywords: ['legacy pairing'], keyFacts: '' };

api.style = null;
api.notes = [engNote, chiNote, bothNote];
api.meta = { level: '', subject: 'english' };
let e = api.aiGrounding('answer');
ok('an English note grounds an English paper', e.includes('topic sentence'));
ok('a Chinese note does not ground an English paper', !e.includes('错别字'));
api.meta = { level: '', subject: 'chinese' };
let c = api.aiGrounding('answer');
ok('a Chinese note grounds a Chinese paper', c.includes('错别字'));
ok('an English note does not ground a Chinese paper', !c.includes('topic sentence'));

/* Ans Key wrote 'both' back when maths and science were the only subjects
   there were. It still means those two — and it must NOT quietly start
   grounding the two subjects that did not exist when it was written. */
ok("'both' still means maths and science", api.noteSubjects(bothNote).sort().join(',') === 'math,science');
api.meta = { level: '', subject: 'math' };
ok("a 'both' note grounds a maths paper", api.aiGrounding('answer').includes('legacy pairing'));
api.meta = { level: '', subject: 'science' };
ok("a 'both' note grounds a science paper", api.aiGrounding('answer').includes('legacy pairing'));
api.meta = { level: '', subject: 'english' };
ok("a 'both' note does NOT grow to cover English", !api.aiGrounding('answer').includes('legacy pairing'));

/* Every subject the picker offers has a standard to be held to, and the
   Chinese one must actually ask for Chinese. */
ok('all four subjects have a rule',
   ['science', 'math', 'english', 'chinese'].every(k => (api.SCAN_SUBJECT_RULE[k] || '').length > 80));
api.meta = { level: 'P5', subject: 'chinese' };
ok('a Chinese paper is answered in Chinese', /IN CHINESE/.test(api.scanSubjectRule()));
ok('the named subject is the only rule sent', !api.scanSubjectRule().includes('Mathematics:'));
api.meta = { level: 'P5', subject: '' };
const anyRule = api.scanSubjectRule();
ok('“Any subject” sends all four and lets the paper decide',
   ['Science:', 'Mathematics:', 'English:', 'Chinese'].every(k => anyRule.includes(k)));
ok('the batch prompt carries the subject standard', api._scanPrompt(2, 1, 4, '').includes('English:'));
ok('the batch prompt asks for marking AND answering',
   /mark it and write them feedback/.test(api._scanPrompt(1, 1, 1, '')));

/* ---------- The 'scan' kind: it answers AND marks in one call ----------
   The run writes the answer to every blank and marks everything already
   written, so its digest needs what answering needs PLUS the standard marking
   is held to. Grounding it as a plain 'answer' call would mark a whole paper
   without ever reading how this teacher marks. */
api.meta = { level: 'P5', subject: 'science' };
api.notes = [guideNote, sciNote];
api.style = { profileSamples: 42, profile: {
  styleRules: 'Full sentences, always name the process.',
  markingStandards: 'No mark without the keyword.',
  exemplars: [{ q: 'Why did the water level fall?', a: 'The water evaporated into water vapour.' }]
} };
const sc = api.aiGrounding('scan');
ok('the scan digest carries the key facts the answers need', sc.includes('Evaporation happens'));
ok('the scan digest carries the exemplars the answers need', sc.includes('evaporated into water vapour'));
ok('the scan digest carries the standard the marking is held to', sc.includes('No mark without the keyword'));
ok('the scan digest carries the marking standards from the notes', sc.includes('The process must be named'));
ok('the scan digest carries the standing guidance', sc.includes('it dries up'));
ok('the notes are consulted FIRST, before answering and before marking',
   /Consult the notes and the style FIRST/.test(sc));
ok('what a student wrote is not authority', /never evidence of anything/.test(sc));
api.notes = [];
api.style = null;
ok('no notes means no digest at all — the plain AI, exactly as before',
   api.aiGrounding('scan') === '');

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

/* ---------- Marking what the student already wrote ----------
   The whole feature turns on ONE distinction: something written is marked,
   nothing written is answered. Get it the wrong way round and an untouched
   worksheet comes back covered in crosses, which is the one mistake this
   feature can make and the one a screenshot would not obviously show. */
into = [];
api._scanFoldRows([row({
  studentAnswer: '1.4 kg', verdict: 'wrong', marks: '0/2',
  feedback: 'You added instead of subtracting — take the empty mass off the total.'
})], 0, 1, into);
ok('a written answer comes back marked', into[0].marked === true);
ok('what the student wrote is kept', into[0].studentAnswer === '1.4 kg');
ok('the verdict is kept', into[0].verdict === 'wrong');
ok('the marks are kept', into[0].marks === '0/2');
ok('the feedback is kept', /added instead of subtracting/.test(into[0].feedback));
ok('the correct answer still stands beside it', into[0].answer === 'A');

into = [];
api._scanFoldRows([row({})], 0, 1, into);
ok('a blank question is not marked', into[0].marked === false);
ok('a blank question carries no verdict', into[0].verdict === '');
ok('a blank question carries no feedback', into[0].feedback === '' && into[0].marks === '');

/* A verdict with nothing written behind it is a cross on an untouched
   question. Dropped, with the feedback that came with it. */
into = [];
api._scanFoldRows([row({ verdict: 'wrong', feedback: 'Careless.', marks: '0/2' })], 0, 1, into);
ok('a verdict with nothing written behind it is dropped',
   into[0].marked === false && into[0].verdict === '' && into[0].feedback === '' && into[0].marks === '');

/* Only the three verdicts the cards can colour. */
into = [];
api._scanFoldRows([
  row({ studentAnswer: 'x', verdict: 'CORRECT' }),
  row({ studentAnswer: 'y', verdict: 'almost' }),
  row({ studentAnswer: 'z', verdict: 'partial' })
], 0, 1, into);
ok('a verdict is read whatever case it comes back in', into[0].verdict === 'correct');
ok('an invented verdict is dropped, but the work is still shown as marked',
   into[1].verdict === '' && into[1].marked === true && into[1].studentAnswer === 'y');
ok('"partial" survives', into[2].verdict === 'partial');

/* A mixed page — the ordinary case — comes back mixed. */
into = [];
api._scanFoldRows([
  row({ number: '1', studentAnswer: '24', verdict: 'correct' }),
  row({ number: '2' }),
  row({ number: '3', studentAnswer: '9 cm', verdict: 'partial', feedback: 'Right number, wrong unit.' })
], 0, 1, into);
ok('a page of answers and blanks comes back as both',
   into.filter(x => x.marked).length === 2 && into.filter(x => !x.marked).length === 1);

/* A question that runs over the page is marked once, not half-marked twice. */
into = [{ number: '7', page: 2, endPage: 2, type: 'open', question: 'A tap fills a tank in',
         options: [], option: '', answer: '', explanation: '',
         marked: true, studentAnswer: '12 min', verdict: '', marks: '', feedback: '' }];
api._scanFoldRows([row({
  continuation: true, number: '7', page: 1, question: '12 minutes. How long for two taps?',
  answer: '6 minutes', studentAnswer: '12 min', verdict: 'wrong', feedback: 'Two taps are twice as fast.'
})], 2, 2, into);
ok('a continuation does not file the marking as a second question', into.length === 1);
ok('the verdict comes from the half that could see the whole question', into[0].verdict === 'wrong');
ok('the feedback comes with it', /twice as fast/.test(into[0].feedback));
ok('what the student wrote survives the fold', into[0].studentAnswer === '12 min');

/* The marking rule itself, pinned: it is what the model is actually told. */
ok('the model is told to mark every attempt and answer every blank',
   /mark every question that has been attempted and answer every/.test(api.SCAN_MARK_RULE));
ok('there are exactly three verdicts',
   /"correct", "partial" or "wrong"/.test(api.SCAN_MARK_RULE));
ok('the feedback is addressed to the student',
   /spoken TO THE STUDENT/.test(api.SCAN_MARK_RULE));
ok('marks are only claimed where the paper prints them',
   /EMPTY STRING when it does not/.test(api.SCAN_MARK_RULE));

/* ---------- Asking, in writing or out loud ----------
   Two ways in that have to meet in the same place: an instruction ALONGSIDE
   the pages, which governs what the run does with them, and an instruction
   with NO pages, which is the whole run. Both end in the same answer cards,
   so Copy, Print and the marking are the scan's and are not written twice. */
api.meta = { level: 'P5', subject: 'math' };
const withAsk = api._scanPrompt(2, 1, 4, '', 'Only question 5 please');
ok('what the student asked leads the prompt',
   withAsk.indexOf('Only question 5 please') >= 0 &&
   withAsk.indexOf('Only question 5 please') < withAsk.indexOf('ABOUT THE IMAGES'));
ok('the instruction is given authority over the sweep',
   /THEIR INSTRUCTION GOVERNS THIS RUN/.test(withAsk));
ok('naming questions really does narrow the run',
   /do THOSE and leave the rest out entirely/.test(withAsk));
ok('background is context, not an order to stop reading',
   /take it as context and carry on with every question/.test(withAsk));
ok('an instruction never stops the marking',
   /never let it stop you marking what has already been written/.test(withAsk));
ok('a page with a diagram and no printed question is still answerable',
   /pages hold no printed question at all/.test(withAsk));

/* No ask, no ask block: the ordinary scan is not paying for a section that
   says nothing, and it is not being told about an instruction it never got. */
const noAsk = api._scanPrompt(2, 1, 4, '');
ok('no instruction means no instruction block', !/THIS IS WHAT THE STUDENT ASKED/.test(noAsk));
ok('the ordinary scan is unchanged by the feature', /Find EVERY question printed/.test(noAsk));

/* Asked with nothing photographed. */
const alone = api._askPrompt('Give me five practice questions on fractions', 'full');
ok('the ask with no paper carries what was said', alone.includes('five practice questions on fractions'));
ok('it says plainly there is no paper', /Nothing was photographed/.test(alone));
ok('it still carries the subject standard', alone.includes('Mathematics:'));
ok('it still carries the explanation depth', alone.includes(api.SCAN_DETAIL_RULE.full));

ok('one thing asked comes back as one entry, several as several',
   /ONE ENTRY PER THING/.test(api.SCAN_ASK_SYS));
ok('a question asked in Chinese is answered in Chinese',
   /asked in Chinese is answered in Chinese/.test(api.SCAN_ASK_SYS));
ok('a school question is never turned away for having no picture',
   /never turn a school question away/i.test(api.SCAN_ASK_SYS));
ok('the ask can mark an answer the student typed themselves',
   /"correct", "partial" or "wrong"/.test(api.SCAN_ASK_SYS));
ok('but it never invents an answer of theirs to mark',
   /never invent an answer of\s+theirs in order to mark it/.test(api.SCAN_ASK_SYS));

/* The reply is filed as an ordinary answer card — with no page, because it
   never had one. */
let asked = [];
api._askFoldRows([
  { heading: 'Question 1', answer: '3/4', explanation: 'Add the numerators.' },
  { heading: '', answer: '', explanation: '' },
  null,
  { heading: 'Question 2', answer: '1/2', explanation: '' }
], asked);
ok('every part of the reply is its own card', asked.length === 2);
ok('a reply card knows it was never on a page',
   asked[0].kind === 'ask' && asked[0].page === 0);
ok('the heading becomes the question line', asked[0].question === 'Question 1');
ok('an empty part is dropped rather than filed as a blank card',
   asked.every(x => x.answer || x.explanation));

/* The blank-is-never-marked-wrong rule is ONE rule and holds on both paths. */
asked = [];
api._askFoldRows([
  { heading: 'Q', answer: '8', verdict: 'wrong', feedback: 'Careless.' },
  { heading: 'Q', answer: '8', studentAnswer: '16', verdict: 'wrong', feedback: 'You added.' }
], asked);
ok('a verdict with nothing of the student behind it is dropped here too',
   asked[0].marked === false && asked[0].verdict === '' && asked[0].feedback === '');
ok('an answer the student typed IS marked',
   asked[1].marked === true && asked[1].verdict === 'wrong' && asked[1].studentAnswer === '16');
ok('both paths read the marking through the same door',
   api._markFields({ studentAnswer: 'x', verdict: 'PARTIAL' }).verdict === 'partial' &&
   api._markFields({ verdict: 'wrong' }).marked === false);

/* Dictation is feature-detected, never assumed: node has no Web Speech API
   and neither does Firefox, and a 🎤 that does nothing is worse than none. */
ok('dictation is detected, not assumed', api.micAvailable() === false);
api.meta = { level: 'P5', subject: 'chinese' };
ok('the mic listens in the language of the paper', api.micLang() === 'zh-CN');
api.meta = { level: 'P5', subject: 'english' };
ok('and in English for everything else', api.micLang() === 'en-SG');
api.meta = { level: 'P5', subject: 'science' };

/* ---------- The prompt's promises ---------- */
ok('every question is answered, MCQ included', /Multiple-choice questions are NOT/.test(api.SCAN_SYS));
ok('a lettered part is its own entry', /ONE ENTRY PER LETTERED PART/.test(api.SCAN_SYS));
ok('the correct answer is worked out BEFORE what is written is even weighed',
   /work the correct answer out YOURSELF FIRST/.test(api.SCAN_SYS));
ok('a written answer never talks the app into agreeing with it',
   /never evidence of anything/.test(api.SCAN_SYS) && /never\s+changes to agree with what they wrote/.test(api.SCAN_SYS));
ok('what is written is marked, not ignored', /MARK WHAT IS ALREADY WRITTEN/.test(api.SCAN_SYS));
ok('a blank is answered rather than marked wrong',
   /A blank is not a wrong answer/.test(api.SCAN_SYS));
ok('a page holding both gets both', /A page may hold both/.test(api.SCAN_SYS));
ok('the marking fields are in the shape the model is given',
   ['studentAnswer', 'verdict', 'marks', 'feedback'].every(k => api.SCAN_SYS.includes('"' + k + '"')));
ok('a printed answer key is not mistaken for a pupil\'s work',
   /printed ANSWER KEY/.test(api.SCAN_SYS));
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

/* ---------- The notebook is LIVE ----------
   Pinned as source, because a one-shot read looks identical to a listener
   until the day somebody types a note in Ans Key mid-lesson: this tab would
   go on answering against the notebook as it stood at sign-in, and nothing
   anywhere would say so. */
ok('the notebook is watched, not fetched once', /notesCollRef\(owner\)\.onSnapshot\(/.test(html));
ok('the style profile Ans Key grows is watched too', /styleDocRef\(owner\)\.onSnapshot\(/.test(html));
ok('the listeners come down when the account changes',
   /stopTeachingNotes\(\);/.test(html.slice(html.indexOf('auth.onAuthStateChanged'), html.indexOf('auth.onAuthStateChanged') + 700)));
ok('a first-load waiter is released when the listeners go, never left hanging',
   /_notesPending/.test(html) && /waiting\.forEach/.test(html));
ok('a superseded attach stands down instead of racing', /_notesAttachSeq/.test(html));
/* The scan awaits the notes before it writes a word — that is what makes a
   note typed seconds earlier reach the very next answer. */
ok('the run waits for the notebook before answering',
   /await loadTeachingNotes\(false\);/.test(html));
/* A repaint must never eat what the admin is half way through typing. */
ok('a live repaint yields to whatever is being typed',
   /body\.contains\(document\.activeElement\)/.test(html));

/* The run is the ONE call that both answers and marks, so it is the one that
   must be grounded as 'scan'. Grounded as 'answer' it would mark a whole
   paper without ever being told how this teacher marks — and every card would
   still look perfectly right. */
ok("the run is grounded as a scan, not as a plain answer",
   /system: SCAN_SYS \+ aiGrounding\('scan'\),/.test(html));
ok('the marking reaches the screen',
   /class="youBox/.test(html) && /class="fbBox/.test(html) && /Correct answer/.test(html));
ok('a paper with nothing written on it says nothing about marks',
   /if \(!t\.marked\) \{[\s\S]{0,200}row\.innerHTML = '';/.test(html));
ok('Copy carries the marking, not just an answer key',
   /You wrote: /.test(html) && /Feedback: /.test(html));
ok('all four subjects are declared in ONE list',
   ['science', 'math', 'english', 'chinese'].every(v =>
     new RegExp("value: '" + v + "'").test(html.slice(html.indexOf('var SUBJECTS = ['), html.indexOf('var SUBJECT_OK')))));
ok('the subject picker is filled from that list, never hand-written',
   /fillSubjects/.test(html) && !/<option value="chinese"/.test(html));

/* The ask row is a row of its OWN. Grown into the camera bar it would make a
   fourth control on the one bar that is allowed exactly three. */
const dock = html.slice(html.indexOf('<div class="camDock'), html.indexOf('id="camDock"') + 4000);
ok('the ask row is inside the dock, above the camera bar',
   dock.indexOf('id="askBar"') >= 0 && dock.indexOf('id="askBar"') < dock.indexOf('id="camBar"'));
ok('the box takes typing and the 🎤 takes speech',
   /id="askText"/.test(dock) && /id="micBtn"/.test(dock));
ok('the 🎤 starts hidden and is only shown where it works',
   /id="micBtn"[^>]*hidden/.test(html) && /b\.hidden = !micAvailable\(\)/.test(html));
ok('the dock belongs to the Snap tab, exactly as the bar does',
   /camDock'\)\.classList\.toggle\('hidden', !on \|\| _tab !== 'snap'\)/.test(html));
ok('✓ is reachable with a question and no picture at all',
   /done\.disabled = _scanning \|\| \(!ready\.length && !ask\);/.test(html));
ok('a run with no pages takes the ask-alone path',
   /if \(shots\.length\) await _runPages\([\s\S]{0,120}else askErr = await _runAskAlone\(/.test(html));
ok('the ask-alone call is grounded too — the one door',
   /system: SCAN_ASK_SYS \+ aiGrounding\('scan'\),/.test(html));
ok('dictation is stopped before a run, and when the tab is left',
   /micStop\(\);/.test(html.slice(html.indexOf('async function runScan'), html.indexOf('async function runScan') + 1400)) &&
   /if \(_tab !== 'snap'\) \{ micStop\(\); camClose\(\); \}/.test(html));
ok('what was asked is said back above the answers',
   /renderAskedLine/.test(html) && /You asked: /.test(html));
ok('Copy carries what was asked', /Asked: /.test(html));

/* ---------- Three buttons, two tabs ----------
   The screen is the whole point of this app: a phone held over a worksheet,
   one thumb. Pinned so a later change cannot quietly grow a third tab or a
   fourth control back onto it. */
const camBar = html.slice(html.indexOf('<div class="camBar'), html.indexOf('</div>', html.indexOf('id="readBtn"')));
ok('the camera bar carries exactly three controls',
   (camBar.match(/<button/g) || []).length === 3, camBar.slice(0, 80));
ok('gallery on the left, shutter in the middle, done on the right',
   camBar.indexOf('id="galleryBtn"') < camBar.indexOf('id="cameraBtn"') &&
   camBar.indexOf('id="cameraBtn"') < camBar.indexOf('id="readBtn"'));
ok('the count rides on the gallery button', /id="shotBadge"/.test(camBar));
ok('✓ starts out of reach — there is nothing to read yet', /id="readBtn"[^>]*disabled/.test(camBar));
const tabBar = html.slice(html.indexOf('<nav class="tabs'), html.indexOf('</nav>'));
ok('there are exactly two tabs', (tabBar.match(/<button/g) || []).length === 2);
ok('and they are Snap and How to use', /data-tab="snap"/.test(tabBar) && /data-tab="how"/.test(tabBar));
ok('the camera bar belongs to the Snap tab alone',
   /camBar'\)\.classList\.toggle\('hidden', !on \|\| _tab !== 'snap'\)/.test(html));
ok('nothing but the settings survived on the snap screen',
   !/id="scanLevel"[\s\S]{0,400}id="scanPad"/.test(html) &&
   html.indexOf('id="scanLevel"') > html.indexOf('id="howPage"'));
/* The trap this app was built around, still pinned. */
ok('the picker is emptied before the files are queued',
   /input\.value = '';\s*\n\s*if \(files\.length\) addShots\(files\);/.test(html));

/* ---------- ✎ Editing an answer, and teaching it for next time ----------
   Both halves fail silently. A verdict written onto a blank puts a red cross
   on a question nobody attempted — by hand this time, which is no better —
   and a note that comes back with an empty `guidance` is a house rule the
   teacher believes they typed and that no app will ever read. */
const blank = { marked: false, studentAnswer: '', verdict: '', marks: '', feedback: '',
                answer: 'The peaches grow bigger.', explanation: 'Fewer fruits share the food.' };
api._ansEditApply(blank, { answer: 'The remaining peaches become larger.', explanation: 'Each gets more food.',
                           verdict: 'wrong', marks: '0/1', feedback: 'You are wrong.' });
ok('the answer is taken as typed', blank.answer === 'The remaining peaches become larger.');
ok('the explanation is taken as typed', blank.explanation === 'Each gets more food.');
ok('A BLANK CAN NEVER BE MARKED WRONG BY HAND EITHER', blank.verdict === '' && !blank.marks && !blank.feedback);
ok('an answer a person rewrote says so', blank.edited === true);

const marked = { marked: true, studentAnswer: '1.4', verdict: 'correct', marks: '1/1', feedback: 'Good.',
                 answer: '1.4', explanation: '' };
api._ansEditApply(marked, { answer: '4.1', explanation: 'Units.', verdict: 'wrong', marks: '0/1', feedback: 'Check the units.' });
ok('a marked question can be re-marked', marked.verdict === 'wrong' && marked.marks === '0/1');
ok('and its feedback rewritten', marked.feedback === 'Check the units.');
api._ansEditApply(marked, { answer: '4.1', explanation: 'Units.', verdict: 'brilliant', marks: '', feedback: '' });
ok('a verdict the app does not know is dropped, not shown', marked.verdict === '');

const same = { marked: false, answer: 'A', explanation: 'B', verdict: '', marks: '', feedback: '' };
api._ansEditApply(same, { answer: 'A', explanation: 'B' });
ok('opening the window and saving nothing does not brand the card edited', !same.edited);

ok('a worked answer keeps its LINES — _scanStr would have folded them into one',
   api._ansTrim('Step 1\nStep 2', 200) === 'Step 1\nStep 2');

/* The note. This is what makes the fix outlive the tab and reach the other
   two apps, so every field here is one of the three apps\' own. */
const ctx = { question: 'How would this affect the size of the remaining peaches?',
              answer: 'They become larger, because each receives more food.',
              subject: 'science', level: 'P5' };
ok('nothing typed and nothing ticked is not a note',
   api._ansEditNote({ rule: '', remember: false }, ctx) === null);
ok('a tick with no answer behind it is not a note either',
   api._ansEditNote({ rule: '', remember: true }, { question: 'Q', answer: '' }) === null);

const ruleOnly = api._ansEditNote({ rule: 'Always name the process.\nNever stop at "it grows".', remember: false }, ctx);
ok('the rule is the guidance, VERBATIM — the only field that reaches every kind',
   ruleOnly.guidance === 'Always name the process.\nNever stop at "it grows".');
ok('a rule alone teaches no key fact', ruleOnly.keyFacts === '');
ok('the title is the first line of the rule', ruleOnly.title === 'Always name the process.');
ok('the note is scoped to the paper being scanned',
   ruleOnly.subjects.join() === 'science' && ruleOnly.levels.join() === 'P5');
ok('topics is written EMPTY — it is the Portal\'s syllabus list, not this app\'s',
   Array.isArray(ruleOnly.topics) && !ruleOnly.topics.length);
ok('the note says which app wrote it', ruleOnly.source === 'scan');
ok('and what kind of note it is', ruleOnly.noteKind === 'correction');
ok('the question it was written against is kept for the reader',
   ruleOnly.sourceQuestion.indexOf('remaining peaches') !== -1);
ok('the shared fields are still written, empty',
   ruleOnly.markingStandards === '' && !ruleOnly.keywords.length && !ruleOnly.noteTopics.length);

const remembered = api._ansEditNote({ rule: '', remember: true }, ctx);
ok('the corrected answer is filed as a KEY FACT — never as guidance',
   !remembered.guidance && remembered.keyFacts.indexOf('each receives more food') !== -1);
ok('the key fact carries its question, or it means nothing on its own',
   remembered.keyFacts.indexOf('remaining peaches') !== -1);
ok('a note with no rule is still titled after the question',
   /^Corrected answer/.test(remembered.title));

const unknown = api._ansEditNote({ rule: 'x' }, { question: 'Q', answer: 'A', subject: 'geography', level: 'P9' });
ok('a subject this app does not teach scopes the note to nothing rather than inventing one',
   !unknown.subjects.length && !unknown.levels.length);

const mcq = { marked: false, type: 'mcq', option: '2', answer: '(2) It gets bigger.',
              options: [{ label: '1', text: 'a' }, { label: '2', text: 'b' }, { label: '3', text: 'c' }] };
api._ansEditApply(mcq, { answer: '(3) It gets smaller.' });
ok('correcting an MCQ moves the tick as well as the words', mcq.option === '3');
api._ansEditApply(mcq, { answer: 'It gets smaller.' });
ok('an answer naming no option leaves the tick where it was', mcq.option === '3');
const open2 = { marked: false, options: [], option: '', answer: '' };
api._ansEditApply(open2, { answer: '3 kg' });
ok('an open question never grows an option out of its own answer', open2.option === '');

/* The window itself. */
ok('every answer card carries the ✎', /onclick="answerEditOpen\(' \+ i \+ '\)"/.test(html));
/* The ✎ is the TEACHER'S. The window behind it is the second door into the
   shared notebook, and a student's own answer is the one thing that must never
   teach the teacher's notes — so it is not offered to anybody else, and the
   handler refuses as well, because `answerEditOpen` is on `window` for the
   rendered card's onclick and a hidden button is not a lock. */
ok('the ✎ is drawn for the teacher alone, and not while a run is still arriving',
   /if \(!_scanning && isAdmin\(currentUser\)\) \{\s*\n\s*head\.push\('<button class="ansEditBtn/.test(html));
ok('and the window itself refuses to open for anyone else',
   /if \(!it \|\| !isAdmin\(currentUser\)\) return;/.test(html));
ok('an account change closes the window and repaints the cards',
   /if \(\$\('ansEditModal'\)\) \$\('ansEditModal'\)\.classList\.remove\('open'\);/.test(html) &&
   /applyNotesVisibility\(\);[\s\S]{0,900}if \(_answers\.length\) renderAnswers\(\);/.test(html));
ok('the ✎ never prints — a printed key with a button on it is a button nobody can press',
   /class="ansEditBtn noPrint"/.test(html));
ok('the mark picker is hidden on a question nobody attempted',
   /\$\('aeMarkRow'\)\.style\.display = it\.marked \? '' : 'none';/.test(html));
ok('only the admin is offered the instruction box',
   /var teach = isAdmin\(currentUser\);\s*\n\s*\$\('aeTeach'\)\.style\.display = teach/.test(html));
ok('the note goes to the SHARED notebook, the same door every other note uses',
   /notesCollRef\(currentUser\.uid\)\.doc\(id\)\.set\(note\);/.test(html.slice(html.indexOf('async function answerEditSave'))));
ok('the card is fixed even when the note cannot be saved',
   html.indexOf('_ansEditApply(it, {') < html.indexOf('var note = isAdmin(currentUser)'));

/* ---------- 📋 The report on the whole script ----------
   Everything here fails silently and the card still renders beautifully. A
   score counted the wrong way is a number on a page a parent reads, with the
   chips directly above it saying something else; a blank folded into the
   denominator marks a child down for the questions they never reached; and a
   question reference the model invented points them at nothing. */
function pageQ(number, verdict, marks, studentAnswer) {
  return {
    kind: 'page', number, question: 'Question ' + number, answer: '42', option: '',
    options: [], explanation: '',
    marked: !!studentAnswer, studentAnswer: studentAnswer || '',
    verdict: studentAnswer ? (verdict || '') : '',
    marks: studentAnswer ? (marks || '') : '',
    feedback: studentAnswer ? 'a line of feedback' : ''
  };
}
const blankQ = n => pageQ(n, '', '', '');

/* The paper's own marks, read out of a free-text field the model wrote. */
ok('"2/3" is read as two numbers', (() => {
  const m = api._reportMarkStr('2/3');
  return m && m.awarded === 2 && m.total === 3;
})());
ok('a decimal mark is read', (() => { const m = api._reportMarkStr(' 2.5 / 4 '); return m && m.awarded === 2.5; })());
ok('"3 marks" is not a mark allocation this can add up', api._reportMarkStr('3 marks') === null);
ok('an empty allocation reads as none', api._reportMarkStr('') === null);
ok('more awarded than the question is worth is refused', api._reportMarkStr('4/3') === null);
ok('out of nothing is refused', api._reportMarkStr('0/0') === null);

/* The score. Counted here, from the verdicts already on the cards. */
const paper = [
  pageQ('1', 'correct', '', '12'),
  pageQ('2', 'wrong', '', '9'),
  pageQ('3', 'partial', '', 'half of it'),
  blankQ('4'), blankQ('5')
];
let rsc = api.reportScore(paper);
ok('a blank is never counted as wrong', rsc.wrong === 1 && rsc.blank === 2);
ok('a blank is out of the percentage altogether', rsc.judged === 3);
ok('a partly right answer is worth half', rsc.credit === 1.5 && rsc.pct === 50);
ok('the questions attempted are counted', rsc.attempted === 3 && rsc.total === 5);

/* The paper's own marks are only used when EVERY judged question printed one:
   half a paper's marks totalled as if they were all of it is simply a wrong
   score, and it reads exactly like a right one. */
rsc = api.reportScore([pageQ('1', 'correct', '3/3', 'x'), pageQ('2', 'partial', '1/4', 'y')]);
ok('the paper\'s own marks are used when every question prints one', rsc.marksUsable === true);
ok('…and they are what the percentage comes from', rsc.awarded === 4 && rsc.outOf === 7 && rsc.pct === 57);
rsc = api.reportScore([pageQ('1', 'correct', '3/3', 'x'), pageQ('2', 'wrong', '', 'y')]);
ok('marks printed on only SOME questions are not totalled as the score', rsc.marksUsable === false);
ok('…and it falls back to counting questions', rsc.pct === 50);

/* A written answer the model would not judge. Counting it wrong marks the
   student down for the model's indecision; counting it right is a mark they
   did not earn. */
rsc = api.reportScore([pageQ('1', 'correct', '', 'x'), pageQ('2', '', '', 'y')]);
ok('an answer with no verdict still counts as attempted', rsc.attempted === 2 && rsc.unjudged === 1);
ok('…and is left out of the percentage rather than counted wrong', rsc.judged === 1 && rsc.pct === 100);
ok('…and the card says so', /left out of it rather than counted against you/.test(api.reportBasisText(rsc)));
ok('a paper with nothing judged has no percentage', api.reportScore([blankQ('1')]).pct === null);
ok('nothing attempted says nothing at all', api.reportCountsText(api.reportScore([blankQ('1')])) === '');
ok('the blanks are named as answered, never as mistakes',
   /were blank and have been answered for you/.test(api.reportCountsText(api.reportScore(paper))));
ok('the basis of the percentage is said out loud',
   /counted a question at a time/.test(api.reportBasisText(api.reportScore(paper))) &&
   /marks the paper itself prints/.test(api.reportBasisText(api.reportScore(
     [pageQ('1', 'correct', '3/3', 'x')]))));

/* Who gets one. A report is written about a marked SCRIPT. */
ok('a fresh worksheet gets no report', api.reportEligible([blankQ('1'), blankQ('2')]) === false);
ok('one marked question is the feedback card again, not a report',
   api.reportEligible([pageQ('1', 'correct', '', 'x'), blankQ('2')]) === false);
ok('two marked questions is a script', api.reportEligible(paper) === true);
ok('an answer to a typed question is not a script',
   api.reportEligible([{ kind: 'ask', marked: true, studentAnswer: '16' },
                       { kind: 'ask', marked: true, studentAnswer: '9' }]) === false);
ok('the minimum is a named constant', api.REPORT_MIN_MARKED === 2);

/* The prompt. The verdicts are final, the blanks stay out of it, and the
   model is forbidden the one thing that could contradict the card above it. */
const rp = api._reportPrompt(paper, api.reportScore(paper));
ok('the prompt carries what the student wrote', rp.includes('half of it'));
ok('the prompt carries the verdict already given', rp.includes('marked: partial'));
ok('the prompt carries the correct answer', rp.includes('the correct answer: 42'));
ok('a blank question is never listed', !rp.includes('Question 4'));
ok('…but the blanks are named as not-mistakes', /left BLANK/.test(rp) && /not mistakes/.test(rp));
ok('the paper is described', rp.includes('P5 Science'));
ok('the model is told never to give a score',
   /NEVER GIVE A SCORE, A TOTAL, A MARK OR A PERCENTAGE/.test(api.REPORT_SYS));
ok('the model is told never to re-mark', /NEVER RE-MARK ANYTHING/.test(api.REPORT_SYS));
ok('the model is told to group by theme, not walk the questions',
   /never question by question/.test(api.REPORT_SYS));
ok('a blank is never a mistake in the report either',
   /is not\s+a mistake/.test(api.REPORT_SYS.replace(/\s+/g, ' ')));
/* The report is written ABOUT marking, so it is held to the marking standard
   and deliberately not handed the exemplar answers — the one-door rule. */
ok('the report call is grounded', /system: REPORT_SYS \+ aiGrounding\('mark'\)/.test(html));
ok('the pictures are not sent again', !/images:/.test(report));

/* The reply. */
const words = api._reportNew({
  headline: 'A solid paper.',
  strengths: ['You set the working out clearly.', '', '  '],
  gaps: [{ title: 'Units', detail: 'You are adding before converting.', questions: 'Q2, 3 and 99' },
         { title: '', detail: '' }],
  next: ['Ten conversion drills.']
}, paper);
ok('the headline comes back', words.headline === 'A solid paper.');
ok('an empty strength is dropped', words.strengths.length === 1);
ok('a gap with nothing in it is dropped', words.gaps.length === 1);
ok('a question the model invented is dropped', words.gaps[0].questions.join(',') === '2,3');
ok('the report knows when nothing came back', api._reportNew({}, paper).empty === true);
ok('…and a report with only a headline is not empty',
   api._reportNew({ headline: 'Well done.' }, paper).empty === false);
ok('the lists are capped', api._reportNew(
  { next: ['a', 'b', 'c', 'd', 'e', 'f'] }, paper).next.length === api.REPORT_MAX_LIST);
ok('the themes are capped', api._reportNew(
  { gaps: [1, 2, 3, 4, 5, 6].map(n => ({ title: 't' + n, detail: 'd' })) },
  paper).gaps.length === api.REPORT_MAX_GAPS);
/* "7(a)", "7a" and "(7a)" are one question written three ways. */
ok('a question reference is matched however it is written',
   api._reportRefs('question 7a, (3)', [pageQ('7(a)', 'wrong', '', 'x'), pageQ('3', 'wrong', '', 'y')])
     .join(',') === '7(a),3');

/* It leaves with the paper. */
api.answers = paper;
api.report = { run: 1, status: 'done', score: api.reportScore(paper), words, err: '' };
const rtxt = api.reportAsText();
ok('the copied report carries the score', rtxt.includes('50%'));
ok('the copied report carries the words', rtxt.includes('A solid paper.') && rtxt.includes('Units'));
ok('the report is copied out with the answers', /var rep = reportAsText\(\);/.test(html));
ok('the report card is not in the noPrint header', html.indexOf('id="reportWrap"') > html.indexOf('</div>\n      <!-- 📋'));
ok('the report card prints', /\.reportCard \{ break-inside: avoid/.test(html));
/* A failed call still leaves a real report: the score was never the model's. */
api.report = { run: 1, status: 'failed', score: api.reportScore(paper), words: null, err: 'no network' };
ok('a failed report still shows the score', api.reportAsText().includes('50%'));
ok('…and says the words are the part that failed',
   /could not be written/.test(api.reportCardHtml()) && api.reportCardHtml().includes('50%'));
api.report = null;
ok('no report is no text', api.reportAsText() === '' && api.reportCardHtml() === '');

/* It runs itself, once the whole paper has been read, and a reply that
   arrives after the teacher has started again is dropped. */
ok('the report is written after the run, not during it',
   /await runReport\(run\);/.test(html) &&
   html.indexOf('await runReport(run);') > html.indexOf('async function runScan'));
ok('last paper\'s report never outlives its paper', /_report = null; +\/\/ last paper/.test(html));
ok('a stale report is dropped', (report.match(/if \(run !== _scanRun\) return;/g) || []).length >= 2);

/* ---------- 📷 The live viewfinder ----------
   A camera that stays open is worth having only if it can also NOT be there:
   a shutter that does nothing on a browser without getUserMedia, or a camera
   left running after the overlay closes, are both worse than the phone's own
   camera app that this replaced. */
ok('the page camera is feature-detected, never assumed',
   /function camAvailable\(\)[\s\S]{0,220}navigator\.mediaDevices/.test(html) &&
   /navigator\.mediaDevices\.getUserMedia/.test(html));
ok('no camera of our own falls back to the phone’s camera app',
   /if \(!camAvailable\(\)\) \{ \$\('cameraInput'\)\.click\(\); return; \}/.test(html));
ok('a refused permission falls back too, rather than a shutter that does nothing',
   /catch \(err\) \{[\s\S]{0,420}\$\('cameraInput'\)\.click\(\);/.test(html));
ok('facingMode is asked for as `ideal`, so a laptop with one camera still gets it',
   /facingMode: \{ ideal: 'environment' \}/.test(html));
ok('closing the camera stops every track',
   /_camStream\.getTracks\(\)\.forEach\(function \(t\) \{ try \{ t\.stop\(\); \}/.test(html));
ok('leaving the Snap tab closes the camera', /if \(_tab !== 'snap'\) \{ micStop\(\); camClose\(\); \}/.test(html));
ok('Escape closes the camera before anything else',
   /if \(camIsOpen\(\)\) \{ camCancel\(\); return; \}/.test(html));
ok('Cancel asks BEFORE the stream is dropped, so “no” costs nothing',
   /function camCancel[\s\S]{0,320}if \(taken > 0 && !confirm\([\s\S]{0,120}\) return;[\s\S]{0,90}camClose\(\);/.test(html));
ok('Cancel only ever drops the photos taken in THIS visit',
   /_shots = _shots\.slice\(0, _camShotsAtOpen\);/.test(html));
/* The ONE queue. A frame off the viewfinder must be prepared exactly as a
   gallery picture is, or the shrinking, the page numbering and the failed
   card rule are all written twice. */
ok('the shutter goes through addShots like every other picture',
   /function camSnap[\s\S]{0,1400}await addShots\(\[file\]\);/.test(html));
ok('a frame is encoded as JPEG, never PNG',
   /c\.toBlob\(res, 'image\/jpeg', SCAN_JPEG_Q\)/.test(html));
ok('a frame is capped at the same size a gallery photo is shrunk to',
   /Math\.min\(1, SCAN_PHOTO_MAX_SIDE \/ Math\.max\(w, h\)\)/.test(html));
ok('the shutter cannot run past the page ceiling',
   /if \(_shots\.length >= SCAN_MAX_SHOTS\)/.test(html.slice(html.indexOf('async function camSnap'))));
ok('one painter keeps the strip in step with the pages',
   /renderCamBar\(\);\s*\n\s*if \(camIsOpen\(\)\) camRenderStrip\(\);/.test(html));

/* ---------- 📕 The mistake book ----------
   THE COLLECTION NAME IS THE ONE THAT CANNOT SLIP. `users/{uid}/mistakes` is
   the Science portal's own log, under this same project and this same uid, so
   a book called `mistakes` here is two apps quietly sharing one collection —
   the exact fault the whole family's naming rule exists for, and one that
   throws nothing and looks like nothing on either screen. */
ok('the book is NOT the cer app’s `mistakes` collection', api.MB_COL === 'scanMistakes');
ok('the papers are not a shared name either', api.MB_PAPER_COL === 'scanPapers');
ok('the pictures are in this app’s own Storage folder', api.MB_IMG_PATH === 'scan-mistakes');
ok('every path is built from those constants, never spelled out',
   !/collection\('mistakes'\)/.test(html) && !/collection\("mistakes"\)/.test(html));
ok('the book is read from the signed-in account’s OWN subtree',
   /db\.collection\('users'\)\.doc\(currentUser\.uid\)\.collection\(MB_COL\)/.test(html));

/* What is a mistake. The blank rule the marking and the report are both built
   on has to hold here too — a question nobody attempted is not one they got
   wrong, and filing it would put a child's untouched worksheet in their own
   mistake book. */
const wrongQ   = { kind: 'page', marked: true, verdict: 'wrong',   question: 'What is 2 + 2?' };
const partialQ = { kind: 'page', marked: true, verdict: 'partial', question: 'Name the process.' };
const rightQ   = { kind: 'page', marked: true, verdict: 'correct', question: 'What is 3 + 3?' };
const blankQ2  = { kind: 'page', marked: false, verdict: '',       question: 'Untouched.' };
const askQ     = { kind: 'ask',  marked: true, verdict: 'wrong',   question: 'I got 16?' };
ok('a wrong answer is a mistake', api.mbIsWrong(wrongQ) === true);
ok('a partly right answer is a mistake too', api.mbIsWrong(partialQ) === true);
ok('a correct answer is not', api.mbIsWrong(rightQ) === false);
ok('a BLANK is never a mistake', api.mbIsWrong(blankQ2) === false);
ok('an answer to a typed question was never on a paper', api.mbIsWrong(askQ) === false);

/* The same question scanned twice is ONE mistake. */
ok('the key folds the wording',
   api.mbKeyOf({ question: 'What is  2 + 2?' }) === api.mbKeyOf({ question: 'What is 2+2?' }));
ok('two different questions are two mistakes',
   api.mbKeyOf(wrongQ) !== api.mbKeyOf(partialQ));
api.mistakes = [{ id: 'm1', key: api.mbKeyOf(wrongQ) }];
ok('a question already in the book is not filed twice', api.mbHasKey(api.mbKeyOf(wrongQ)) === true);
ok('…and one that is not is', api.mbHasKey(api.mbKeyOf(partialQ)) === false);
api.mistakes = [];

/* The rectangle round the figure. Wrong in either direction it is silent: too
   loose and the mistake keeps a crop of a neighbouring question, too tight and
   a question that needs its diagram loses it. */
ok('a good rectangle is taken', api._mbBoxOk([100, 100, 500, 600]) === true);
ok('no rectangle at all is fine', api._mbBoxOk(undefined) === false && api._mbBoxOk(null) === false);
ok('a malformed rectangle is refused', api._mbBoxOk([1, 2, 3]) === false && api._mbBoxOk('1,2,3,4') === false);
ok('a rectangle off the page is refused', api._mbBoxOk([0, 0, 1200, 500]) === false);
ok('a minute rectangle is refused', api._mbBoxOk([100, 100, 110, 110]) === false);
ok('a rectangle that is the WHOLE page is refused — that selection failed',
   api._mbBoxOk([10, 10, 990, 990]) === false);
ok('a full-width band that is not full-height is kept — a wide figure is a figure',
   api._mbBoxOk([300, 5, 620, 995]) === true);
ok('the box is normalised the moment it arrives, not at crop time',
   /box: _mbBoxOk\(r\.diagramBox\) \? r\.diagramBox\.map\(Number\) : null/.test(html));

/* ---- The WHOLE QUESTION, cut out of the student's own photograph ----
   A question rebuilt from a transcription is only as good as the OCR, and a
   maths or science question is layout as much as words. So what the student
   gets back is the printed question itself. Every way this goes wrong is
   silent on the page: the wrong rectangle keeps a neighbouring question, a
   question filed as a figure prints its wording twice, and a figure filed as
   a question prints a diagram with nothing asking anything. */
ok('a whole question MAY fill the page — an OEQ with a big diagram really does',
   api._mbBoxOk([10, 10, 990, 990], true) === true);
ok('…while the same rectangle is still refused for a FIGURE',
   api._mbBoxOk([10, 10, 990, 990]) === false);
ok('a question box is still checked for shape and size',
   api._mbBoxOk([1, 2, 3], true) === false && api._mbBoxOk([100, 100, 110, 110], true) === false
   && api._mbBoxOk([0, 0, 1200, 500], true) === false);
ok('the question rectangle is normalised on arrival too, and as a WHOLE box',
   /qbox: _mbBoxOk\(r\.questionBox, true\) \? r\.questionBox\.map\(Number\) : null/.test(html));
ok('the prompt asks for the whole question — number, wording, options and answer space',
   /round THE WHOLE QUESTION exactly as it is printed/.test(html)
   && /every option, any figure or table that belongs to it, and the ruled space left for the answer/.test(html));
ok('…and tells it to leave the neighbours and the desk outside',
   /leave the NEIGHBOURING questions[\s\S]{0,140}a hand, a desk, a shadow — outside it/.test(html));
ok('the crop PREFERS the whole question and falls back to the figure',
   /if \(whole\) return \{ url: whole, kind: 'question' \};/.test(html)
   && /return fig \? \{ url: fig, kind: 'figure' \} : null;/.test(html));
ok('a stitched question crops its QUESTION box from the page it was drawn on',
   /_mbShotForPage\(it\.qboxPage \|\| it\.page\)/.test(html)
   && /if \(it\.qbox && !prev\.qbox\) \{ prev\.qbox = it\.qbox; prev\.qboxPage = it\.page; \}/.test(html));
/* WHICH of the two a picture is cannot be guessed later: the worksheet lays
   them out completely differently. */
ok('which kind of picture it is travels with it, onto the mistake…',
   /shot: shot,/.test(html));
ok('…and onto the worksheet, defaulting to the figure an old paper really holds',
   /shot: m\.shot \|\| 'figure'/.test(html));
ok('a whole question keeps more pixels than a figure — it is read, not glanced at',
   /whole \? MB_QCROP_MAX_SIDE : MB_CROP_MAX_SIDE/.test(html));
ok('the prompt asks for the rectangle only where there IS a figure',
   /OMIT "diagramBox" entirely for a question that is only words/.test(html));
ok('the rectangle uses the same 0–1000 convention the portal’s readers use',
   /\[ymin, xmin, ymax, xmax\], four integers from 0 to 1000/.test(html));

/* The page a crop is cut from. The page numbers count only the pictures that
   were SENT, so a picture that could not be opened must not shift them. */
api.shots = [{ data: 'a', url: 'a' }, { data: '', url: '' }, { data: 'c', url: 'c' }];
ok('page 2 is the second picture actually sent, not the second in the list',
   api._mbShotForPage(2) && api._mbShotForPage(2).data === 'c');
ok('a page that is not there returns nothing rather than the wrong page',
   api._mbShotForPage(9) === null && api._mbShotForPage(0) === null);
ok('a stitched question crops from the page its rectangle was drawn on',
   /_mbShotForPage\(it\.boxPage \|\| it\.page\)/.test(html));
api.shots = [];

/* A crop that fails must cost the DIAGRAM and never the mistake. */
ok('the document is written even when the picture could not be kept',
   /catch \(e\) \{\s*\n\s*console\.warn\('mistake picture upload failed', e\);\s*\n\s*imgNote =/.test(html));
ok('…and the card says the diagram is missing rather than just losing it',
   /imgNote/.test(html) && /the diagram could not be kept/.test(html));
ok('a Storage that is not there is survivable', /if \(!storage \|\| !dataUrl\) return '';/.test(html));

/* The worksheet. */
const mk = (n, extra) => Object.assign({
  id: 'm' + n, key: 'k' + n, at: '2026-08-20T00:00:00.000Z', subject: 'science', level: 'P5',
  number: String(n), question: 'Q' + n, options: [], option: '', type: 'open',
  answer: 'A' + n, explanation: 'because', studentAnswer: 'wrong thing', verdict: 'wrong',
  marks: '', feedback: 'look at the units', img: 'https://x/i' + n + '.jpg', imgNote: ''
}, extra || {});
const picked = [mk(1), mk(2)];
const pdoc = api._mbPaperDoc(picked);
ok('the paper belongs to the account that made it', pdoc.owner === 'admin1');
ok('the questions are numbered from 1 on the new sheet', pdoc.items[0].n === 1 && pdoc.items[1].n === 2);
/* Unlike a question sent to a vetting list, the child's own answer TRAVELS —
   this paper is coming back to the child it belongs to, not going into a bank
   thirty other children practise from. */
ok('the student’s own answer travels with their own paper',
   pdoc.items[0].studentAnswer === 'wrong thing' && pdoc.items[0].feedback === 'look at the units');
ok('the photographed crop travels', pdoc.items[0].img === 'https://x/i1.jpg');
ok('the cleaned-up picture starts empty — the viewer makes it', pdoc.items[0].cleanImg === '');
ok('the cleaned-up version is what opens first', pdoc.mode === 'clean');
ok('the paper says where it came from', pdoc.source === api.VET_SOURCE && pdoc.source === 'scan');
ok('a paper expires', (() => {
  const days = (Date.parse(pdoc.expiresAt) - Date.parse(pdoc.createdAt)) / 86400000;
  return Math.round(days) === api.MB_PAPER_DAYS;
})());
ok('the title names the paper rather than being blank',
   /P5 Science/.test(api._mbPaperTitle(picked)));
ok('a paper with no subject or level still gets a title',
   api._mbPaperTitle([mk(1, { subject: '', level: '' })].map(m => m)).length > 0);

/* The link. It has to be absolute to survive an email, and relative in the
   source or it stops working the day the centre moves to its own domain. */
const url = api._mbPaperUrl('abc123');
ok('the link is absolute', /^https:\/\//.test(url));
ok('the link points at the Portal’s standalone page',
   url === 'https://polymathlc.github.io/cer/mistakes.html?p=abc123');
ok('the path in the source is RELATIVE, so a new domain needs no edit',
   api.MB_VIEWER_PATH === '../cer/mistakes.html' && !/https?:\/\/polymathlc\.github\.io/.test(html));
ok('the id is escaped into the link', /encodeURIComponent\(id\)/.test(html));

/* The email. Written in the shape the Firebase extension reads — and never
   announced as sent when it could not even be queued. */
const mail = api._mbMailDoc('kid@example.com', url, picked);
ok('the mail document is the extension’s shape',
   Array.isArray(mail.to) && mail.to[0] === 'kid@example.com' &&
   typeof mail.message.subject === 'string' && typeof mail.message.text === 'string' &&
   typeof mail.message.html === 'string');
ok('the email carries the link', mail.message.text.includes(url) && mail.message.html.includes(url));
ok('the mail collection is the extension’s', api.MB_MAIL_COL === 'mail');
ok('a queue that failed is reported, never claimed as sent',
   /catch \(e\) \{ console\.warn\('mail queue failed', e\); \}/.test(html) &&
   /The email could not be sent from this device/.test(html));
ok('the link is ALWAYS on screen, whatever happened to the email',
   /function mbShowLink[\s\S]{0,1200}mbCopyLink\(\)/.test(html));

/* It is the student's own, and it says so. */
ok('the book is filed once the paper has been read',
   /await mbFileRun\(run\);/.test(html) &&
   html.indexOf('await mbFileRun(run);') > html.indexOf('async function runScan'));
ok('how many went in is said out loud',
   /new mistake' \+ \(added === 1 \? '' : 's'\) \+ ' kept/.test(html));
ok('an account change drops the last account’s book',
   /mbForget\(\);/.test(html) && /stopTeachingNotes\(\);[\s\S]{0,200}mbForget\(\);/.test(html));
ok('the chip is never drawn on a blank, and never on a typed answer',
   /function mbCardChipHtml[\s\S]{0,260}it\.kind !== 'page'/.test(html) &&
   /function mbCardChipHtml[\s\S]{0,1400}if \(!mbIsWrong\(it\)\) return '';/.test(html));
ok('the chip never prints', /class="ansSend noPrint"/.test(html));
ok('a worksheet is capped', api.MB_PAPER_MAX >= 5 && /n > MB_PAPER_MAX/.test(html));

/* ---------- ✓✓ Clearing a question out of the book ----------
   The book fills itself, so it has to empty itself, and the loop closes by
   photographing the finished worksheet back in. Everything here is silent
   when it goes wrong: a streak that does not reset is "right twice EVER",
   which empties the book of questions the student still cannot do; a match
   that is too eager deletes the wrong question on somebody else's right
   answer; and a blank that resets a streak quietly punishes skipping one. */
ok('two in a row is the rule, and it is a named constant', api.MB_CLEAR_WINS === 2);
ok('a fully correct answer is a win', api.mbIsRight(rightQ) === true);
ok('PARTLY right is not a win — it is an attempt that was not right',
   api.mbIsRight(partialQ) === false && api.mbIsWrong(partialQ) === true);
ok('a blank is neither', api.mbIsRight(blankQ2) === false && api.mbIsWrong(blankQ2) === false);
ok('an answer to a typed question is neither', api.mbIsRight(askQ) === false);
ok('a new mistake starts with no streak', /streak: 0 {17}\/\/ right MB_CLEAR_WINS times/.test(html));

/* The reset is what makes it "in a row" rather than "twice ever". */
ok('a right answer moves the streak on',
   /var streak = \(Number\(entry\.streak\) \| \| 0\) \+ 1;|var streak = \(Number\(entry\.streak\) \|\| 0\) \+ 1;/.test(html));
ok('the second one CLEARS it', /if \(streak >= MB_CLEAR_WINS\) \{[\s\S]{0,240}\.delete\(\)/.test(html));
ok('an attempted miss puts the streak back to nought',
   /async function mbNoteMiss[\s\S]{0,400}update\(\{ streak: 0/.test(html));
ok('…and a miss on a question with no streak writes nothing at all',
   /if \(!\(Number\(entry\.streak\) \|\| 0\)\) return '';/.test(html));
/* A blank must reach neither branch: the pass skips an unmarked answer before
   it ever looks the question up. */
ok('a blank never touches the streak',
   /if \(!it \|\| it\.kind !== 'page' \|\| !it\.marked\) continue; {3}\/\/ a blank changes nothing/.test(html));
/* One attempt is one attempt, however many times the page was photographed. */
ok('the same question twice on one paper is scored ONCE',
   /if \(!key \|\| seen\[key\]\) continue;\s*\n\s*seen\[key\] = 1;/.test(html));
ok('there is ONE pass over the run, not one per outcome',
   (html.match(/async function mbFileRun\(/g) || []).length === 1 &&
   /async function mbFileRun[\s\S]{0,1800}else if \(mbIsWrong\(it\)\) \{\s*\n\s*if \(await mbSaveOne\(it\)\)/.test(html));

/* Matching the re-done question back to the one in the book. Failing to match
   costs nothing; matching the WRONG one destroys a mistake the student still
   has, so the fallback must be unique or it must not fire. */
const longA = 'a beaker of water is heated over a bunsen burner until it boils and steam rises from the surface';
const longB = 'a beaker of water is heated over a bunsen burner until it boils and bubbles form at the bottom';
api.mistakes = [
  { id: 'x1', key: api.mbKeyOf({ question: longA }) },
  { id: 'x2', key: api.mbKeyOf({ question: 'what is 2 + 2' }) }
];
ok('an exact key matches', api.mbFindByKey(api.mbKeyOf({ question: 'What is 2 + 2?' })).id === 'x2');
ok('a re-read that lost a word still matches on a long unique prefix',
   (api.mbFindByKey(api.mbKeyOf({ question: longA + ' quickly' })) || {}).id === 'x1');
ok('nothing at all matches nothing', api.mbFindByKey('') === null && api.mbFindByKey(null) === null);
ok('a SHORT key never matches on the prefix — it is not evidence',
   api.mbFindByKey('what is 2') === null);
api.mistakes = [
  { id: 'y1', key: api.mbKeyOf({ question: longA }) },
  { id: 'y2', key: api.mbKeyOf({ question: longB }) }
];
ok('two questions sharing the prefix match NEITHER, rather than one of them',
   api.mbFindByKey(api.mbKeyOf({ question: longA.slice(0, 80) + ' something else' })) === null);
ok('…but an exact key still wins even when a prefix is shared',
   api.mbFindByKey(api.mbKeyOf({ question: longB })).id === 'y2');
api.mistakes = [];

/* It has to SAY what it did — a question that vanishes with nothing on screen
   is the one outcome that makes a student distrust the book. */
ok('the run says what it cleared', /cleared — right/.test(html) && /times in a row/.test(html));
ok('a question one away from clearing says so', /one more right answer from clearing/.test(html));
ok('the card can report a question that is no longer there to look up',
   /var _mbRunNews = \{\};/.test(html) &&
   /if \(news === 'cleared'\)/.test(html));
ok('the card counts the streak out for the student', /Right ' \+[\s\S]{0,60}' of ' \+ MB_CLEAR_WINS/.test(html));
ok('a reset says the streak went back, rather than nothing', /Back to the start/.test(html));
ok('the book row shows progress only once there IS progress',
   /if \(streak > 0\) \{/.test(html) && /right ' \+ streak \+ ' of ' \+ MB_CLEAR_WINS \+ ' in a row/.test(html));

/* ---------- 📥 Sending a scanned question to a vetting list ----------
   Four portals, two question SHAPES, and one field — `source` — that decides
   whether the card lands purple and says where it came from. Every failure
   here happens in an app this one cannot see: the write goes through, the
   card appears, and it is simply wrong. */

const mcqItem = {
  kind: 'page', number: '7', page: 1, endPage: 1, type: 'mcq',
  question: 'Which of these is a good conductor of heat?\nTick one.',
  options: [
    { label: '1', text: 'Wood' }, { label: '2', text: 'Plastic' },
    { label: '3', text: 'Copper' }, { label: '4', text: 'Rubber' }
  ],
  option: '(3)', answer: 'Copper', explanation: 'Metals conduct heat well.',
  marked: true, studentAnswer: 'Wood', verdict: 'wrong',
  marks: '0/1', feedback: 'Wood is an insulator — look for the metal.'
};
const openItem = {
  kind: 'page', number: '8', page: 2, endPage: 2, type: 'open',
  question: 'Explain why the water level fell.',
  options: [], option: '',
  answer: 'The water evaporated into water vapour.',
  explanation: 'Evaporation happens at all temperatures.',
  marked: false, studentAnswer: '', verdict: '', marks: '', feedback: ''
};

ok('there is one row per portal', api.VET_TARGETS.length === 4);
ok('every subject the app teaches has a portal to send to',
   ['science', 'math', 'english', 'chinese'].every(k => !!api.vetTarget(k)));
ok('each row names the collection that portal really reads',
   api.vetTarget('science').col === 'vetting' &&
   api.vetTarget('math').col === 'mathVetting' &&
   api.vetTarget('english').col === 'vettingEn' &&
   api.vetTarget('chinese').col === 'vettingZh');
/* Science, English and Chinese are one lineage and one shape; Maths is not,
   and a portal-shaped document written there is a question with no answer. */
ok('the three portal apps share a builder and Maths has its own',
   api.vetTarget('science').build === api.vetTarget('english').build &&
   api.vetTarget('english').build === api.vetTarget('chinese').build &&
   api.vetTarget('math').build !== api.vetTarget('science').build);

const pMcq = api._vetPortalDoc(mcqItem);
const pOpen = api._vetPortalDoc(openItem);
const mMcq = api._vetMathDoc(mcqItem);
const mOpen = api._vetMathDoc(openItem);

ok('a scanned question SAYS it was scanned', pMcq.source === api.VET_SOURCE && mMcq.source === api.VET_SOURCE);
ok("…and the field is spelled 'scan' — the four portals read that one word",
   api.VET_SOURCE === 'scan');
ok('it names the app it came from', /Scan/.test(pMcq.sourceApp) && /Scan/.test(mMcq.sourceApp));
ok('it lands in VETTING, waiting', pMcq.status === 'pending');

/* The question, the options, the answer and why — and nothing of the child's. */
const pText = JSON.stringify(pMcq) + JSON.stringify(pOpen) + JSON.stringify(mMcq) + JSON.stringify(mOpen);
ok("what the student WROTE never travels", !/Wood is an insulator/.test(pText) && !pText.includes('"studentAnswer"'));
ok('the mark never travels', !/0\/1/.test(pText) && !/"verdict"/.test(pText));
ok('the question does', /good conductor of heat/.test(pText));

/* The portal shape. */
const pQ = pMcq.blocks.filter(b => b.type === 'text')[0];
ok('the wording is a text block', !!pQ && /good conductor/.test(pQ.content));
ok('the line breaks on the paper survive as line breaks', /<br>/.test(pQ.content));
ok('a scanned question is escaped on the way into authored HTML',
   api._vetHtml('5 < 8 & "true"') === '5 &lt; 8 &amp; &quot;true&quot;');
const pOpts = pMcq.blocks.filter(b => b.type === 'mcq')[0];
ok('an MCQ keeps its options', !!pOpts && pOpts.options.length === 4);
ok('the ticked option is the one the paper named',
   !!pOpts && pOpts.correctId === pOpts.options[2].id);
ok('an MCQ gets no second answer box',
   !pMcq.blocks.some(b => b.type === 'plainanswer'));
ok('a written question gets one',
   pOpen.blocks.some(b => b.type === 'plainanswer' && /evaporated/.test(b.content)));
ok('the reason why comes across',
   pMcq.blocks.some(b => b.type === 'explanation' && /Metals conduct/.test(b.content)));
ok('an MCQ is filed as one', pMcq.category === 'Multiple Choice Question');
/* The topic belongs to the destination app's syllabus, which this app has
   never seen. Guessing one files the question under a heading nobody chose
   while looking perfectly filed — so it is left blank and FLAGGED. */
ok('no topic is invented', pMcq.topic === '' && mMcq.topic === '');
ok('…and the gap is on screen rather than merely absent', pMcq.topicConfidence === 'low');

/* The Maths shape. */
ok('Maths files its answer on the question, not in a block', mOpen.expected === openItem.answer);
ok('an MCQ answered on the paper carries the option it named', mMcq.correctOption === 2);
ok('…and its options as plain strings', Array.isArray(mMcq.options) && mMcq.options[2] === 'Copper');
ok('the reason why becomes the marking guide', /Metals conduct/.test(mMcq.markingGuide));
ok('the wording is still a text block', mMcq.blocks.some(b => b.type === 'text' && /conductor/.test(b.content)));
ok('a written question carries no option list at all', !('options' in mOpen));

/* A label matching nothing must arrive UNTICKED. Guessing an option marks
   every class that ever sits the question against the wrong one. */
const noKey = Object.assign({}, mcqItem, { option: '' });
ok('an option the scan could not name is left unticked (portal)',
   api._vetPortalDoc(noKey).blocks.filter(b => b.type === 'mcq')[0].correctId === null);
ok('an option the scan could not name is left unticked (Maths)',
   api._vetMathDoc(noKey).correctOption === -1);
ok('the label is matched, never used as an index',
   api._vetCorrectIndex({ option: 'B', options: [{ label: 'A' }, { label: 'B' }] }) === 1 &&
   api._vetCorrectIndex({ option: '(3)', options: [{ label: '1' }, { label: '2' }, { label: '3' }] }) === 2);

/* A bank found by title. */
ok('the card is titled from the question', /good conductor/.test(pMcq.title));
ok('a very long question is cut, not printed whole',
   api._vetTitle({ question: 'x'.repeat(400) }).length < 80);
ok('a question with no wording still gets a name', api._vetTitle({ question: '' }) === 'Scanned question');

/* The door itself. A student's device runs this very same scan. */
api.user = { uid: 'kid1', email: 'a.student@example.com' };
ok('a student is offered no way in at all', api._vetCardFootHtml(openItem, 0) === '');
api.user = { uid: 'admin1', email: 'chungzhikai@gmail.com' };
ok('the teacher is', /📥 Send to/.test(api._vetCardFootHtml(openItem, 0)));
ok('and it never prints', /noPrint/.test(api._vetCardFootHtml(openItem, 0)));
ok('a question already sent says which list it is in',
   /In Science vetting/.test(api._vetCardFootHtml(Object.assign({ sentTo: ['science'] }, openItem), 0)));

/* Only the teacher's account can write, and it is asked TWICE — once for the
   button and once at the door. Hiding a button is not shutting a door. */
ok('the write asks whether this is the admin, not only the button',
   /async function vetChoose[\s\S]{0,900}if \(!isAdmin\(currentUser\)\)/.test(html));
ok('the window is the admin’s too', /function vetOpen[\s\S]{0,80}if \(!isAdmin\(currentUser\)\) return;/.test(html));
ok('every question that would not go is reported',
   /failed\+\+/.test(html) && /could not be/.test(html));
ok('a run still being read cannot be sent', /if \(_scanning\) \{ toast\(/.test(html));
/* The same two gates the ✎ carries. A card can still be folded into the one
   before it a second later, and half a question is worse than none. */
ok('the button is not drawn on a card while the run is still arriving',
   /function _vetCardFootHtml[\s\S]{0,520}if \(_scanning \|\| !isAdmin\(currentUser\)\) return '';/.test(html));

/* ---------- NO ALGEBRA ----------
   This centre teaches the methods the PSLE is marked on. An answer that
   reaches the right number by forming an equation is a method the pupil has
   not been taught and cannot reproduce in the exam — and it is worse than no
   answer, because it looks right.

   The reader has to be narrow in BOTH directions and every case below is one
   that would otherwise cost something real: a false negative puts algebra in
   front of a pupil, and a false positive spends one of the run's two rewrite
   calls turning a perfectly good unitary answer into another one. */
const ALGEBRA_YES = [
  'Let x be the number of apples. x + 15 = 40, so x = 25.',
  'Let the number of boys be y. 3y + 2 = 20.',
  '3x + 5 = 20',
  '2y = 14, y = 7',
  'Form an equation: 5n - 3 = 12.',
  'Solve for x.',
  'We can use algebra here.',
  'Substitute into the first equation.',
  'Express the total in terms of n.',
  'x + 15 = 40',
  'Using simultaneous equations,'
];
/* Every one of these is a method this app is meant to ENCOURAGE, or a unit,
   or a multiplication sign, or an angle the paper itself lettered. */
const ALGEBRA_NO = [
  '5 units = 200, so 1 unit = 40. 8 units = 320.',      // the unitary method itself
  '1 unit = 4, so 7 units = 28.',
  'Before: 5 units. After: 3 units. The difference is 2 units = 60.',
  'Working backwards: 40 - 15 = 25.',
  'Assume all 20 are chickens: 20 x 2 = 40 legs.',
  'The ratio is 3 : 5, so 3 units + 5 units = 8 units.',
  'Total = 3 x 4 = 12 cakes.',                          // x is a multiplication sign
  '3x4 = 12',
  'Area = 4 x 4 = 16 cm2',
  '$2 x 5 = $10',
  '5 m + 3 m = 8 m',                                    // single-letter units
  '12 kg - 4 kg = 8 kg',
  'She read 2 h + 1 h = 3 h.',
  '50 c + 50 c = $1',
  'Angle x = 55°, because angles on a straight line add up to 180°.',   // the paper's own letter
  'Angle x = 55 degrees.',
  '∠x = 55°',
  '∠a + ∠b = 180°'
];
ALGEBRA_YES.forEach(t => ok('algebra is caught: ' + t.slice(0, 40), api._textUsesAlgebra(t), t));
ALGEBRA_NO.forEach(t => ok('NOT algebra: ' + t.slice(0, 40), !api._textUsesAlgebra(t), t));
ok('an empty answer is not algebra',
   !api._textUsesAlgebra('') && !api._textUsesAlgebra(null) && !api._textUsesAlgebra(undefined));

/* The rule reaches the model, and it names the methods rather than only
   forbidding the one — "do not use algebra" with nothing to use instead is
   how a model reaches for it again. */
ok('the prompt forbids it in as many words', /NEVER USE ALGEBRA/.test(api.SCAN_NO_ALGEBRA_RULE));
ok('…and names what to use instead',
   /UNITARY METHOD/.test(api.SCAN_NO_ALGEBRA_RULE) &&
   /model/i.test(api.SCAN_NO_ALGEBRA_RULE) &&
   /working backwards/i.test(api.SCAN_NO_ALGEBRA_RULE));
ok('the maths standard carries it', /NEVER USE ALGEBRA/.test(api.SCAN_SUBJECT_RULE.math));
ok('and the rewrite call carries the same one fragment',
   (html.match(/SCAN_NO_ALGEBRA_RULE/g) || []).length >= 3);

/* A question that PRINTS the algebra is the one exception: answering
   "Simplify 3x + 5x" by the unitary method is answering a different
   question, and the app's authority order already says the paper wins. */
const printed = { subject: 'math', question: 'Simplify 3x + 5x.', options: [],
                  answer: '8x', explanation: '3x + 5x = 8x' };
ok('a printed algebra question is recognised as one', api._itemAsksAlgebra(printed));
ok('…and its answer is left alone', !api._itemUsesAlgebra(printed));
ok('the exception reads the QUESTION, never the answer',
   !api._itemAsksAlgebra({ question: 'How many apples are left?', options: [],
                           answer: 'Let x be the apples. x = 4' }));
ok('an option can carry the printed algebra too',
   api._itemAsksAlgebra({ question: 'Which is equal to it?',
                          options: [{ text: '2y + 3' }, { text: 'nine' }] }));

api.meta = { level: 'P5', subject: '' };
const algQ = { subject: 'math', question: 'Ali had 40 stickers…', options: [],
               answer: '25', explanation: 'Let x be the number. x + 15 = 40, so x = 25.' };
const unitQ = { subject: 'math', question: 'Ali had 40 stickers…', options: [],
                answer: '25', explanation: '40 - 15 = 25.' };
ok('a maths answer written with algebra is flagged', api._itemUsesAlgebra(algQ));
ok('a maths answer written with the unitary method is not', !api._itemUsesAlgebra(unitQ));
/* Only maths is held to it — an English answer is not rewritten for using
   the word "algebra", and a science one is not either. */
ok('another subject is never held to the maths rule',
   !api._itemUsesAlgebra({ subject: 'english', question: 'Define it.', options: [],
                           answer: 'Let x be the word.' }));
ok('a question whose subject could not be told IS checked — on a mixed page it is often the maths one',
   api._itemUsesAlgebra({ subject: '', question: 'Ali had 40…', options: [],
                          answer: '25', explanation: 'Let x be the number. x + 15 = 40.' }));

/* The budget. Left unbounded this is the loop that quietly spends a term's
   tokens on one stubborn worksheet. */
ok('the ration is small, and counted per RUN',
   api.SCAN_ALGEBRA_FIX_CALLS === 2 && /_algebraFixLeft = SCAN_ALGEBRA_FIX_CALLS;/.test(html));
ok('…and it is spent BEFORE the call, so a failure cannot buy another try',
   /_algebraFixLeft--;[\s\S]{0,400}await window\.askGemini\(_algebraPrompt/.test(html));
ok('a whole batch of slips is ONE call, not one per question',
   api.SCAN_ALGEBRA_FIX_MAX >= 8 && /bad\.slice\(0, SCAN_ALGEBRA_FIX_MAX\)/.test(html));
ok('the ration is refilled once per run and never inside the loop',
   (html.match(/_algebraFixLeft = SCAN_ALGEBRA_FIX_CALLS/g) || []).length === 2);   // the declaration + the reset
ok('the rewrite is text only — no pictures are sent again',
   !/_algebraPrompt[\s\S]{0,600}images:/.test(html));
ok('the rewrite is grounded like every other call',
   /system: SCAN_ALGEBRA_SYS \+ aiGrounding\('scan'\)/.test(html));
ok('it runs BEFORE the cards are painted',
   html.indexOf('await _algebraPass(run, _answers') < html.indexOf('renderAnswers();\n    scanProgress(Math.min'));

/* A rewrite is taken only when it really is free of algebra — a second
   algebraic answer is not an improvement on the first. */
const target = { subject: 'math', question: 'Ali had 40…', options: [], answer: '25',
                 explanation: 'Let x be the number. x + 15 = 40.', feedback: '' };
api._applyAlgebraFix([target], [{ i: 0, answer: '25', explanation: 'Let y be it. y = 25.' }]);
ok('a rewrite that is still algebra is refused',
   /Let x be/.test(target.explanation) && !target.rewritten);
api._applyAlgebraFix([target], [{ i: 0, answer: '25', explanation: '40 - 15 = 25.' }]);
ok('a clean rewrite is taken', target.explanation === '40 - 15 = 25.' && target.rewritten === true);
ok('an entry naming a question that is not there is dropped, never applied to another',
   api._applyAlgebraFix([target], [{ i: 9, explanation: 'nonsense' }]) === 0 &&
   target.explanation === '40 - 15 = 25.');

/* Whatever survives the budget is MARKED, not hidden. */
ok('an answer that is still algebra says so on its own card',
   /if \(it\.algebra\) \{/.test(html) && /uses algebra/.test(html));
ok('…and the flag is recomputed every pass, so a fixed answer stops wearing it',
   /all\.forEach\(function \(it\) \{ it\.algebra = _itemUsesAlgebra\(it\); \}\);/.test(html));

/* ---------- WHICH LIST A QUESTION BELONGS IN ----------
   This is the half the whole feature rests on. A maths question filed in the
   science vetting list is approved by a science teacher, sits in a science
   bank and is served to a science class — and nothing anywhere reports it,
   because every step after the routing works perfectly. */
const mathQ = Object.assign({}, openItem, { subject: 'math' });
const sciQ  = Object.assign({}, openItem, { subject: 'science' });
const mystery = Object.assign({}, openItem, { subject: '' });

/* What the model said, normalised against the ONE subject list. */
ok('the four keys come through', ['science', 'math', 'english', 'chinese']
   .every(k => api._scanSubject({ subject: k }) === k));
ok('the words a model reaches for instead are understood',
   api._scanSubject({ subject: 'Maths' }) === 'math' &&
   api._scanSubject({ subject: 'MATHEMATICS' }) === 'math' &&
   api._scanSubject({ subject: '华文' }) === 'chinese' &&
   api._scanSubject({ subject: 'English Language' }) === 'english');
ok('a subject that is not one of the four is DROPPED, never mapped to a near one',
   api._scanSubject({ subject: 'physics' }) === '' &&
   api._scanSubject({ subject: 'general knowledge' }) === '');
ok('nothing said is nothing known',
   api._scanSubject({}) === '' && api._scanSubject({ subject: '   ' }) === '');

/* The picker outranks the model — the teacher is holding the paper. */
api.meta = { level: 'P5', subject: 'math' };
ok('a paper the teacher has named goes to that app whatever a question looks like',
   api.itemSubject(sciQ) === 'math' && api.itemTarget(sciQ).key === 'math');
/* …and on "Any subject" the question itself decides, which is what lets a
   mixed pile file itself correctly. */
api.meta = { level: 'P5', subject: '' };
ok('on Any subject each question is routed by what IT asks',
   api.itemSubject(mathQ) === 'math' && api.itemSubject(sciQ) === 'science');
ok('a maths question never resolves to the science list',
   api.itemTarget(mathQ).col === 'mathVetting' && api.itemTarget(sciQ).col === 'vetting');
/* The one that matters most: nothing is filed on a guess. */
ok('a question whose subject could not be told has NO destination',
   api.itemSubject(mystery) === '' && api.itemTarget(mystery) === null);

/* The split a whole paper is sent as. */
api.meta = { level: 'P5', subject: '' };
const split = api._vetGroupBySubject([mathQ, sciQ, mystery, mathQ]);
ok('a mixed paper is split one batch per list', split.groups.length === 2);
ok('…with every question in the batch for its own subject',
   split.groups.every(g => g.items.every(it => api.itemSubject(it) === g.target.key)));
ok('…and the maths batch really is the maths list',
   split.groups.filter(g => g.target.key === 'math')[0].items.length === 2);
ok('the ones that could not be placed are kept OUT of every batch',
   split.unknown.length === 1 &&
   !split.groups.some(g => g.items.indexOf(mystery) !== -1));
ok('a paper nothing could be told about files nothing at all',
   api._vetGroupBySubject([mystery, mystery]).groups.length === 0);
ok('the button on the card names the list it is about to use',
   /Send to Maths vetting/.test(api._vetCardFootHtml(mathQ, 0)) &&
   /Send to Science vetting/.test(api._vetCardFootHtml(sciQ, 0)));
ok('…and says only "vetting" when it does not know',
   /Send to vetting</.test(api._vetCardFootHtml(mystery, 0)));
/* The subject travels with a question stitched across a batch boundary. */
ok('a continuation hands its subject to the half that has none',
   /if \(it\.subject && !prev\.subject\) prev\.subject = it\.subject;/.test(html));
ok('both prompts ask for it, through the ONE fragment',
   (html.match(/SCAN_SUBJECT_FIELD_RULE \+/g) || []).length === 2);
ok('the model is told to leave it EMPTY rather than guess',
   /a wrong subject is worse than none/.test(html));
api.meta = { level: 'P5', subject: 'science' };

/* ---------- Filing the whole paper automatically ----------
   Set once on the How tab. Everything about it is admin-only and everything
   about it has to be SAID: questions filed somewhere the teacher was not told
   about are questions nobody ever goes and vets. */
/* Two states and no more. A "file everything in the science list" option is
   exactly how a maths question reaches the science bank, so forcing a whole
   paper into one app is done by naming it in the SUBJECT picker — the one
   control `itemSubject` already reads. */
ok('the setting is Off or by-subject, and nothing else',
   /<option value="">Off/.test(html) && /<option value="auto">/.test(html) &&
   !/<option value="science"/.test(html));
ok('the setting is remembered with the others',
   /autoVet: \$\('scanAutoVet'\)/.test(html) && /if \(p\.autoVet === 'auto'\)/.test(html));
ok('a run files the paper only after it has been read',
   /await _vetAutoFile\(\);/.test(html) &&
   html.indexOf('await _vetAutoFile();') > html.indexOf('async function runScan'));
ok('an empty run files nothing', /if \(!vetAutoOn\(\) \|\| !_answers\.length\) return;/.test(html));
ok('it asks who is signed in at the moment the paper is read',
   /function vetAutoOn[\s\S]{0,200}isAdmin\(currentUser\)/.test(html));
ok('the field is hidden for a student and never cleared — that would wipe the setting',
   /if \(field\) field\.classList\.toggle\('hidden', !admin\);/.test(html));
ok('what was filed, and where, is said out loud', /_vetSplitReport\(r\)/.test(html));
ok('the automatic filing routes by subject, never to one fixed list',
   /await _vetSendBySubject\(_answers\.slice\(\)\)/.test(html));
/* One writer. Several loops would be several places for the admin check, the
   already-sent guard and the failure count to drift apart. */
ok('every path writes through the ONE writer',
   (html.match(/await _vetSend\(/g) || []).length === 2 &&
   (html.match(/async function _vetSend\(/g) || []).length === 1);
ok('…and the by-subject split goes through it too',
   /async function _vetSendBySubject[\s\S]{0,700}await _vetSend\(g\.target, g\.items/.test(html));
ok('…and the door is inside it', /async function _vetSend[\s\S]{0,320}!isAdmin\(currentUser\)\) return r;/.test(html));

/* =====================================================================
   ⚙️ TWO ENGINES, AND WHICHEVER ONE WILL ANSWER
   The backup exists because of a failure that is not a bug in this app:
   "[429] Your billing account has exceeded its monthly spending cap",
   returned identically to every call on every device until the month turns
   over. Everything pinned here is silent: the app carries on looking exactly
   as it did that morning.
   ===================================================================== */
const eng = new Function(`
var _store = {};
var localStorage = {
  getItem: function (k) { return (k in _store) ? _store[k] : null; },
  setItem: function (k, v) { _store[k] = String(v); },
  removeItem: function (k) { delete _store[k]; }
};
var window = {};
var console = { warn: function () {} };
` + engine + `
return {
  set store(v) { _store = v; },
  get last() { return window.aiLastCall; },
  AI_ENGINE_STORE, OPENAI_DEFAULT_MODEL, AI_DOWN_MS, OPENAI_URL, OPENAI_MAX_OUTPUT,
  openAiKey, openAiModel, openAiReady, aiEnginePref,
  kimiKey, kimiModel, kimiReady, KIMI_DEFAULT_MODEL, AI_ENGINES,
  aiEngineOrder, aiEngineIsDown, _openAiBody, _openAiText, aiAskWith
};
`)();

const KEY = 'sk-test-not-a-real-key-0000';

/* The four slot names are the WHOLE contract with the other four portals.
   They are sibling folders on one GitHub Pages origin, so they already share
   a localStorage; rename one to something tidier and this app is signed out
   of a key it can plainly see, with nothing anywhere to say why. */
ok('the engine slot is the shared one', eng.AI_ENGINE_STORE.engine === 'sq_ai_engine');
ok('the key slot is the shared one', eng.AI_ENGINE_STORE.key === 'sq_openai_key');
ok('the model slot is the shared one', eng.AI_ENGINE_STORE.model === 'sq_openai_model');
ok('the image-model slot is the shared one', eng.AI_ENGINE_STORE.imageModel === 'sq_openai_image_model');
ok('Kimi has slots of its own', eng.AI_ENGINE_STORE.kimiKey === 'sq_kimi_key' && eng.AI_ENGINE_STORE.kimiModel === 'sq_kimi_model');
ok('the backup model is the one the other apps use', eng.OPENAI_DEFAULT_MODEL === 'gpt-5.6-sol');

eng.store = {};
ok('no key saved is no backup', eng.openAiReady() === false);
ok('…and the model still has a name', eng.openAiModel() === 'gpt-5.6-sol');
eng.store = { sq_openai_key: '   ' };
ok('whitespace is not a key', eng.openAiReady() === false);
eng.store = { sq_openai_key: '  ' + KEY + '  ' };
ok('a key is read from the shared slot, trimmed', eng.openAiKey() === KEY);
eng.store = { sq_openai_key: KEY, sq_openai_model: 'gpt-5.7-sol' };
ok('a model saved by another portal is honoured', eng.openAiModel() === 'gpt-5.7-sol');

/* KIMI'S MODEL IS A FIELD, NOT A CONSTANT. Moonshot renames its flagship
   with every release, so an id frozen in the file is a 404 on every call a
   few months from now — and a 404 on every call reads as "Kimi is broken"
   rather than "the id is a release out of date". */
eng.store = {};
ok('no Kimi key saved is no Kimi device route', eng.kimiReady() === false);
ok('…and the model still has a name', eng.kimiModel() === eng.KIMI_DEFAULT_MODEL);
eng.store = { sq_kimi_key: '  ' + KEY + '  ', sq_kimi_model: '  kimi-k4-turbo ' };
ok('a Kimi key is read and trimmed', eng.kimiKey() === KEY);
ok('…and so is a model the teacher typed', eng.kimiModel() === 'kimi-k4-turbo');
eng.store = { sq_kimi_model: '   ' };
ok('a blank model falls back rather than asking for ""', eng.kimiModel() === eng.KIMI_DEFAULT_MODEL);

/* ---------- Which engine is tried first ---------- */
/* THREE routes, and which is which is the whole point of the rebuild: the
   `openai` one is the SERVER, whose key is a Firebase secret, so it reaches a
   student's phone with nothing set up on it. `openaiKey` is a key pasted into
   this one browser, which reaches nothing else. */
eng.store = {};
ok('every server backup is offered with no device key at all',
   eng.aiEngineOrder(true).join() === 'gemini,openai,kimi', eng.aiEngineOrder(true).join());
eng.store = { sq_openai_key: KEY };
ok('a device key sits BEHIND the server, never in front of it',
   eng.aiEngineOrder(true).join() === 'gemini,openai,openaiKey,kimi', eng.aiEngineOrder(true).join());
eng.store = { sq_kimi_key: KEY };
ok('…and the same for Kimi',
   eng.aiEngineOrder(true).join() === 'gemini,openai,kimi,kimiKey', eng.aiEngineOrder(true).join());
eng.store = { sq_openai_key: KEY, sq_ai_engine: 'openai' };
ok('preferring ChatGPT puts the others behind it, never off',
   eng.aiEngineOrder(true).join() === 'openai,openaiKey,gemini,kimi', eng.aiEngineOrder(true).join());
/* A preference is not a key — but the SERVER is not a key either, so
   preferring ChatGPT with nothing saved in this browser is perfectly
   answerable now, which it was not before the function existed. */
eng.store = { sq_ai_engine: 'openai' };
ok('preferring ChatGPT with no device key still goes through the server',
   eng.aiEngineOrder(true).join() === 'openai,gemini,kimi', eng.aiEngineOrder(true).join());

/* THE THIRD SUPPLIER IS THE POINT OF IT. Gemini and ChatGPT are two accounts
   on two bills; the morning BOTH are out is the morning Kimi exists for, so
   it has to be reachable as a first choice and as a last resort. */
eng.store = { sq_kimi_key: KEY, sq_ai_engine: 'kimi' };
ok('preferring Kimi puts it first and keeps the others behind it',
   eng.aiEngineOrder(true).join() === 'kimi,kimiKey,gemini,openai', eng.aiEngineOrder(true).join());
eng.store = { sq_ai_engine: 'kimi' };
ok('…and with no device key it still goes through the server',
   eng.aiEngineOrder(true).join() === 'kimi,gemini,openai', eng.aiEngineOrder(true).join());
/* An engine name nobody recognises must not empty the list: a stale word in
   the centre-wide setting would take the AI off every device at once. */
eng.store = { sq_ai_engine: 'nosuchengine' };
ok('an unknown preference still leaves every route on the list',
   eng.aiEngineOrder(true).join() === 'gemini,openai,kimi', eng.aiEngineOrder(true).join());

eng.store = { sq_openai_key: KEY };
ok('a capped Firebase project answers through the server, then the device key',
   eng.aiEngineOrder(false).join() === 'openai,openaiKey,kimi', eng.aiEngineOrder(false).join());
/* The list is NEVER empty. Whether the function is deployed is not something
   a page can know without asking, and refusing to ask is how an app that
   would have worked reports that there is no AI. */
eng.store = {};
ok('the server is always worth asking, so there is always a route',
   eng.aiEngineOrder(false).join() === 'openai,kimi', eng.aiEngineOrder(false).join());

/* ---------- The failover itself ---------- */
function runner(script) {
  const seen = [];
  return {
    seen,
    run: function (e) {
      seen.push(e);
      if (script[e] instanceof Error) return Promise.reject(script[e]);
      return Promise.resolve(script[e]);
    }
  };
}
const capped = new Error('[429] Your billing account has exceeded its monthly spending cap.');

eng.store = { sq_openai_key: KEY };
let r = runner({ gemini: capped, openai: 'the answer' });
let out = await eng.aiAskWith('p', {}, ['gemini', 'openai'], r.run);
ok('a capped Gemini falls through to ChatGPT', out === 'the answer');
ok('…having tried Gemini first', r.seen.join() === 'gemini,openai');
ok('…and the page can SAY which engine answered', eng.last.engine === 'openai');
ok('…and that it fell back', eng.last.fellBack === true);
ok('…and why', eng.last.error.indexOf('spending cap') >= 0);

/* The refusal is remembered, or a twelve-page paper pays for the same failed
   call on every batch before falling back on every batch. */
ok('the engine that refused is skipped for a while', eng.aiEngineIsDown('gemini'));
ok('…so the backup now leads', eng.aiEngineOrder(true).join() === 'openai,openaiKey,kimi,gemini', eng.aiEngineOrder(true).join());
/* …but it is moved to the BACK, never off the list: a cap is lifted
   eventually, and an app that refuses on a stale note is worse than one that
   spends a call finding out. */
ok('…and it is still on the list', eng.aiEngineOrder(true).indexOf('gemini') >= 0);
ok('…and the routes below it are still tried',
   eng.aiEngineOrder(false).join() === 'openai,openaiKey,kimi', eng.aiEngineOrder(false).join());

r = runner({ gemini: 'gemini is back' });
out = await eng.aiAskWith('p', {}, ['gemini'], r.run);
ok('an answer clears the mark', out === 'gemini is back' && !eng.aiEngineIsDown('gemini'));
ok('…and an answer from the first engine did NOT fall back', eng.last.fellBack === false);

/* Both directions. A ChatGPT key that has run out must fall back to Gemini
   exactly as a capped Gemini falls back to ChatGPT. */
r = runner({ openai: new Error('ChatGPT API error 429: quota'), gemini: 'gemini answered' });
out = await eng.aiAskWith('p', {}, ['openai', 'gemini'], r.run);
ok('a spent ChatGPT key falls back to Gemini', out === 'gemini answered');
ok('…and says so', eng.last.engine === 'gemini' && eng.last.fellBack === true);

/* When both refuse, the FIRST error is the one thrown: it names the real
   problem, while the second is usually "no key saved on this device", which
   is a true sentence about the wrong thing. */
r = runner({ gemini: capped, openai: new Error('No ChatGPT key is saved on this device') });
let threw = null;
try { await eng.aiAskWith('p', {}, ['gemini', 'openai'], r.run); } catch (e) { threw = e; }
ok('both refusing throws', !!threw);
ok('…and it is the FIRST error, the one that names the problem',
   threw && String(threw.message).indexOf('spending cap') >= 0);
ok('…and no engine is claimed to have answered', eng.last.engine === '');
ok('…and the reason is on the page', eng.last.error.indexOf('spending cap') >= 0);

threw = null;
try { await eng.aiAskWith('p', {}, [], () => Promise.resolve('x')); } catch (e) { threw = e; }
ok('no engine at all is refused rather than hanging',
   threw && /not configured/.test(String(threw.message)));

/* ---------- The ChatGPT request ---------- */
eng.store = { sq_openai_key: KEY };
const body = eng._openAiBody('Read this page. Reply as JSON.', {
  system: 'You are a marker.',
  images: [{ mimeType: 'image/jpeg', data: 'AAAA' }, { mimeType: 'image/png', data: 'BBBB' }],
  json: true, maxOutputTokens: 4096, temperature: 0.3
}, 'gpt-5.6-sol');
ok('the system prompt leads — it is where the grounding goes',
   body.messages[0].role === 'system' && body.messages[0].content === 'You are a marker.');
ok('the prompt is the user message', body.messages[1].role === 'user' &&
   body.messages[1].content[0].text.indexOf('Read this page') === 0);
/* The whole scan is a vision call. An engine that quietly dropped the pages
   would answer fluently about nothing at all. */
const imgs = body.messages[1].content.filter(c => c.type === 'image_url');
ok('every page is attached', imgs.length === 2);
ok('…as a data url the API can read',
   imgs[0].image_url.url === 'data:image/jpeg;base64,AAAA' &&
   imgs[1].image_url.url === 'data:image/png;base64,BBBB');
ok('…at full detail, because the whole read rests on the small print',
   imgs[0].image_url.detail === 'high');
ok('strict JSON mode is asked for', body.response_format && body.response_format.type === 'json_object');
/* A gpt-5 model runs only at its own default temperature; sending one is a
   400, which is not a worse answer — it is no answer at all. */
ok('no temperature is sent to a gpt-5 model', body.temperature === undefined);
ok('…but one is sent to a model that takes it',
   eng._openAiBody('p', { temperature: 0.3 }, 'gpt-4.1').temperature === 0.3);
ok('the budget is floored so a short answer is not truncated',
   eng._openAiBody('p', { maxOutputTokens: 200 }, 'm').max_completion_tokens === 1024);
ok('…and capped, because an over-large budget is a 400',
   eng._openAiBody('p', { maxOutputTokens: 1e9 }, 'm').max_completion_tokens === eng.OPENAI_MAX_OUTPUT);
ok('a page with no pictures sends none',
   eng._openAiBody('p', {}, 'm').messages[0].content.length === 1);
/* Strict JSON mode is REFUSED unless the word appears in the messages, so a
   prompt that never says it would 400 rather than answer. */
const jb = eng._openAiBody('Read the page.', { json: true }, 'm');
ok('a JSON call that never says JSON is told to',
   JSON.stringify(jb.messages[0].content).toLowerCase().indexOf('json') >= 0);

ok('a reply is read out of the message',
   eng._openAiText({ choices: [{ message: { content: '  hello  ' } }] }) === 'hello');
let bad = false;
try { eng._openAiText({ choices: [] }); } catch (e) { bad = true; }
ok('a reply in an unexpected shape THROWS rather than answering emptily', bad);
bad = false;
try { eng._openAiText({ choices: [{ message: { content: '   ' } }] }); } catch (e) { bad = true; }
ok('…and so does an empty one, which would read as a page with no questions', bad);

/* ---------- The one door, and the secret ---------- */
/* This is a public static site served to every student's browser, so a key
   committed here is a key handed to the whole school. */
ok('no ChatGPT key is anywhere in the file', !/\bsk-[A-Za-z0-9_-]{20,}/.test(html));
ok('the key is read from the browser, never from the page',
   /localStorage\.getItem\(k\)/.test(html) && !/sq_openai_key['"]\s*[,:]\s*['"]sk-/.test(html));
/* ONE door. Every call site in the app already goes through window.askGemini,
   which is why all of them gained the backup at once; a second route past it
   is a call that still dies on the cap with nothing saying why. */
ok('every engine call goes through the one dispatcher',
   (html.match(/askOpenAI\(/g) || []).length === 2 &&
   (html.match(/askGeminiDirect\(/g) || []).length === 2);
ok('…and it is what askGemini calls',
   /window\.askGemini = function askGemini[\s\S]{0,200}aiAskWith\(prompt, opts, aiEngineOrder\(!!geminiModel\), _aiRun\)/.test(html));
/* The server route needs neither Gemini nor a device key, so an app that
   asked "is Gemini up" would refuse every button on a capped project that is
   in fact perfectly able to answer. */
ok('the app is ready because a route always exists',
   /window\.aiReady = \(\) => true;/.test(html));
ok('the server route is the one the dispatcher reaches for first',
   /if \(engine === 'openai'\) return askOpenAiServer\(prompt, opts\);/.test(html) &&
   /if \(engine === 'openaiKey'\) return askOpenAI\(prompt, opts\);/.test(html));
/* The callable rides the COMPAT app, which is the one holding the signed-in
   user; the modular app beside it has App Check but no session, and the
   function refuses a caller it cannot name. */
ok('the callable is on the app that has the signed-in user',
   /firebase-functions-compat\.js/.test(html) && /_aiFns = firebase\.functions\(\)/.test(html));
ok('…and it is the function the Maths repo deploys',
   /httpsCallable\('askOpenAi'/.test(html));
/* The pages ARE the scan, so a route that quietly dropped them would come
   back fluent and about nothing at all. */
ok('the server route sends the pages up too',
   /images: \(opts\.images \|\| \[\]\)[\s\S]{0,200}mimeType: i\.mimeType \|\| 'image\/jpeg', data: i\.data/.test(html));

/* The page SAYS which engine answered. An app quietly running on its backup —
   or quietly running on one engine with no backup at all — looks exactly like
   one that is fine, until the morning the cap is hit. */
ok('the How tab has a line for it', /id="howEngines"/.test(html) && /function renderEngineLine\(/.test(html));
ok('…repainted when a run finishes', /renderGroundingLine\(\);\n  renderEngineLine\(\);/.test(html));
ok('…and when the How tab is opened',
   /if \(_tab === 'how'\) \{ renderGroundingLine\(\); renderEngineLine\(\); \}/.test(html));
/* "Not deployed yet" is a job for a developer and "the key was refused" is a
   bill — an app that reports both as "AI error" sends the teacher to the
   wrong place. */
ok('a server route that is not switched on yet says exactly that',
   /The server backup is not switched on yet/.test(html) &&
   /OPENAI_API_KEY secret has not been set/.test(html));
ok('…told apart from a refusal', /The server backup refused a moment ago/.test(html));
ok('the reason each route refused is kept',
   /const _aiWhy = \{ gemini: '', openai: '', openaiKey: '', kimi: '', kimiKey: '', shared: '' \};/.test(html));
/* KIMI IS THE THIRD SUPPLIER, and every part of reaching it is silent when
   it goes wrong: a route missing from the dispatcher is an engine that can
   be chosen and never called, and a model id frozen in the file is a 404 on
   every call a few months from now. */
ok('the server route is the function the Maths repo deploys',
   /httpsCallable\('askKimi', \{ timeout: 240000 \}\)/.test(html));
ok('…and the dispatcher can reach both Kimi routes',
   /if \(engine === 'kimi'\) return askKimiServer\(prompt, opts\);/.test(html) &&
   /if \(engine === 'kimiKey'\) return askKimiDirect\(prompt, opts\);/.test(html));
ok('the model travels to the server, because a teacher cannot redeploy a function',
   /model: kimiModel\(\)/.test(html));
ok('…and the account\'s own list fills the box', /window\.kimiListModels = async function/.test(html) && /id="kimiLoadBtn"/.test(html));
ok('…and a stale id is NAMED rather than read as "Kimi is broken"',
   /function kimiModelHint\(/.test(html) && /may simply be out of date/.test(html));
ok('a Kimi server key that is not set up yet says exactly that',
   /MOONSHOT_API_KEY secret has not been set/.test(html));
ok('the third engine is offered in the picker', /<option value="kimi">/.test(html));
/* The card must print the order the CALLS take. It used to build its own
   list and reverse it — right with two engines, silently wrong with three. */
ok('the card reads the real order rather than re-assembling it',
   /var routes = \(st\.order \|\| \[\]\)\.map\(engineName\)/.test(html) &&
   /order: aiEngineOrder\(!!geminiModel\)/.test(html));
/* An empty key box is "I did not change it", never "delete it" — that is
   what Remove Kimi key is for. Getting this backwards empties the teacher's
   key the moment they type a model id. */
ok('saving a model alone leaves the key alone', /if \(key !== undefined\) \{/.test(html));
/* The screenshot that prompted this said "Gemini: billing cap" and nothing
   about ChatGPT never having been reachable — so the teacher was sent to the
   Google console when the job was to deploy a function. */
ok('when NOTHING answers, every route is named, not just the first',
   /const why = order\.map\(e => AI_ROUTE_LABEL\[e\] \+ ': ' \+ \(_aiWhy\[e\] \|\| 'refused'\)\)\.join\(' · '\);/.test(html));
ok('…and the first error is kept as the cause rather than thrown away',
   /err\.cause = first;/.test(html));

/* The engine choice is the CENTRE's. A device-local one is the bug wearing a
   feature's clothes: the teacher switches on their own phone, watches it
   work, and every student stays on the capped engine. */
ok('the order follows the shared choice, not this browser\'s',
   /const first = aiPreferredEngine\(\);/.test(html));
ok('…and the three engines are named in one place',
   /const AI_ENGINES = \['gemini', 'openai', 'kimi'\];/.test(html));
ok('…which falls back to the device setting until the server answers',
   /function aiPreferredEngine\(\) \{ return _aiSharedEngine \|\| aiEnginePref\(\); \}/.test(html));
ok('the teacher\'s toggle writes it for everyone',
   /window\.aiEngineSetShared\(v\)/.test(html) && /is now the first engine for everyone/.test(html));
ok('…and a write that FAILED says so rather than letting them believe it moved',
   /Saved on this device only — the centre-wide setting could not be written/.test(html));
/* IT LIVES ON `config/admin` — the Portal's admin pointer, which this app
   ALREADY reads to find whose notes to apply and which only the admin can
   write. So it needs no rules change and no deploy, and it is the very same
   document the Science portal's own toggle writes: one switch moves both. */
ok('the shared setting rides the config/admin pointer this app already reads',
   /db\.collection\('config'\)\.doc\('admin'\)\.onSnapshot\(/.test(html));
ok('…written with MERGE, or it takes the Portal\'s bank pointer off with it',
   /\}, \{ merge: true \}\);/.test(html) && /aiEngineBy:/.test(html));
ok('…and the listener comes down with the account',
   /if \(window\.aiEngineStopShared\) window\.aiEngineStopShared\(\);/.test(html));
ok('an unset field means Gemini, so a centre that never touches it is unaffected',
   /\? d\.aiEngine : 'gemini'/.test(html));
ok('every signed-in device reads it', /window\.aiEngineLoadShared\(true\)/.test(html));
ok('…and the page says whose setting is actually in force',
   /This order is the centre-wide setting/.test(html) &&
   /This order is THIS DEVICE/.test(html));
ok('…and cleared by an answer', /_aiMarkUp\(engine\);\n      _aiWhy\[engine\] = '';/.test(html));
ok('it names the engine that answered last', /The last answer came from/.test(html));
/* The key field is the teacher's. A student's device runs this very same
   scan, and a secret has no business on it. */
ok('the key field is admin-gated', /function applyAiVisibility[\s\S]{0,400}isAdmin\(currentUser\)/.test(html));
ok('…and the handlers ask again rather than trusting a hidden field',
   /function aiSaveKey\(\) \{\n  if \(!isAdmin\(currentUser\)\) return;/.test(html) &&
   /function aiClearKey\(\) \{\n  if \(!isAdmin\(currentUser\)\) return;/.test(html));
ok('…and it is hidden, never cleared — that would empty the box on every load',
   /if \(el\) el\.classList\.toggle\('hidden', !admin\);/.test(html));
ok('the visibility is applied when the account changes',
   /applyVetVisibility\(\);\n  applyAiVisibility\(\);/.test(html));

console.log((fails ? '✗ ' : '✓ ') + (ran - fails) + '/' + ran + ' checks passed');
process.exit(fails ? 1 : 0);
