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
  /* It ENDS at the mistake book, not at the vetting door beyond it: the book
     sits between the two, so the old boundary swept the book's code into the
     report's section and every "the report does not do X" check was quietly
     being asked of the book as well. */
  '/* =====================================================================\n   📕 THE MISTAKE BOOK');
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
/* 🔑 Signing in. Every failure here is the whole app: a student who cannot get
   past the sign-in screen has no app at all, and the way it broke was silent —
   a hop to Google, a hop back, and a page still signed out with nothing said. */
const auth = section(
  '/* ================= Sign in ================= */',
  '/* ================= Wiring ================= */');

const engine = section(
  '\nconst AI_ENGINE_STORE = {',
  '/* ===== end of the two-engine block ===== */');

/* Only the helper is loaded: the rest of that section paints the DOM and
   attaches a listener at module scope, which a harness has no page for. */
const authFns = auth.slice(auth.indexOf('function _authWhy('), auth.indexOf('function signIn('));

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
var location = { href: 'https://polymathlc.github.io/scan/', hostname: 'polymathlc.github.io' };
var navigator = {};
var storage = null;
var db = { collection: () => ({ doc: () => ({
  collection: () => ({ doc: () => ({ get: () => Promise.resolve({ exists: false }) }),
                       get: () => Promise.resolve({ forEach: () => {} }) }),
  get: () => Promise.resolve({ exists: false })
}) }) };
`;

const api = new Function(prelude + json + grounding + scan + report + book + vet + authFns + `
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
    _applyMarkFix, _itemNeedsMarking, _markFixBatchItems, _markFixPrompt,
    SCAN_MARK_FIX_SYS, SCAN_MARK_FIX_CALLS, SCAN_MARK_FIX_MAX,
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
    mbListOf, mbIsLearning, mbInList, mbCardChipHtml, mbSelectedIds, mbPickAll, mbSetTab,
    MB_LIST_MISTAKE, MB_LIST_LEARNING,
    mbAskText, mbAskWaUrl, mbAskRoute, _askCleanPixels, ASK_WA_NUMBER,
    _askTier, _askPictureOptions, _askWrap, ASK_SHEET_W, ASK_SHEET_MAX_H,
    set mistakes(v) { _mistakes = v; },
    get mistakes() { return _mistakes; },
    get tab() { return _mbTab; },
    set sel(v) { _mbSel = v; },
    mbKeyOf, mbHasKey, _mbBoxOk, _mbShotForPage, _mbPaperUrl, _mbPaperTitle,
    _mbCleanBlocks, _mbBuildShots, MB_BUILD_SYS, MB_FIG_MAX, MB_BLOCK_MAX, MB_BLOCK_CHARS,
    _mbInkLevel, _mbLumaHist, _mbInkProfile, _mbClearEdge, _mbTrimTextRows, _mbUnionBox,
    _mbRuleGroups,
    MB_INK_RATIO, MB_INK_FLOOR, MB_INK_CEIL, MB_TRIM_BANDS, MB_TRIM_MAX, MB_TRIM_KEEP,
    MB_OPT_MAX, MB_UNION_SLACK, MB_UNION_MAX_AREA, MB_PAD_FRAC, MB_GROW_X, MB_GROW_Y,
    MB_MAXRUN_FRAC, MB_RUNS_MIN, MB_RULE_FRAC, MB_RULE_GROUPS,
    _mbPaperDoc, _mbMailDoc, camAvailable,
    set mistakes(v) { _mistakes = v; },
    set shots(v) { _shots = v; },
    VET_TARGETS, vetTarget, VET_SOURCE, _vetPortalDoc, _vetMathDoc,
    _vetTitle, _vetHtml, _vetCorrectIndex, _vetIsMcq, _vetCardFootHtml,
    _scanSubject, itemSubject, itemSubjectWhy, itemTarget, _vetGroupBySubject,
    _textUsesAlgebra, _itemAsksAlgebra, _itemUsesAlgebra, _applyAlgebraFix,
    SCAN_ALGEBRA_FIX_CALLS, SCAN_ALGEBRA_FIX_MAX, SCAN_NO_ALGEBRA_RULE,
    _authWhy,
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

/* ---- Reproducing the question as ORDERED BLOCKS ----
   The Science portal's Rapid add sets a question out as typeset wording with
   each figure cropped and placed where it belongs, and this is that ability
   ported. Every way it goes wrong is silent on a printed sheet: a block that
   is only pictures asks nothing, a figure box that is really the whole page
   keeps the neighbouring question, and a rebuild that could cost the filing
   would lose the mistake itself rather than just its layout. */
ok('a good build is kept in order, text and figure alike', (() => {
  const out = api._mbCleanBlocks({ blocks: [
    { type: 'text', text: 'Farmer Tan removed the outer ring.' },
    { type: 'image', page: 1, box_2d: [100, 100, 500, 600] },
    { type: 'text', text: '(a) State the function of the tubes. [1]' }
  ] });
  return out.length === 3 && out[0].type === 'text' && out[1].type === 'image' && out[2].type === 'text';
})());
ok('…and a figure carries its own page and rectangle, ready to crop', (() => {
  const b = api._mbCleanBlocks({ blocks: [{ type: 'text', text: 'x' }, { type: 'image', page: 2, box_2d: [10, 20, 300, 400] }] })[1];
  return b.page === 2 && b.box.join() === '10,20,300,400' && b.url === '';
})());
ok('a page the model did not name falls back to the first, never to nothing',
   api._mbCleanBlocks({ blocks: [{ type: 'text', text: 'x' }, { type: 'image', box_2d: [10, 20, 300, 400] }] })[1].page === 1);

/* A BUILD WITH NO WORDING IS REFUSED. A worksheet made of pictures with
   nothing asking anything is worse than the crop it would have replaced, and
   the fallbacks underneath it are both better than that. */
ok('a build with no wording at all is refused outright',
   api._mbCleanBlocks({ blocks: [{ type: 'image', box_2d: [100, 100, 500, 600] }] }).length === 0);
ok('nothing usable is an empty list, not a throw',
   api._mbCleanBlocks(null).length === 0 && api._mbCleanBlocks({}).length === 0
   && api._mbCleanBlocks({ blocks: 'nonsense' }).length === 0);
ok('an empty text block is dropped rather than printed as a blank paragraph',
   api._mbCleanBlocks({ blocks: [{ type: 'text', text: '   ' }, { type: 'text', text: 'real' }] }).length === 1);

/* The rectangle is a FIGURE's, so the whole-page test still applies here —
   a box round the entire sheet keeps the question above and below it too. */
ok('a figure box that is really the whole page is refused',
   api._mbCleanBlocks({ blocks: [{ type: 'text', text: 'x' }, { type: 'image', box_2d: [10, 10, 990, 990] }] }).length === 1);
ok('a malformed rectangle costs the figure and never the wording',
   api._mbCleanBlocks({ blocks: [{ type: 'text', text: 'x' }, { type: 'image', box_2d: [1, 2] }] }).length === 1);

/* Caps, because a model that will not stop is a document that will not save
   and a mistake that was therefore never filed at all. */
ok('the figures are capped', (() => {
  const many = [{ type: 'text', text: 'x' }];
  for (let i = 0; i < api.MB_FIG_MAX + 6; i++) many.push({ type: 'image', box_2d: [100, 100, 400, 400] });
  return api._mbCleanBlocks({ blocks: many }).filter(b => b.type === 'image').length === api.MB_FIG_MAX;
})());
ok('the blocks are capped', (() => {
  const many = [];
  for (let i = 0; i < api.MB_BLOCK_MAX + 10; i++) many.push({ type: 'text', text: 'line ' + i });
  return api._mbCleanBlocks({ blocks: many }).length === api.MB_BLOCK_MAX;
})());
ok('a runaway text block is clipped', (() => {
  const b = api._mbCleanBlocks({ blocks: [{ type: 'text', text: 'z'.repeat(5000) }] })[0];
  return b.text.length === api.MB_BLOCK_CHARS;
})());
/* A statement list has to keep its line breaks, or "A: … B: … C: …" prints as
   one run-on paragraph — which is the layout this feature exists to preserve. */
ok('line breaks inside a block survive',
   api._mbCleanBlocks({ blocks: [{ type: 'text', text: 'A: one\nB: two' }] })[0].text === 'A: one\nB: two');

/* The pages a question is printed on: a stitched question is measured on the
   page its rectangle was drawn on, so BOTH go up and the block says which. */
api.shots = [{ data: 'a', url: 'a' }, { data: 'b', url: 'b' }, { data: 'c', url: 'c' }];
ok('one page for an ordinary question', api._mbBuildShots({ page: 2, endPage: 2 }).length === 1);
ok('both pages for a question that ran over the break',
   api._mbBuildShots({ page: 1, endPage: 2 }).length === 2);
api.shots = [];

/* The prompt reproduces; it does not answer, mark or reword. Each of these is
   a way the worksheet quietly stops being the question the child sat. */
ok('the rebuild is told to reproduce, never to answer or reword',
   /NOT answering it, NOT marking it and NOT rewording it/.test(api.MB_BUILD_SYS));
ok('…to bring the SHARED STEM with a lettered part',
   /INCLUDE THE SHARED STEM/.test(api.MB_BUILD_SYS)
   && /A part torn away from the stem it depends on cannot be answered at all/.test(api.MB_BUILD_SYS));
ok('…to take nothing from the neighbouring questions',
   /Nothing from the question before it or the one after it/.test(api.MB_BUILD_SYS));
ok('…to leave the options out, because they are printed from the item itself',
   /LEAVE OUT the multiple-choice answer options/.test(api.MB_BUILD_SYS));
ok('…and to leave the handwriting out', /anything the student has written by hand/.test(api.MB_BUILD_SYS));
ok('the rectangle rule is the same 0–1000 convention as everywhere else',
   /four \n?\s*integers from 0 to 1000 measured on the WHOLE attached page/.test(api.MB_BUILD_SYS.replace(/\s+/g, ' '))
   || /integers from 0 to 1000 measured on the WHOLE attached page/.test(api.MB_BUILD_SYS));
ok('an omitted figure is an acceptable answer', /OMIT the image block entirely/.test(api.MB_BUILD_SYS));

/* The ration, and the guarantee that it can never cost the mistake. */
ok('the budget is spent BEFORE the call, so a failure cannot buy another',
   /_mbBuildBudget--;\s*\/\/ spent BEFORE the call/.test(html));
ok('…refilled once per run and nowhere else',
   /\n  _mbBuildBudget = MB_BUILD_MAX;\s+\/\/ refilled ONCE per run/.test(html)
   && (html.match(/^\s+_mbBuildBudget = MB_BUILD_MAX;/gm) || []).length === 1);
ok('…and a question added by hand always gets one',
   /if \(_mbBuildBudget < 1\) _mbBuildBudget = 1;/.test(html));
ok('every failure returns an empty list rather than throwing the filing away',
   /catch \(e\) \{ console\.warn\('question rebuild failed', e\); return \[\]; \}/.test(html));
ok('the reproduction reaches the mistake…', /blocks: blocks,/.test(html));
ok('…and the worksheet', /blocks: m\.blocks \|\| \[\]/.test(html));
/* It is its OWN call. Bolting a block specification onto the scan prompt buys
   a better worksheet at the price of worse marking. */
ok('it is a separate call, not more work for the marking prompt',
   !/MB_BUILD_SYS/.test(api.SCAN_SYS) && /system: MB_BUILD_SYS/.test(html));


/* =====================================================================
   🔑 SIGNING IN
   ---------------------------------------------------------------------
   A student who cannot get past the sign-in screen has no app at all, and
   this broke in the quietest way there is: a hop to the Google screen, a hop
   back, and a page still signed out with nothing on it to say why.

   The cause was the REDIRECT fallback. This app is served from
   polymathlc.github.io and its authDomain is mathgen--app.firebaseapp.com, so
   a redirect has to write the half-finished sign-in on one origin and read it
   back on the other — which Safari's tracking prevention and Chrome's storage
   partitioning both now refuse. The other four portals had already worked
   that out and say so in their own source; this app was the only one still
   falling back to it, and it fell back in exactly the place it fails: a
   phone, where a popup is likeliest to be blocked in the first place.
   ===================================================================== */
ok('sign-in is a popup', /auth\.signInWithPopup\(provider\)/.test(html));
/* THE ONE THAT MUST NEVER COME BACK. A redirect on this origin pair cannot
   hand the session back, so re-adding it as a "fallback" restores a button
   that sends a student round a loop and returns them signed out. */
ok('…and there is no redirect fallback anywhere in the file',
   !/auth\.signInWithRedirect\s*\(/.test(html));
ok('the account is asked for rather than assumed',
   /provider\.setCustomParameters\(\{ prompt: 'select_account' \}\)/.test(html));
/* Closing the window is not a failure and must not raise a toast; every other
   code must, or the button looks like it did nothing at all. */
ok('closing the window is silent, and so is a double tap',
   /auth\/popup-closed-by-user' \|\| e\.code === 'auth\/cancelled-popup-request'/.test(html));
ok('a redirect this app no longer starts is still collected once, for the devices left on it',
   /auth\.getRedirectResult\(\)\.catch\(/.test(html));

/* Every message names something a person can DO. The raw Firebase strings name
   internal state, which is why "could not sign in: missing initial state" sent
   nobody anywhere. */
ok('a blocked popup says to allow pop-ups',
   /allow pop-ups/i.test(api._authWhy({ code: 'auth/popup-blocked' })));
/* The other half of "I cannot log in", and the only one that is a console
   setting rather than a browser one — so it has to name itself, and the
   domain, or the teacher goes looking in the browser. */
{
  const m = api._authWhy({ code: 'auth/unauthorized-domain' });
  ok('an unauthorised domain names the console setting', /authorised domains/i.test(m));
  ok('…and the domain being refused', /polymathlc\.github\.io/.test(m));
}
ok('a dead network says so rather than blaming the sign-in',
   /connection/i.test(api._authWhy({ code: 'auth/network-request-failed' })));
ok('an in-app browser is named as the thing to leave',
   /in-app browser/i.test(api._authWhy({ code: 'auth/operation-not-supported-in-this-environment' })));
ok('the redirect’s own error becomes an instruction',
   /Tap Sign in again/.test(api._authWhy({ code: 'auth/missing-initial-state' })));
/* An unknown code must still say SOMETHING — a silent catch is the failure
   this whole section exists to end. */
ok('a code nobody has seen still produces a message',
   /Could not sign in/.test(api._authWhy({ code: 'auth/whatever', message: 'x' }))
   && /Could not sign in/.test(api._authWhy(null)));

/* =====================================================================
   ✂️ THE FIGURE, AND NOT THE SENTENCE ABOVE IT
   ---------------------------------------------------------------------
   The rectangle a model draws round a figure is a guess made by eye, and the
   way it is wrong is always the same: it overshoots and takes a line of the
   question's own wording with it. Everything below fails SILENTLY — the
   worksheet prints, the figure is there, and half a sentence is stuck to it
   — so both directions are pinned here.

   Too timid and the feature is decoration: every crop still carries the line
   above it and nothing on any screen says the trimmer ran and did nothing.
   Too eager and it is worse than the bug it fixes: a table comes back with
   its top row gone, a graph loses its axis labels, a caption is cut off the
   picture it names — and all three look like a perfectly successful crop.

   The pages below are built as real RGBA pixels and run through the REAL
   profile, so what is being tested is the whole chain — the threshold, the
   rows, the bands — and not a hand-written array of numbers that happens to
   agree with what the code expects.
   ===================================================================== */

/* A page as pixels. `paint(x, y)` returns true where the ink is. `white` is
   what the paper itself measures — 255 for a screenshot, far less for a
   photograph, which is the case the whole threshold exists for. */
function page(w, h, paint, white, ink) {
  const d = new Uint8ClampedArray(w * h * 4);
  const bg = white == null ? 255 : white;
  const fg = ink == null ? Math.round(bg * 0.18) : ink;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const v = paint(x, y) ? fg : bg;
      d[i] = d[i + 1] = d[i + 2] = v;
      d[i + 3] = 255;
    }
  }
  return d;
}
/* A line of print: many short marks across the width, the way letters are. */
function prose(y0, y1, x0, x1) {
  return (x, y) => y >= y0 && y <= y1 && x >= x0 && x <= x1 && (x % 5) < 3;
}
/* A drawing: an outline, which is what a rule-and-stroke test has to see. */
function boxDrawing(y0, y1, x0, x1) {
  return (x, y) => (x >= x0 && x <= x1 && y >= y0 && y <= y1) &&
    (x === x0 || x === x1 || y === y0 || y === y1 ||
     (x > x0 + 20 && x < x1 - 20 && y === Math.round((y0 + y1) / 2)));
}
function anyOf() {
  const fns = [].slice.call(arguments);
  return (x, y) => fns.some(f => f(x, y));
}
function profileOf(data, w, h) {
  const lv = api._mbLumaHist(data);
  return api._mbInkProfile(data, w, h, api._mbInkLevel(lv.hist, lv.total));
}

/* ---- The threshold is MEASURED, not assumed ---- */
/* The Science portal's passes read a SCREENSHOT, which is white at 255, so a
   fixed "darker than 190" works there. This app reads a PHOTOGRAPH: the
   paper is grey, and a fixed line reads the whole sheet as ink — so the
   trimmer finds one band covering everything and does nothing at all, on
   every photograph, with nothing on screen to say it has stopped working. */
{
  const white = new Array(256).fill(0); white[255] = 1000;
  ok('a screenshot puts the ink line just under the portal\'s own 190',
     Math.abs(api._mbInkLevel(white, 1000) - 189) <= 4);

  const grey = new Array(256).fill(0); grey[186] = 1000;   // a photograph of the same page
  const t = api._mbInkLevel(grey, 1000);
  ok('a grey photograph moves the line DOWN with the paper', t < 150 && t > 100);
  ok('…so print on grey paper is still read as ink', Math.round(186 * 0.18) < t);

  /* The top 2% is given away on purpose: one specular highlight off a glossy
     sheet is 255 and is not what the page is made of. */
  const shiny = new Array(256).fill(0); shiny[186] = 980; shiny[255] = 20;
  ok('a highlight does not drag the line back up to a screenshot\'s',
     Math.abs(api._mbInkLevel(shiny, 1000) - t) <= 6);

  ok('nothing to measure returns the ceiling rather than throwing',
     api._mbInkLevel(null, 0) === api.MB_INK_CEIL);
  const black = new Array(256).fill(0); black[3] = 1000;
  ok('an all-but-black picture cannot push the line under the floor',
     api._mbInkLevel(black, 1000) >= api.MB_INK_FLOOR);
}

/* ---- The profile knows a stroke from a word ---- */
{
  const W = 300, H = 30;
  const words = profileOf(page(W, H, prose(10, 18, 20, 280)), W, H).rows[14];
  const rule = profileOf(page(W, H, (x, y) => y >= 10 && y <= 12 && x >= 20 && x <= 280), W, H).rows[11];
  ok('a line of print breaks into many short pieces', words.runs >= api.MB_RUNS_MIN);
  ok('…none of them long', words.maxRun <= (words.maxX - words.minX + 1) * api.MB_MAXRUN_FRAC);
  ok('a printed rule is ONE piece', rule.runs === 1);
  ok('…and it is the whole width', rule.maxRun > (rule.maxX - rule.minX + 1) * api.MB_MAXRUN_FRAC);
}

/* ---- ① The edge walks out of the ink it was cutting through ---- */
{
  const counts = [5, 5, 5, 0, 0, 3, 3, 0];
  ok('an edge standing on ink moves out until it stands on paper',
     api._mbClearEdge(counts, 5, 1, 8, 0) === 7 && api._mbClearEdge(counts, 2, 1, 8, 0) === 3);
  ok('an edge already on paper does not move', api._mbClearEdge(counts, 4, -1, -1, 0) === 4);
  /* Never grow blindly: an edge that finds no paper inside its allowance
     stays where it is. Moving it to the end of the allowance is the pad this
     whole pass replaces. */
  ok('an edge that never finds paper stays exactly where it was',
     api._mbClearEdge([9, 9, 9, 9], 1, -1, -1, 0) === 1);
  ok('nothing to walk is not a crash', api._mbClearEdge(null, 3, 1, 9, 0) === 3);
}

/* ---- ② A line of the question is taken off; the figure is not ---- */
{
  const W = 400, H = 300, pageH = 1000;
  /* One line of wording, a clear band of paper, then a drawing. */
  const d = page(W, H, anyOf(prose(6, 16, 10, 390), boxDrawing(60, 260, 60, 340)));
  const cut = api._mbTrimTextRows(profileOf(d, W, H).rows, W, H, pageH);
  ok('the line of wording above a figure is cut off', cut.top > 20 && cut.top <= 60);
  ok('…and the figure itself is kept whole', cut.bot >= 260 && cut.top <= 60);

  /* TWO lines, which is the case the portal\'s version cannot reach: the gap
     between them is smaller than the gap that separates the wording from the
     figure, so a trimmer that insists on paper after the FIRST line finds
     none, stops, and leaves both lines on the picture. */
  const d2 = page(W, H, anyOf(prose(4, 14, 10, 390), prose(20, 30, 10, 390), boxDrawing(70, 260, 60, 340)));
  const cut2 = api._mbTrimTextRows(profileOf(d2, W, H).rows, W, H, pageH);
  ok('a run of two lines goes together', cut2.top > 34 && cut2.top <= 70);

  /* A line UNDER the figure — the other half of the complaint, and the one
     the printed sheet shows as the next question\'s opening words. */
  const d3 = page(W, H, anyOf(boxDrawing(20, 200, 60, 340), prose(280, 290, 10, 390)));
  const cut3 = api._mbTrimTextRows(profileOf(d3, W, H).rows, W, H, pageH);
  ok('a line of wording below a figure is cut off too', cut3.bot < 275 && cut3.bot >= 200);
}

/* ---- …and the four things that must never be cut ---- */
{
  const W = 400, H = 300, pageH = 1000;

  /* A CAPTION is narrow, so it survives. "Diagram 1" under a figure is part
     of the figure, and a crop that loses it is a picture nobody can cite. */
  const cap = page(W, H, anyOf(boxDrawing(20, 200, 60, 340), prose(230, 240, 170, 240)));
  const c1 = api._mbTrimTextRows(profileOf(cap, W, H).rows, W, H, pageH);
  ok('a caption under the figure is kept', c1.bot >= 240);

  /* A FRAMED TABLE is the figure, and every one of its rows reads as prose on
     its own. Trimmed row by row it comes back as its own bottom two thirds —
     the one wrong crop that looks completely convincing. */
  const tbl = (x, y) => {
    if (x < 20 || x > 380) return false;
    if (y === 30 || y === 70 || y === 110 || y === 150 || y === 190) return true;  // the rules
    if (y > 30 && y < 190 && (x % 5) < 3 && x > 30 && x < 370) return true;        // the cells
    return false;
  };
  const rows = profileOf(page(W, H, tbl), W, H).rows;
  ok('a framed table is recognised by its rules',
     api._mbRuleGroups(rows, W, H, 0, H - 1) >= api.MB_RULE_GROUPS);
  const c2 = api._mbTrimTextRows(rows, W, H, pageH);
  ok('…so not one row of it is trimmed away', c2.top <= 30 && c2.bot >= 190);

  /* A GRAPH AXIS is a long stroke, and density alone cannot see it: a
     hairline right across a wide crop is a fraction of a percent of the
     pixels in its row, so "not solid" passes it happily. */
  const axis = page(W, H, (x, y) =>
    (y >= 40 && y <= 42 && x >= 20 && x <= 380) ||          // the axis
    (y > 45 && y < 250 && x > 60 && x < 340 && (x + y) % 40 === 0));
  const c3 = api._mbTrimTextRows(profileOf(axis, W, H).rows, W, H, pageH);
  ok('an axis line across the top of a figure is not read as a sentence', c3.top <= 45);

  /* AND A PICTURE THAT IS ONLY A PICTURE COMES BACK UNTOUCHED. */
  const only = page(W, H, boxDrawing(10, 290, 20, 380));
  const c4 = api._mbTrimTextRows(profileOf(only, W, H).rows, W, H, pageH);
  ok('a figure with no wording near it is not trimmed at all',
     c4.top <= 10 && c4.bot >= 290);
}

/* ---- ③ The blank paper itself ---- */
/* The one move here that cannot be wrong: it removes measured empty paper and
   nothing else. It is what the old pad was reaching for and getting exactly
   backwards — a rectangle drawn loose came back looser. */
{
  const W = 300, H = 200;
  const d = page(W, H, boxDrawing(60, 140, 40, 260));
  const cut = api._mbTrimTextRows(profileOf(d, W, H).rows, W, H, 1000);
  ok('a loose rectangle is pulled in to the ink it holds',
     cut.top >= 55 && cut.top <= 62 && cut.bot >= 138 && cut.bot <= 145);
}

/* ---- It fails SAFE, every time ---- */
{
  ok('a crop too small to analyse is handed straight back',
     api._mbTrimTextRows([], 10, 10, 1000).top === 0);
  const W = 400, H = 300;
  /* Nothing but wording: trimming to fit would leave a sliver, so the caps
     stand it down. A slightly loose crop is a figure with a stray line over
     it; a confident wrong one is a figure with its labels cut off, and only
     one of those can be seen for what it is on the printed page. */
  const allText = page(W, H, anyOf(
    prose(10, 20, 10, 390), prose(40, 50, 10, 390), prose(70, 80, 10, 390),
    prose(100, 110, 10, 390), prose(130, 140, 10, 390), prose(160, 170, 10, 390)));
  const c = api._mbTrimTextRows(profileOf(allText, W, H).rows, W, H, 1000);
  ok('a crop that is nothing but wording keeps at least half of itself',
     (c.bot - c.top + 1) >= H * api.MB_TRIM_KEEP);
  ok('…and never trims more than its share off one side',
     c.top <= H * api.MB_TRIM_MAX);
}

/* ---- The pad is measured on the BOX, never on the page ---- */
/* The old margin was 3% of the page's width and 2.5% of its height, so on an
   ordinary phone photograph it grew every rectangle by a whole line of 9pt
   print in every direction, whether or not it needed any help — which is how
   a pad meant to rescue a clipped label ended up swallowing a sentence. */
ok('the breathing space is a fraction of the box, not of the page',
   /var pad = Math\.max\(MB_PAD_MIN, Math\.round\(Math\.min\(r\.w, r\.h\) \* MB_PAD_FRAC\)\);/.test(html));
ok('…and it is small', api.MB_PAD_FRAC <= 0.02);
ok('the whole-question crop is never tightened — it is MEANT to hold the wording',
   /if \(!whole\) r = _mbTightenRect\(img, W, H, r, opts\);/.test(html));
ok('every pass hands the rectangle back untouched when anything goes wrong',
   /catch \(e\) \{ console\.warn\('crop tighten skipped', e\); return r; \}/.test(html));

/* =====================================================================
   🔢 FOUR PICTURE OPTIONS ARE ONE PICTURE
   ---------------------------------------------------------------------
   A question whose four choices are little drawings has options that cannot
   be written out — the app holds four empty strings for it — so what came
   back was a question with a diagram and four blank choices, printed and
   handed to a child with nothing to choose between.

   Cut out separately they are worse than that: four pictures stacked down
   the page, each a different size, the row they were printed in gone, and a
   student answering "(3)" unable to see which one (3) was.
   ===================================================================== */
ok('the rebuild is told to leave WORDED options out, as it always was',
   /LEAVE OUT the multiple-choice answer options WHEN THEY ARE WORDS OR NUMBERS/.test(api.MB_BUILD_SYS));
ok('…and to send PICTURE options as one rectangle round all of them',
   /ONE rectangle round ALL of the option pictures together/.test(api.MB_BUILD_SYS));
ok('…never one per option, and it says why',
   /NEVER one rectangle per option/.test(api.MB_BUILD_SYS)
   && /stop reading as a set of choices/.test(api.MB_BUILD_SYS));
ok('…keeping the (1) (2) (3) (4) labels with the pictures they name',
   /including the \(1\) \(2\) \(3\) \(4\) \n?labels/.test(api.MB_BUILD_SYS.replace(/\s+/g, ' '))
   || /including the \(1\) \(2\) \(3\) \(4\) labels/.test(api.MB_BUILD_SYS.replace(/\s+/g, ' ')));
ok('…and a worded question gets no options block at all',
   /a question whose options are words gets no options block/.test(api.MB_BUILD_SYS));

/* The block reaches the worksheet as an ordinary `image` wearing a ROLE, so a
   viewer that has never heard of picture options still draws it. A block of a
   type nobody knows would be dropped on the floor instead — the picture gone,
   and four empty brackets printed in its place. */
{
  const built = api._mbCleanBlocks({ blocks: [
    { type: 'text', text: 'Which shape has four equal sides?' },
    { type: 'options', page: 1, box_2d: [700, 60, 860, 940] }
  ] });
  ok('a picture-options block arrives as an image', built.length === 2 && built[1].type === 'image');
  ok('…marked with the role that says what it is', built[1].role === 'options');
  ok('…and printed LAST, after the block that asks the question',
     built[0].type === 'text' && built[built.length - 1].role === 'options');
}
/* It is never trimmed. The trimmer above exists to take lines of text off a
   figure, and an options band is a row of pictures with a number printed
   under each of them — so pointed at this it works perfectly and takes the
   choices off one line at a time. */
ok('the options band is cropped with the prose trimmer switched off',
   /var isOpts = b\.role === 'options';/.test(html)
   && /_mbCropBox\(s\.shot\.url, b\.box, false, isOpts \? \{ trim: false \} : null\)/.test(html));

/* "One rectangle" is a rule a model can be asked to follow and cannot be made
   to. Four are answered by covering all four — but only when they really do
   sit together. */
ok('four option boxes in a row become one',
   JSON.stringify(api._mbUnionBox([[700, 60, 800, 280], [700, 300, 800, 520],
                                   [700, 540, 800, 760], [700, 780, 800, 940]]))
   === JSON.stringify([700, 60, 800, 940]));
ok('two in a 2×2 grid do too',
   JSON.stringify(api._mbUnionBox([[600, 100, 700, 400], [600, 500, 700, 800],
                                   [750, 100, 850, 400], [750, 500, 850, 800]]))
   === JSON.stringify([600, 100, 850, 800]));
/* Boxes in opposite corners union to most of the sheet, which is not a set of
   options — it is a failed reading, and the caller is better off with
   nothing than with a crop of the whole page called "the choices". */
ok('boxes scattered across the page are refused',
   api._mbUnionBox([[30, 30, 120, 140], [880, 850, 970, 960]]) === null);
ok('…and so is a union that covers most of the page',
   api._mbUnionBox([[20, 20, 500, 980], [520, 20, 980, 980]]) === null);
ok('one box is its own union', JSON.stringify(api._mbUnionBox([[700, 60, 800, 280]])) === JSON.stringify([700, 60, 800, 280]));
ok('nothing usable is null rather than a crash',
   api._mbUnionBox(null) === null && api._mbUnionBox([]) === null && api._mbUnionBox([[1, 2]]) === null);

/* The word list must not be printed as well: four empty brackets under the
   picture that already carries the choices reads as a fault in the sheet.
   That decision is the VIEWER's — `polymathlc/cer`'s mistakes.html — and
   `role: 'options'` is the whole contract between the two repositories. */
ok('the role is the one word the viewer reads',
   /role: 'options'/.test(html));

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
ok('the chip is never drawn on a typed answer, or while a run is still going',
   /function mbCardChipHtml[\s\S]{0,260}it\.kind !== 'page'/.test(html) &&
   /function mbCardChipHtml\(it\) \{\n  if \(!mbAvailable\(\) \|\| _scanning/.test(html));
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
   /async function mbFileRun[\s\S]{0,2200}else if \(mbIsWrong\(it\)\) \{\s*\n\s*if \(await mbSaveOne\(it, MB_LIST_MISTAKE\)\)/.test(html));

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

/* THE QUESTION'S OWN SUBJECT DECIDES, and the picker is only the fallback
   behind it. This is the reversal asked for by name: a maths question was
   coming up as "Send to Science vetting" because the Settings picker happened
   to be set to Science, and the subject a question IS does not change
   according to what somebody chose on another tab before photographing it. */
api.meta = { level: 'P5', subject: 'science' };
ok('a maths question on a paper set to Science still goes to the MATHS list',
   api.itemSubject(mathQ) === 'math' && api.itemTarget(mathQ).key === 'math');
ok('…and the button on its card says so',
   /Send to Maths vetting/.test(api._vetCardFootHtml(mathQ, 0)));
ok('…and it says the question is what decided, not the picker',
   api.itemSubjectWhy(mathQ).from === 'question');
/* The picker has NOT stopped mattering — it is what a question the model
   could not place falls back to, so a paper that is all one subject still
   files itself in one list. */
api.meta = { level: 'P5', subject: 'math' };
ok('a question that could not name its own subject falls back to the picker',
   api.itemSubject(mystery) === 'math' && api.itemTarget(mystery).key === 'math');
ok('…and the picker SAYS that is what happened, rather than claiming the question read as maths',
   api.itemSubjectWhy(mystery).from === 'setting');
/* …and with no picker set the question still decides, which is what lets a
   mixed pile file itself correctly. */
api.meta = { level: 'P5', subject: '' };
ok('on Any subject each question is routed by what IT asks',
   api.itemSubject(mathQ) === 'math' && api.itemSubject(sciQ) === 'science');
ok('a maths question never resolves to the science list',
   api.itemTarget(mathQ).col === 'mathVetting' && api.itemTarget(sciQ).col === 'vetting');
/* The one that matters most: with nothing to go on, nothing is filed. A guess
   is precisely the mistake this routing exists to prevent. */
ok('a question whose subject could not be told, on a paper that named none, has NO destination',
   api.itemSubject(mystery) === '' && api.itemTarget(mystery) === null &&
   api.itemSubjectWhy(mystery).from === '');

/* The no-algebra check reads the same one place, so it follows the question
   too: a maths question photographed on a pile set to Science is now held to
   the no-algebra rule it was previously exempt from. */
api.meta = { level: 'P5', subject: 'science' };
ok('a maths question on a Science-set paper is still held to the no-algebra rule',
   api._itemUsesAlgebra({ subject: 'math', question: 'Ken has some sweets.',
                          answer: 'Let x be the number. 3x + 5 = 20', explanation: '' }) === true);
api.meta = { level: 'P5', subject: '' };

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
   exactly how a maths question reaches the science bank, so each question is
   filed by what it reads as, with the SUBJECT picker standing in behind it
   for one that did not say. */
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

/* =====================================================================
   ✍️ THE MARKING REPAIR PASS
   ---------------------------------------------------------------------
   Everything in this app hangs off ONE field: `marked` is `!!studentAnswer`,
   and `marked` is what puts the verdict on the card, what the tally counts,
   what the report is written from and what `mbFileRun` files in the mistake
   book. So a question answered without transcribing what the student wrote
   is not "missing its feedback" — it is never marked, never reported and
   never kept, on a card that looks completely finished. It showed up on
   maths first because a maths answer is faint pencil working rather than a
   word in a blank.

   Every failure here is silent in BOTH directions and the app carries on: too
   timid and the marking simply never happens, which is the bug; too eager and
   a repair call is paid for on every blank worksheet sent up to be answered,
   which is the commonest use this app has.
   ===================================================================== */
/* ---------- The marking repair pass ---------- */

/* The trigger. `hasWriting` is the model saying it can SEE handwriting, which
   is a different claim from having read it — and the gap between the two is
   the whole bug. */
ok('a question with writing on it and nothing transcribed needs repair',
   api._itemNeedsMarking({ kind: 'page', wrote: true, marked: false }) === true);
ok('a question that really is blank NEVER does — a blank worksheet must stay one call',
   api._itemNeedsMarking({ kind: 'page', wrote: false, marked: false }) === false);
ok('…and a missing hasWriting reads as no writing rather than as a reason to spend',
   api._markFields({ studentAnswer: '' }).wrote === false &&
   api._itemNeedsMarking(Object.assign({ kind: 'page' }, api._markFields({ studentAnswer: '' }))) === false);
ok('a properly marked question does not', 
   api._itemNeedsMarking({ kind: 'page', wrote: true, marked: true, verdict: 'wrong' }) === false);
/* The second half, and the easy one to miss: `_markFields` deliberately lets
   a transcribed answer through with NO verdict, and `mbIsWrong`/`mbIsRight`
   both want one — so it is filed in the mistake book by nothing at all. */
ok('a written answer with no verdict needs repair — nothing files it in the book',
   api._itemNeedsMarking({ kind: 'page', wrote: true, marked: true, verdict: '' }) === true &&
   api.mbIsWrong({ kind: 'page', marked: true, verdict: '' }) === false &&
   api.mbIsRight({ kind: 'page', marked: true, verdict: '' }) === false);
ok('an answer to a typed question is never repaired — it had no page',
   api._itemNeedsMarking({ kind: 'ask', wrote: true, marked: false }) === false);

/* `hasWriting` has to survive the fold, or a question stitched across a batch
   boundary loses the one signal that would have rescued it. */
ok('hasWriting is read off the reply', api._markFields({ hasWriting: true, studentAnswer: '' }).wrote === true);
{
  const into = [];
  api._scanFoldRows([{ number: '8', question: 'A question that runs on', answer: '5', hasWriting: false }], 0, 1, into);
  api._scanFoldRows([{ continuation: true, question: 'and finishes here', answer: '5', hasWriting: true }], 1, 1, into);
  ok('…and writing seen on EITHER half of a stitched question counts',
     into.length === 1 && into[0].wrote === true);
}

/* The pages the repair call attaches are the batch's own, so an item from an
   earlier batch must never be carried into it — it would be marked against a
   page it is not printed on. */
{
  const all = [
    { kind: 'page', page: 1, question: 'earlier batch' },
    { kind: 'page', page: 4, question: 'this batch' },
    { kind: 'page', page: 6, question: 'this batch too' },
    { kind: 'page', page: 7, question: 'a later batch' },
    { kind: 'ask', page: 0, question: 'typed, no page at all' }
  ];
  const mine = api._markFixBatchItems(all, 3, 3);   // pages 4, 5, 6
  ok('only the questions printed on THIS batch go into the repair call',
     mine.length === 2 && mine[0].page === 4 && mine[1].page === 6);
}

/* It may only ever ADD marking, and that is structural rather than something
   the prompt asks for. */
{
  const it = { kind: 'page', wrote: true, marked: false, question: 'Q', answer: '7x + 12',
               explanation: 'the working', verdict: '', marks: '', feedback: '', studentAnswer: '' };
  const need = [true];
  api._applyMarkFix([it], [{ i: 0, studentAnswer: '6x + 12', verdict: 'wrong', marks: '0/2', feedback: 'Check the 17.' }], need);
  ok('a repair marks the question', it.marked === true && it.verdict === 'wrong' && it.studentAnswer === '6x + 12');
  ok('…and cannot touch the question, the answer or the explanation',
     it.question === 'Q' && it.answer === '7x + 12' && it.explanation === 'the working');
  ok('…and what it marked wrong is what the mistake book then keeps', api.mbIsWrong(it) === true);
}
{
  const it = { kind: 'page', wrote: true, marked: false, studentAnswer: '', verdict: '', marks: '', feedback: '' };
  api._applyMarkFix([it], [{ i: 0, studentAnswer: '', verdict: 'wrong', feedback: 'no' }], [true]);
  ok('a repair that agrees the question is untouched can never mark it wrong',
     it.marked === false && it.verdict === '');
}
/* A second opinion is not a better one: a verdict that already worked must
   not change under the student for no reason they can see. */
{
  const good = { kind: 'page', wrote: true, marked: true, verdict: 'correct', studentAnswer: '42', feedback: 'Well done.' };
  api._applyMarkFix([good], [{ i: 0, studentAnswer: '4.2', verdict: 'wrong', feedback: 'no' }], [false]);
  ok('a question that was already marked properly is left exactly as it was',
     good.verdict === 'correct' && good.studentAnswer === '42');
}
{
  const it = { kind: 'page', wrote: true, marked: false, studentAnswer: '', verdict: '', marks: '', feedback: '' };
  api._applyMarkFix([it], [{ i: 9, studentAnswer: 'x', verdict: 'wrong' }], [true]);
  ok('a row naming a question that is not in the batch is dropped, never applied to another',
     it.marked === false);
}

/* The repair is told the answer is already settled: a call that re-answered
   the paper would contradict the card it is being merged into. */
ok('the repair prompt hands the correct answer over and says not to change it',
   /do not change it/.test(api._markFixPrompt([{ number: '10(a)', question: 'Q', answer: '7x + 12', options: [] }])));
ok('…and the system prompt forbids re-answering and asks for pencil',
   /do not re-answer anything/.test(api.SCAN_MARK_FIX_SYS) &&
   /LOOK FOR PENCIL/.test(api.SCAN_MARK_FIX_SYS));
ok('…and refuses to mark a question nobody attempted',
   /a cross on a question nobody attempted is the worst thing you can do here/.test(api.SCAN_MARK_FIX_SYS));

/* Rationed per RUN, spent BEFORE the call, refilled in one place. Left
   unbounded this is the loop that spends a term's tokens on one paper. */
ok('the ration is bounded', api.SCAN_MARK_FIX_CALLS > 0 && api.SCAN_MARK_FIX_CALLS <= 3 && api.SCAN_MARK_FIX_MAX > 0);
ok('…spent BEFORE the call, so a failure cannot buy another try',
   /var need = mine\.map\(_itemNeedsMarking\);[\s\S]{0,180}_markFixLeft--;[\s\S]{0,600}await window\.askGemini\(_markFixPrompt/.test(html));
ok('…and refilled once per run, beside the algebra one',
   /_markFixLeft = SCAN_MARK_FIX_CALLS;/.test(html) &&
   html.match(/_markFixLeft = SCAN_MARK_FIX_CALLS;/g).length === 2);
ok('a reply that arrives after a newer run has started is dropped',
   /if \(run !== _scanRun\) return;                \/\/ a newer run owns the answers now[\s\S]{0,300}_applyMarkFix/.test(html));
/* It runs BEFORE the algebra rewrite, so feedback it has just written is
   rewritten free of algebra too. */
ok('the repair runs before the algebra rewrite',
   html.indexOf('await _markFixPass(run, batch, start') < html.indexOf('await _algebraPass(run, _answers, Math.min(start'));

/* The prompt has to ASK for the field, or the trigger can never fire. */
ok('the reading prompt asks for hasWriting per question', /"hasWriting":true/.test(api.SCAN_SYS));
ok('…and says it is about the paper, not about what it managed to read',
   /EVEN IF you ' \+\s*'cannot read it/.test(html) || /EVEN IF you/.test(api.SCAN_MARK_RULE));
ok('…and the maths standard says where a maths answer physically is',
   /PENCIL WORKING in the working/.test(api.SCAN_SUBJECT_RULE.math) &&
   /never report it as blank/.test(api.SCAN_SUBJECT_RULE.math));

/* And the whole point of fixing the marking: the mistake book fills itself
   from it. Wrong AND partial, automatically, on every run. */
ok('a wrong answer is kept', api.mbIsWrong({ kind: 'page', marked: true, verdict: 'wrong' }) === true);
ok('a PARTLY right answer is kept too', api.mbIsWrong({ kind: 'page', marked: true, verdict: 'partial' }) === true);
ok('a correct one is not', api.mbIsWrong({ kind: 'page', marked: true, verdict: 'correct' }) === false);
ok('a blank is not a mistake', api.mbIsWrong({ kind: 'page', marked: false, verdict: '' }) === false);
ok('the book is filled automatically at the end of every run, not on a button',
   /await mbFileRun\(run\);/.test(html));

/* =====================================================================
   📗 THE LEARNING LIST, and 💬 ASK MR CHUNG
   ---------------------------------------------------------------------
   Two lists in one collection, told apart by a field, because the shared
   firestore.rules would fail a new subcollection CLOSED — reads empty, writes
   denied, nothing on screen saying why. And a button that hands the question
   to WhatsApp, where the only failure that matters is silent: a picture that
   does not travel, or a message that does not say who is asking.
   ===================================================================== */
/* ---------- 📗 The learning list ---------- */
ok('an entry with no list at all reads as a mistake — every entry written before this',
   api.mbListOf({}) === api.MB_LIST_MISTAKE && api.mbIsLearning({}) === false);
ok('a learning entry says so', api.mbIsLearning({ list: 'learning' }) === true);
ok('anything else is a mistake, never a third list',
   api.mbListOf({ list: 'nonsense' }) === api.MB_LIST_MISTAKE);
ok('the two lists live in ONE collection, so no rules deploy is needed',
   api.MB_COL === 'scanMistakes' && !/collection\('scanLearning'\)/.test(html));
ok('a saved entry carries its list', /list: list,/.test(html) &&
   /list = \(list === MB_LIST_LEARNING\) \? MB_LIST_LEARNING : MB_LIST_MISTAKE;/.test(html));

/* The rule that makes the learning list a different thing from the mistake
   book, and the one that is easiest to lose: it must NEVER empty itself. A
   student put the question there knowing they could already do it, so
   clearing it on a right answer deletes the list the moment it starts
   working. */
ok('a learning entry is never cleared by getting it right',
   /async function mbNoteWin[\s\S]{0,420}if \(mbIsLearning\(entry\)\) return '';/.test(html));
ok('…and keeps no streak to reset either',
   /async function mbNoteMiss[\s\S]{0,200}if \(mbIsLearning\(entry\)\) return '';/.test(html));
ok('…and a run does not REPORT it as moving towards clearing',
   /if \(mbIsLearning\(entry\)\) \{ \/\* nothing to do \*\/ \}/.test(html));
ok('the automatic filing still only ever writes to the MISTAKE book',
   /mbSaveOne\(it, MB_LIST_MISTAKE\)/.test(html) &&
   !/mbSaveOne\(it, MB_LIST_LEARNING\)/.test(html));

/* EVERY question can now be kept, which is the whole point — until now the
   only way into the book was to get something wrong. */
api.user = { uid: 'u1', email: 'a@b.c' };
api.mistakes = [];
{
  const correct = { kind: 'page', marked: true, verdict: 'correct', question: 'A question they got right' };
  const blank   = { kind: 'page', marked: false, verdict: '', question: 'A question left blank' };
  const wrong   = { kind: 'page', marked: true, verdict: 'wrong', question: 'A question they got wrong' };
  [correct, blank, wrong].forEach(q => {
    const h = api.mbCardChipHtml(q);
    ok('a ' + (q.verdict || 'blank') + ' question offers BOTH lists',
       /📕 Add to mistake book/.test(h) && /📗 Add to learning list/.test(h));
  });
  ok('a typed answer offers neither — it was never on a paper',
     api.mbCardChipHtml({ kind: 'ask', question: 'x' }) === '');
}
/* Already in one list: it says WHICH, and offers no second copy. */
{
  const q = { kind: 'page', marked: true, verdict: 'correct', question: 'Kept to practise' };
  api.mistakes = [{ id: 'x1', key: api.mbKeyOf(q), list: 'learning', streak: 0 }];
  const h = api.mbCardChipHtml(q);
  ok('a question already in the learning list says so, and offers no second copy',
     /📗 In your learning list/.test(h) && !/Add to/.test(h));
  /* …while a MISTAKE-book question answered correctly gets the streak chip
     instead, because that list really does clear itself. The two must not be
     swapped: telling a learning entry "2 more and it clears" is a promise it
     never keeps. */
  api.mistakes = [{ id: 'x1', key: api.mbKeyOf(q), list: 'mistake', streak: 0 }];
  ok('…while a mistake-book question answered right is told how close it is to clearing',
     /2 more and it clears/.test(api.mbCardChipHtml(q)));
  api.mistakes = [{ id: 'x1', key: api.mbKeyOf(q), list: 'learning', streak: 0 }];
  ok('…and a learning entry answered right is NOT — that list never clears',
     !/more and it clears/.test(api.mbCardChipHtml(q)));
  const blankQ = { kind: 'page', marked: false, verdict: '', question: 'Left blank, kept anyway' };
  api.mistakes = [{ id: 'x2', key: api.mbKeyOf(blankQ), list: 'mistake', streak: 0 }];
  ok('…and one sitting in the mistake book, not just answered, says which list it is in',
     /📕 In your mistake book/.test(api.mbCardChipHtml(blankQ)));
}

/* The ticks drive one worksheet and one Remove button, so a row the student
   cannot see must never be in them — the vetting list's own rule. */
{
  api.mistakes = [
    { id: 'm1', list: 'mistake',  question: 'a' },
    { id: 'm2', list: 'learning', question: 'b' },
    { id: 'm3', list: 'mistake',  question: 'c' }
  ];
  ok('each tab shows only its own list',
     api.mbInList('mistake').length === 2 && api.mbInList('learning').length === 1);
  api.sel = { m1: true, m2: true, m3: true };
  api.mbSetTab('mistake');
  ok('switching tab clears the ticks rather than carrying them across',
     api.mbSelectedIds().length === 0 && api.tab === 'mistake');
  api.sel = { m1: true, m2: true };
  ok('…and the ticks that ARE read are scoped to the tab on show',
     api.mbSelectedIds().join() === 'm1');
}

/* ---------- 💬 Ask Mr Chung ---------- */
ok('the number is the one asked for, in full international form',
   api.ASK_WA_NUMBER === '6590223314');
ok('…and it is a constant, not typed into the url',
   /'https:\/\/wa\.me\/' \+ ASK_WA_NUMBER \+ '\?text='/.test(html));
{
  const m = { id: 'a1', level: 'p5', subject: 'math', number: '10(a)',
              question: 'Express the total number of seashells in terms of x.' };
  const t = api.mbAskText(m);
  ok('the message asks the question it was written to ask', /could you help me with this question please/.test(t));
  /* A picture arriving from an unknown number with "could you help me" is a
     message the teacher cannot act on. */
  ok('…and says WHO is asking', /a@b\.c|It is /.test(t));
  ok('…and which question, so it can be found on the paper', /10\(a\)/.test(t));
  const url = api.mbAskWaUrl(t);
  ok('the url is a wa.me chat with the text already in it',
     url.indexOf('https://wa.me/6590223314?text=') === 0 &&
     decodeURIComponent(url.split('?text=')[1]).indexOf('Dear Mr Chung') === 0);
  ok('a very long message is cut rather than making a url nothing will open',
     api.mbAskWaUrl('x'.repeat(5000)).length < 5000);
}
/* The honest limit, written down: a page cannot attach a file to a wa.me
   link, so the share sheet is the only route that really carries the picture
   — and every device that cannot do it still gets the question through. */
ok('the route is decided in ONE place, so the button can say which it is',
   (html.match(/function mbAskRoute\(/g) || []).length === 1);
ok('a device with no file sharing still sends the question, with a link to the picture',
   /window\.open\(mbAskWaUrl\(text \+ \(link \? '\\n' \+ link : ''\)\)/.test(html));
ok('…and that link points at the TYPESET sheet, falling back to the crop already in Storage',
   /var link = m\.img \|\| '';[\s\S]{0,320}_mbUpload\(pic,/.test(html));
ok('a share the student cancelled is not reported as a failure',
   /e\.name === 'AbortError'/.test(html));
ok('the button is on every row of BOTH lists', /mbAskChung\(/.test(html) &&
   /💬 Ask Mr Chung/.test(html));

/* The clean-up is deterministic and all-or-nothing: half-cleaning a picture
   is worse than leaving it alone, and a photograph of an experiment is the
   case where flattening the highlights destroys what is being asked about. */
{
  const px = (n, f) => { const a = new Uint8ClampedArray(n * 4); for (let i = 0; i < n; i++) f(a, i * 4, i); return a; };
  /* A photographed page: grey paper at ~205 with a bit of dark ink. */
  const page = px(1000, (a, o, i) => {
    const ink = i % 100 < 2;                     // 2% ink
    a[o] = a[o + 1] = a[o + 2] = ink ? 40 : 200 + (i % 7);
    a[o + 3] = 255;
  });
  ok('a photographed page is cleaned', api._askCleanPixels(page) === true);
  ok('…and its background really goes to pure white',
     page[20] === 255 && page[21] === 255 && page[22] === 255);   // pixel 5 is background
  ok('…and the ink is left alone', page[0] === 40);               // pixel 0 is ink
  /* A dark photograph is not a page and must be handed back untouched. */
  const dark = px(1000, (a, o) => { a[o] = a[o + 1] = a[o + 2] = 60; a[o + 3] = 255; });
  ok('a dark photograph is refused rather than half-cleaned', api._askCleanPixels(dark) === false);
  /* No line work at all — a photo of an experiment, not a worksheet. */
  const blank = px(1000, (a, o) => { a[o] = a[o + 1] = a[o + 2] = 250; a[o + 3] = 255; });
  ok('a picture with nothing written on it is refused', api._askCleanPixels(blank) === false);
  /* A pale wash of REAL colour is part of the drawing, never paper. */
  const blue = px(1000, (a, o, i) => {
    const ink = i % 100 < 2;
    if (ink) { a[o] = a[o + 1] = a[o + 2] = 40; }
    else { a[o] = 190; a[o + 1] = 205; a[o + 2] = 245; }   // pale blue water
    a[o + 3] = 255;
  });
  api._askCleanPixels(blue);
  ok('a pale wash of real colour survives — it is the drawing, not the page',
     !(blue[0] === 255 && blue[1] === 255 && blue[2] === 255));
}
ok('a hole stays a hole', /if \(px\[i \+ 3\] < 60\) continue; {26}\/\/ a hole stays a hole/.test(html));
ok('the clean-up is plain code, never an AI call',
   !/askGemini[\s\S]{0,40}_askClean/.test(html) &&
   /function _askCleanPixels[\s\S]{0,1600}return true;\n\}/.test(html));
api.mistakes = [];
api.user = null;

/* =====================================================================
   🖨 THE QUESTION, SET OUT AS A WORKSHEET
   ---------------------------------------------------------------------
   What goes to WhatsApp is no longer the raw crop: it is the rapid-add
   reproduction typeset the way the CER app's own "try again" sheet lays it
   out. There is no canvas in Node, so the DRAWING is exercised in a real
   headless browser by tools/ask-sheet-render.mjs; what is pinned here is the
   part that decides WHAT is drawn, and the fallbacks that stop it ever being
   a dead end.
   ===================================================================== */
/* ---------- The three tiers ---------- */
ok('blocks make it the reproduction — the whole point of the change',
   api._askTier({ blocks: [{ type: 'text', text: 'x' }] }) === 'built');
ok('a whole-question crop with no blocks is the crop',
   api._askTier({ blocks: [], img: 'u', shot: 'question' }) === 'whole');
ok('a figure crop falls to the transcription with the figure beside it',
   api._askTier({ blocks: [], img: 'u', shot: 'figure' }) === 'flat');
ok('nothing at all is still the transcription', api._askTier({}) === 'flat');
/* The tiers are the VIEWER's own — they have to stay in step, or the sheet a
   student is sent stops matching the sheet they get back on paper. */
ok('…and blocks outrank a crop, exactly as the viewer orders them',
   api._askTier({ blocks: [{ type: 'text', text: 'x' }], img: 'u', shot: 'question' }) === 'built');

/* The word list must not be printed under a picture that already carries the
   choices: four empty brackets under the options themselves reads as a fault
   in the sheet. The same `role: 'options'` contract the viewer reads. */
ok('a picture of the options is recognised',
   api._askPictureOptions([{ type: 'image', role: 'options', url: 'u' }]) === true);
ok('…and an ordinary figure is not',
   api._askPictureOptions([{ type: 'image', url: 'u' }]) === false);
ok('…and one with no url is not — nothing was drawn, so the words are still needed',
   api._askPictureOptions([{ type: 'image', role: 'options', url: '' }]) === false);
ok('the word list is held back only for a picture of the options',
   /var showOpts = opts\.length && tier !== 'whole' && !picOpts;/.test(html));

/* Every failure falls back rather than stopping. */
ok('a sheet that could not be drawn hands back nothing, and the crop is sent instead',
   /catch \(e\) \{\s*\n\s*console\.warn\('ask: the worksheet could not be drawn'[\s\S]{0,60}return '';/.test(html) &&
   /var pic = await askSheetFor\(m\);\s*\n\s*if \(!pic && m\.img\)/.test(html));
ok('a figure that would not load is SAID, not silently dropped',
   /a figure here could not be loaded/.test(html));
ok('a sheet with no wording, no picture and no options is refused outright',
   /if \(!hasWords && !figs\.__main && !Object\.keys\(figs\)\.length && !\(m\.options \|\| \[\]\)\.length\) return '';/.test(html));
ok('a crop is never drawn larger than its own pixels',
   /var w2 = Math\.min\(innerW, im\.width\)/.test(html));
ok('a very long question is still ONE picture', api.ASK_SHEET_MAX_H > 1000 &&
   /Math\.min\(ASK_SHEET_MAX_H, H \+ ASK_SHEET_PAD - 20\)/.test(html));

/* Storage urls are fetched to a data url before they are drawn: an <img> from
   another origin TAINTS the canvas, and a tainted canvas cannot be read back
   — which is the whole point of drawing it. */
ok('figures are fetched to a data url before they are drawn',
   /_askFetchDataUrl\(urls\[i\]\.url\)/.test(html) &&
   /async function _askFetchDataUrl[\s\S]{0,300}readAsDataURL/.test(html));
ok('…and a fetch that fails still lets the <img> have its own try',
   /catch \(e\) \{ return url; \}/.test(html));

/* The MCQ rule, straight from the viewer: options get the answer line alone,
   an open question gets the working box — and a whole-question crop gets the
   short one, because it brought the paper's own ruled space with it. */
ok('only an open question gets a working box', /if \(!opts\.length\) \{[\s\S]{0,140}t: 'box'/.test(html));
ok('…and a whole-question crop gets the short one',
   /var boxH = \(tier === 'whole'\) \? 90 : 190;/.test(html));

/* And it is what actually gets sent. */
ok('the sheet is what travels, not the crop',
   /var file = _askDataUrlToFile\(pic, 'question\.jpg'\)/.test(html));
ok('…and on a device that cannot share files, the LINK points at the sheet too',
   /_mbUpload\(pic, 'ask_' \+ m\.id/.test(html));

console.log((fails ? '✗ ' : '✓ ') + (ran - fails) + '/' + ran + ' checks passed');
process.exit(fails ? 1 : 0);
