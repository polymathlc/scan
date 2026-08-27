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
/* 👣 The working, handed over one step at a time. It is loaded on its own,
   out of the answers section, because everything around it paints the DOM: a
   reveal that quietly shows every step at once is a card that has given the
   answer away with nothing anywhere to say so, and one that shows none of
   them on Print is a worksheet with no working on it. */
const steps = section(
  '/* =====================================================================\n   👣 ONE STEP AT A TIME',
  'function answerCardHtml(');
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
/* The ONE painter. The step reveal repaints through it, so the harness needs
   it to exist — what it draws is pinned separately, off stepsBoxHtml. */
function renderAnswers() {}
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

const api = new Function(prelude + json + grounding + scan + steps + report + book + vet + authFns + `
  return {
    set notes(v) { teachingNotes = v; },
    set style(v) { aiStyle = v; },
    set meta(v) { wsMeta = v; },
    get meta() { return wsMeta; },
    noteAppliesHere, noteSubjects, notesRelevant, notesBlock, guidanceBlock, styleBlock,
    aiGrounding, groundingSummary, notesKeywordList,
    _parseAIJson, _scanNewItem, _scanFoldRows, _scanStr, _scanPrompt, scanSubjectRule,
    _scanSteps, _stepsText, _stepsShown, SCAN_STEPS_MAX, SCAN_STEPS_RULE,
    stepsBoxHtml, stepNext, stepAll, stepReset, stepsAnyCard, stepsAllOpen, stepAllCards,
    _askPrompt, _askNewItem, _askFoldRows, _markFields, micAvailable, micLang,
    _ansEditApply, _ansEditNote, _ansTrim, _ansNoteTitle, _ansOptionFrom,
    pdfIsPdf, pdfPageScale, PDF_MIN_SCALE, PDF_MAX_SCALE, PDFJS_URL, PDFJS_WORKER,
    _keyRow, keyNumKey, _keyFold, _keyBlock, _keySourceOf, SCAN_KEY_SYS, _keyPrompt,
    SCAN_KEY_MIN_PAGES, SCAN_KEY_BATCH, SCAN_KEY_CALLS, SCAN_KEY_MAX_ROWS, SCAN_KEY_ANS_CHARS,
    set scanKey(v) { _scanKey = v; },
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
    mbAskText, mbAskWaUrl, mbAskRoute, _askCleanPixels, _askHasWorking,
    ASK_WA_NUMBER, ASK_CLEAN_DEPTH, ASK_CLEAN_BAND_MAX,
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
    STU_COL, scanForUid, scanForName, stuAllowed, stuRowHtml,
    set asStudent(v) { _asStudent = v; },
    get asStudent() { return _asStudent; },
    set stuRows(v) { _stuRows = v; },
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
   /done\.disabled = busy \|\| \(!ready\.length && !ask\);/.test(html));
/* Splitting a PDF holds the buttons exactly as a run does: a second pile
   queued on top of one still being rendered is pages in the wrong order, and
   the order IS the page numbers every answer cites. */
ok('…and is held while a PDF is being split into pages',
   /var busy = _scanning \|\| _pdfBusy;/.test(html));
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
   /applyNotesVisibility\(\);[\s\S]{0,1600}if \(_answers\.length\) renderAnswers\(\);/.test(html));
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
/* 👥 The book is read from whoever the run is FOR — the teacher, or the
   student they are scanning for at the centre. `scanForUid()` is the one door
   and every other path stays with the signed-in account. */
ok('the book is read from whoever the run is for',
   /db\.collection\('users'\)\.doc\(scanForUid\(\)\)\.collection\(MB_COL\)/.test(html));

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

/* ---------- 👥 SCANNING FOR A STUDENT AT THE CENTRE ----------
   A student comes in with a paper; the teacher scans it on the centre's own
   device and every question they got wrong should land in THEIR book. The one
   thing this can get wrong is filing a paper under the wrong child, and it is
   silent — so the door is one function and the banner is always on screen. */
ok('the roster is the one the centre already has, not a second list',
   api.STU_COL === 'studentProfiles');
{
  api.asStudent = null;
  api.user = { uid: 'admin1', email: 'chungzhikai@gmail.com' };
  ok('with nobody chosen the book is the signed-in account’s own',
     api.scanForUid() === 'admin1' && api.scanForName() === '');
  api.asStudent = { id: 'stu_9', name: 'Ben' };
  ok('…and with a student chosen it is theirs',
     api.scanForUid() === 'stu_9' && api.scanForName() === 'Ben');
  api.asStudent = null;
}
/* IT IS NOT AN IMPERSONATION. Exactly three things move — which book is read,
   which book is written, which Storage folder the crops go to. Everything
   below stays the SIGNED-IN account's, and each one is a real fault if it
   follows: the teaching notes ground every answer, the vetting lists are the
   teacher's own question banks, and `scanPapers.owner` is pinned to
   `request.auth.uid` by the Firestore rules themselves. */
ok('the crops go to the book they are filed in',
   /storage\.ref\(MB_IMG_PATH \+ '\/' \+ scanForUid\(\)/.test(html));
ok('…but the teaching notes stay the TEACHER’s',
   !/notesCollRef\(scanForUid\(\)\)/.test(html) &&
   /notesCollRef\(currentUser\.uid\)/.test(html));
ok('…and the vetting lists do too',
   /db\.collection\('users'\)\.doc\(currentUser\.uid\)\.collection\(t\.col\)/.test(html));
ok('…and the worksheet is owned by whoever made it, as the rules demand',
   /owner: currentUser\.uid,/.test(html));
/* Hiding a button is never the lock: this one writes into another account's
   subtree, so the handlers ask again. */
ok('only the teacher may open the roster or scan for anyone',
   /function stuAllowed\(\) \{ return isAdmin\(currentUser\); \}/.test(html) &&
   /function stuOpen\(\) \{\s*\n\s*if \(!stuAllowed\(\)\) return;/.test(html) &&
   /function stuStart\(i\) \{\s*\n\s*if \(!stuAllowed\(\)\) return;/.test(html) &&
   /async function stuAdd\(\) \{\s*\n\s*if \(!stuAllowed\(\)\) return;/.test(html));
{
  api.user = { uid: 'kid1', email: 'kid@example.com' };
  ok('a student is refused outright', !api.stuAllowed());
  api.user = { uid: 'admin1', email: 'chungzhikai@gmail.com' };
  ok('…and the teacher is not', api.stuAllowed());
}
/* An account change drops it, always. A device signed out and back in as
   somebody else must not go on filing papers into a child's book. */
ok('an account change drops the student being scanned for',
   /if \(!stuAllowed\(\) && _asStudent\) \{ _asStudent = null; _stuPrevMeta = null; mbForget\(\); \}/.test(html));
/* Switching REREADS. A badge left over from the last child is a count of
   somebody else's mistakes sitting on screen under this one's name. */
ok('starting and stopping both forget the book and read it again',
   (html.match(/mbForget\(\);[^\n]*\n\s*mbLoad\(true\);/g) || []).length === 2);
/* The level and the subject are what the answers are pitched at AND what the
   teaching notes are matched against, so a P3 paper must not be answered to
   whatever the picker was left on — and the teacher's own choice comes back. */
ok('the student’s level and subject are used while scanning for them',
   /if \(r\.level && LEVELS\.indexOf\(r\.level\) !== -1\) \$\('scanLevel'\)\.value = r\.level;/.test(html));
ok('…and the teacher’s own are put back on ↩',
   /_stuPrevMeta = \{ level: \$\('scanLevel'\)\.value \|\| '', subject: \$\('scanSubject'\)\.value \|\| '' \}/.test(html) &&
   /\$\('scanLevel'\)\.value = _stuPrevMeta\.level;/.test(html));
/* A run in flight owns the pages and the answers. Switching under it would
   file half a paper in one book and half in another. */
ok('the student cannot be switched mid-run',
   (html.match(/if \(_scanning\) \{ toast\('Finish reading this paper first\./g) || []).length === 2);
/* THE BANNER IS THE SAFETY. */
ok('who the run is for is on screen the whole time, not in a menu',
   /id="stuBar"/.test(html) && /id="stuBarWho"/.test(html) &&
   /bar\.classList\.toggle\('hidden', !_asStudent\)/.test(html));
{
  /* A managed student's book is the CENTRE's record of them; a student with
     their own account gets it on their own phone. A teacher who thinks it is
     the second and it is the first finds out weeks later. */
  api.asStudent = null;
  const managed = api.stuRowHtml({ id: 'managed_x', name: 'Ben', level: 'P5', subject: 'math', managed: true }, 0);
  const real = api.stuRowHtml({ id: 'uid_x', name: 'Mei', level: 'P4', subject: 'science', managed: false }, 1);
  ok('the roster says which rows have an account of their own',
     /kept at the centre/.test(managed) && /has their own account/.test(real));
  ok('…and a row with no name is still shown rather than dropped',
     /\(no name yet\)/.test(api.stuRowHtml({ id: 'z', name: '', managed: false }, 2)));
  api.asStudent = { id: 'uid_x', name: 'Mei' };
  ok('the row being scanned for offers ↩ Stop rather than a second start',
     /stuStop\(\)/.test(api.stuRowHtml({ id: 'uid_x', name: 'Mei', managed: false }, 1)));
  api.asStudent = null;
}
/* THE ROSTER WAS PRINTED AS "[object Object]", the whole way down the window.
   `.then(stuRender)` hands the RESOLVED ARRAY to stuRender's first parameter,
   which is the error MESSAGE — so every student was stringified into the
   error paragraph and not one row was drawn. It is called with nothing. */
ok('the roster is drawn, not handed to the error slot',
   /stuLoad\(true\)\.then\(function \(\) \{ stuRender\(\); \}\)/.test(html));
/* An error message is TEXT. Anything else reaching that parameter is a caller
   passing something it should not — a promise's value, an Error object — and
   printing it at the teacher is exactly how the wall of "[object Object]"
   happened. The guard is the structural half of the fix. */
ok('…and a non-string can never be printed as one',
   /if \(typeof err === 'string' && err\) \{ body\.innerHTML/.test(html));
ok('a real error message still is', /stuRender\(String\(\(e && e\.message\)/.test(html));

/* 🟠 THE CENTRE'S OWN MARK. The tab and a home-screen shortcut had no icon at
   all before this, and the header wore an emoji. */
ok('the header wears the Polymath logo',
   /class="brandLogo" src="https:\/\/dl\.dropboxusercontent\.com\/scl\/fi\/h40yjlyg8ldefwfaa3dib\/polymath-logo-sticker\.png/.test(html));
ok('…the same picture the Science portal uses', (function () {
  const cer = fs.readFileSync(new URL('../../cer/index.html', import.meta.url), 'utf8');
  const mine = (html.match(/https:\/\/dl\.dropboxusercontent\.com\/scl\/fi\/[^"']+polymath-logo-sticker\.png[^"']*/) || [])[0];
  return !!mine && cer.indexOf(mine) >= 0;
})());
/* A broken-image icon in the header of every page is worse than the emoji it
   replaced, and this app is opened on school connections. */
ok('…and falls back to a drawn mark rather than a broken image',
   /onerror="this\.onerror=null;this\.src='data:image\/svg\+xml/.test(html));
ok('the tab and a home-screen shortcut have an icon now',
   /<link rel="icon" href="https:\/\/dl\.dropboxusercontent\.com/.test(html) &&
   /<link rel="apple-touch-icon" href="https:\/\/dl\.dropboxusercontent\.com/.test(html));
/* A logo of any other shape must not be stretched into its box. */
ok('the logo is contained, never stretched', /\.brandLogo \{[^}]*object-fit: contain/.test(html));
/* NOTHING SITS BEHIND THE LOGO. The accent-coloured rounded square was there
   for the EMOJI that used to be in it — a glyph needs something to sit on and
   a logo does not, so a tile behind one is a second badge around a badge. And
   with no background the radius and the clipping only crop the corners off a
   logo that is not square. */
ok('the mark has no coloured tile behind the logo',
   !/\.brandMark \{[^}]*background:/.test(html));
ok('…and nothing to crop its corners with',
   !/\.brandMark \{[^}]*border-radius:/.test(html) &&
   !/\.brandMark \{[^}]*overflow:/.test(html));

/* A child added at the centre has no Google account, so the id is the SAME
   shape the Ans Key annotator makes — one student, one row, both apps. */
ok('a centre-added student uses the shared managed id shape',
   /var id = 'managed_' \+ Date\.now\(\)/.test(html));
/* The message names whose question it is. A picture arriving under the
   teacher's own name is a message about a paper he is holding. */
ok('💬 Ask Mr Chung names the STUDENT when the run is for one',
   /if \(_asStudent\) return scanForName\(\);/.test(html));
ok('the 📕 button says whose book it is',
   /lab\.textContent = _asStudent \? scanForName\(\) \+ '\\u2019s questions'/.test(html));
/* No rules change was needed and none may be assumed: the paths this uses are
   already `isOwner(uid) || isAdmin()`. A NEW collection would fail closed. */
ok('nothing new is written outside the paths the rules already cover',
   !/collection\('scanStudents'\)/.test(html) && !/collection\('scanRoster'\)/.test(html));

/* ---------- 📄 A PDF IS A PILE OF PAGES ----------
   A parent asked for this by name: the child uploads the PDF he did his
   working on. Every failure below is silent and the run still finishes — it
   simply finishes short, and a run that came back with 18 questions when the
   paper had 25 looks exactly like a run that worked. */
ok('a PDF is recognised by its type', api.pdfIsPdf({ type: 'application/pdf', name: 'paper.pdf' }));
/* Some phones and some Drive exports hand over a PDF with no type at all, and
   a PDF that reads as "not a picture" is refused as a file it cannot use. */
ok('…and by its name when the browser gives no type',
   api.pdfIsPdf({ type: '', name: 'P5 Maths Paper 2.PDF' }));
ok('a picture is not a PDF', !api.pdfIsPdf({ type: 'image/jpeg', name: 'page.jpg' }));
ok('a spreadsheet is neither', !api.pdfIsPdf({ type: 'text/csv', name: 'marks.csv' }));

/* THE WHOLE READ RESTS ON THE SMALL PRINT. A PDF page is measured at 72dpi,
   so an A4 rendered at scale 1 is 595px across and "$140.20" and "$14.20" are
   the same handful of pixels. Too small and every answer is a guess; too big
   and the canvas is megabytes per page for no more legibility. */
{
  const a4 = api.pdfPageScale(595, 842);
  ok('an A4 page is rendered well above its own size', a4 > 2.5, a4);
  ok('…and its long side lands on the photo ceiling',
     Math.abs(842 * a4 - 2200) < 1, 842 * a4);
  ok('a poster-sized page is capped rather than blowing the canvas',
     api.pdfPageScale(2000, 3000) <= api.PDF_MAX_SCALE);
  ok('a tiny page is still rendered bigger than itself',
     api.pdfPageScale(200, 260) >= api.PDF_MIN_SCALE);
  ok('a page with no size does not come back as zero',
     api.pdfPageScale(0, 0) >= api.PDF_MIN_SCALE);
}
/* IT IS SPLIT INTO PAGES AND NOT SENT WHOLE. Gemini will take a PDF as one
   attachment, and that is exactly how a page gets skipped — a twenty-page
   document arrives as one blur and the model answers the questions it
   noticed. The batching is what makes the read exhaustive, and it can only
   work on pages. A whole PDF would also lock Kimi out entirely. */
ok('every page goes through the ONE queue, as an ordinary picture',
   /pdfToFiles\(f, room - live/.test(html) && /_filesToPages\(files, room0\)/.test(html));
/* The strip IS the order of the paper, so a page that would not render is a
   failed card WHERE IT BELONGS — one swept to the front sends a teacher
   looking for the wrong page. */
ok('…and a failed page keeps its place in the pile',
   /if \(f && f\.dead\) \{[\s\S]{0,240}?status: 'error'/.test(html));
ok('…and what reaches the queue is a PICTURE, never the PDF itself',
   /new File\(\[arr\], name, \{ type: 'image\/jpeg' \}\)/.test(html));
/* A page that will not render is a FAILED CARD. A page that vanishes reads as
   one that was read and had nothing on it, which is the one thing this must
   never do. */
ok('a page that would not render is pushed as a failed card, never skipped',
   /status: 'error', err: 'this page would not open'/.test(html));
ok('…and the pages that would not open are named',
   /' of “' \+ \(f\.name \|\| 'that PDF'\) \+ '” would not open/.test(html));
ok('a document longer than there is room for says how many were left out',
   /has ' \+ res\.total \+ ' pages and only the first '/.test(html));
ok('a PDF that could not be opened at all says why', /could not be opened — ' \+/.test(html));
/* A PDF page is transparent where nothing is drawn, and a transparent canvas
   flattens to BLACK in a JPEG — the whole page, ink and all. */
ok('the page is painted white before it is drawn',
   /ctx\.fillStyle = '#fff';\s*\n\s*ctx\.fillRect\(0, 0, c\.width, c\.height\);\s*\n\s*await page\.render/.test(html));
ok('…and rendered as JPEG, never PNG', /c\.toDataURL\('image\/jpeg', SCAN_JPEG_Q\)/.test(html));
/* pdf.js DETACHES the buffer it is handed: pass the original and a second
   read of the same file throws on an empty ArrayBuffer. */
ok('pdf.js is handed a COPY of the bytes', /getDocument\(\{ data: buf\.slice\(0\) \}\)/.test(html));
/* This app opens on a camera on a phone. Half a megabyte of library on every
   load, for a feature most runs never touch, is the wrong trade. */
ok('pdf.js is loaded only when a PDF is really chosen',
   !/<script src="[^"]*pdf\.min\.js/.test(html) && /sc\.src = PDFJS_URL/.test(html));
ok('…and its worker is pointed at before it is used',
   /GlobalWorkerOptions\.workerSrc = PDFJS_WORKER/.test(html));
ok('…and a failed load is not remembered as a failure for ever',
   /_pdfjsLoading\.catch\(function \(\) \{ _pdfjsLoading = null; \}\)/.test(html));
ok('the worker and the library are the same version',
   api.PDFJS_URL.replace('pdf.min.js', '') === api.PDFJS_WORKER.replace('pdf.worker.min.js', ''));
ok('a PDF can be chosen from the gallery button',
   /id="galleryInput" accept="application\/pdf,image\/\*"/.test(html));

/* ---------- 🔑 THE PAPER'S OWN ANSWER KEY ----------
   "Mark it with reference to the answer in the pdf." The key beside a
   question is in the same batch and needs nothing; the key at the BACK is a
   problem of batching — the call marking page 1 has never seen page 11 and
   never will, whatever the prompt says. So it is read first, in its own pass,
   and handed to every batch as text. */
ok('the key pass runs before a single question is marked',
   /_scanKey = await _scanKeyPass\(run, shots\);[\s\S]{0,900}?await _runPages\(/.test(html));
ok('…and every batch is told what it found', /_keyBlock\(_scanKey\) \+/.test(html));
ok('…and last paper’s key never marks this one',
   /_scanKey = null; +\/\/ last paper's key must never mark this one/.test(html));
/* It only runs where a key could be somewhere the batch cannot see. One or
   two photographed pages cannot hide a marking scheme, and spending a second
   pass on the commonest case buys nothing. */
ok('the pass stands down on a paper too short to hide a key',
   /if \(shots\.length < SCAN_KEY_MIN_PAGES\) return null;/.test(html) &&
   api.SCAN_KEY_MIN_PAGES >= 2);
/* THE RATION IS PER RUN and is spent BEFORE the call, so a failure cannot buy
   another try — the trap every other pass in this file is built around. */
ok('the ration is spent before the call, not after',
   /if \(_keyCallsLeft <= 0\) break;\s*\n\s*_keyCallsLeft--;/.test(html));
ok('…and refilled once per run and nowhere else',
   (html.match(/_keyCallsLeft = SCAN_KEY_CALLS/g) || []).length === 1);
/* It TRANSCRIBES. A transcriber told what the answer should say writes that
   down instead of what is on the page, so this call is deliberately the one
   that is not grounded in the teaching notes — and it must never solve. */
ok('the key pass is deliberately ungrounded',
   /system: SCAN_KEY_SYS,/.test(html) && !/SCAN_KEY_SYS \+ aiGrounding/.test(html));
ok('…and is told to transcribe, never to solve',
   /TRANSCRIBE, NEVER SOLVE/.test(api.SCAN_KEY_SYS));
ok('…and never to invent a row', /never invent a row/.test(api.SCAN_KEY_SYS));
ok('…and that a child’s handwriting is not a key',
   /Handwriting is not a key/.test(api.SCAN_KEY_SYS));
ok('…and a page of questions with nothing filled in is not one',
   /A page of QUESTIONS with nothing filled in is not a key/.test(api.SCAN_KEY_SYS));
ok('the key call never asks for a page it was not given',
   /return \{"keyPages":\[\],"rows":\[\]\}/.test(api.SCAN_KEY_SYS));

/* A row is a number AND an answer. Either half missing is a row that can
   never be matched to a question, or one that says nothing about it. */
ok('a row needs both halves',
   !api._keyRow({ number: '16' }) && !api._keyRow({ answer: '24 g' }) &&
   !!api._keyRow({ number: '16', answer: '24 g' }));
ok('a very long "answer" is cut rather than filling the prompt',
   api._keyRow({ number: '1', answer: 'x'.repeat(5000) }).answer.length <= api.SCAN_KEY_ANS_CHARS);
/* A paper and its marking scheme almost never number a question the same way
   twice — the exam paper builder in the Learning Portal collapses them the
   same way. */
ok('"Q12 (b)", "12b" and "12(B)" are one question',
   api.keyNumKey('Q12 (b)') === api.keyNumKey('12b') &&
   api.keyNumKey('12b') === api.keyNumKey('12(B)'));
ok('…and 12 is not 121', api.keyNumKey('12') !== api.keyNumKey('121'));
{
  /* Deduped by number: a marking scheme photographed twice, or a page sent
     twice, must not put the same answer in the block twice. */
  const k = api._keyFold([
    { number: '16', answer: '24 g' },
    { number: '16', answer: 'twenty-four grams' },
    { number: '17', answer: '(2)' },
    { number: '', answer: 'orphan' },
    { number: '18', answer: '' }
  ]);
  ok('the same number is kept once, first one wins',
     k.rows.length === 2 && k.byNum[api.keyNumKey('16')] === '24 g', JSON.stringify(k.rows));
  ok('…and a half-row never reaches the block',
     !k.rows.some(r => !r.number || !r.answer));
  const big = api._keyFold(Array.from({ length: 400 }, (_, i) => ({ number: 'q' + i, answer: 'a' })));
  ok('a runaway key is capped', big.rows.length === api.SCAN_KEY_MAX_ROWS, big.rows.length);
}
/* The block is only ever built when rows were really found, so a run with no
   key carries not one extra character — and the authority rule sits with the
   rows for the same reason: a paragraph about a key that is not there is
   noise on every other run. */
ok('no key means no block at all',
   api._keyBlock(null) === '' && api._keyBlock({ rows: [], pages: [] }) === '');
{
  const block = api._keyBlock({ rows: [{ number: '16', answer: '24 g' }], pages: [9, 10], byNum: {} });
  ok('the block gives the key row by row', /16 → 24 g/.test(block));
  ok('…and says which pages it came off', /pages 9, 10/.test(block));
  /* THE KEY IS THE AUTHORITY ON WHAT THE ANSWER IS, NOT ON HOW IT MUST BE
     WORDED. A key says "24 g" and a child who wrote "24 grams" is right; a
     key says "it evaporates" and "it turns into water vapour" is right. Lose
     this and the app marks on characters, which is worse than not marking. */
  ok('…and that the key decides the answer', /USE IT FIRST/.test(block));
  ok('…but that marking is on MEANING, not on matching its characters',
     /Mark on MEANING/.test(block) && /Never mark a student wrong for not/.test(block));
  ok('…and that the teacher’s own marking standards decide what is acceptable',
     /marking standards you were given above/.test(block));
  /* A printed key can hold a misprint. The key stands — it is the paper
     speaking — but a disagreement resolved silently either way is the one
     thing a marked script must not do. */
  ok('…and that a disagreement is SAID rather than resolved in silence',
     /IF YOUR OWN WORKING DISAGREES/.test(block) && /"keyNote"/.test(block));
  ok('…and that the key pages are not returned as questions',
     /DO NOT RETURN THE ANSWER-KEY PAGES AS QUESTIONS/.test(block));
}
/* 🔑 is only worth anything if a teacher can trust it. A model that stamps
   "key" on a run with no key in it would put the badge on every card. */
{
  api.scanKey = null;
  ok('🔑 is refused on a run with no key and no answer',
     api._keySourceOf({ answerSource: 'key', answer: '' }) === '');
  ok('…but the INLINE case still earns it — a key printed beside the question',
     api._keySourceOf({ answerSource: 'key', answer: '24 g' }) === 'key');
  api.scanKey = { rows: [{ number: '1', answer: 'a' }], pages: [9], byNum: {} };
  ok('…and a run that really read a key earns it',
     api._keySourceOf({ answerSource: 'key', answer: '24 g' }) === 'key');
  ok('"worked" is never a key', api._keySourceOf({ answerSource: 'worked', answer: 'x' }) === '');
  ok('…and neither is a missing field', api._keySourceOf({ answer: 'x' }) === '');
  api.scanKey = null;
}
/* A teacher who has just rewritten the answer owns it: leaving 🔑 on the card
   would claim the paper's key said something it did not. */
{
  const it = { answer: '24 g', answerSource: 'key', keyNote: 'I make it 25 g.', marked: false, options: [] };
  api._ansEditApply(it, { answer: '25 g', explanation: '' });
  ok('rewriting the answer takes 🔑 off the card',
     it.answerSource === '' && it.keyNote === '');
  const same = { answer: '24 g', answerSource: 'key', keyNote: 'note', marked: false, options: [] };
  api._ansEditApply(same, { answer: '24 g', explanation: 'why' });
  ok('…and leaving it alone keeps it', same.answerSource === 'key' && same.keyNote === 'note');
}
/* An answer-key page returns no questions, which is the key doing its job —
   not a page that failed. Said as "nothing on this page" it reads as a page
   the app could not manage. */
ok('a key page says what it is rather than "nothing on this page"',
   /if \(s\.status === 'key'\) return '🔑 answer key';/.test(html) &&
   /_scanKey\.pages\.indexOf\(start \+ k \+ 1\) >= 0 \? 'key' : 'empty'/.test(html));
/* A phone has no hover, so the disagreement is on the card as well as in the
   chip's title — a warning nobody can read is not a warning. */
ok('the disagreement is printed on the card, not only in a tooltip',
   /class="keyNoteBox"/.test(html));
ok('the repair pass is told when an answer came off the key',
   /the paper's own answer key" : 'already worked out'/.test(html));

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
   link — there is no parameter, no API and no trick — so there are exactly
   two routes, and which one the BUTTON takes is the whole decision.

   It takes the one that lands in Mr Chung's own chat, because hunting for
   WhatsApp in a share sheet and then scrolling a contact list is the part a
   student gives up on. Turn that back into the share sheet by default and the
   button still works perfectly and is still the thing nobody finishes. */
ok('the route is decided in ONE place, so 📎 is only drawn where it can work',
   (html.match(/function mbAskRoute\(/g) || []).length === 1);
ok('the button opens MR CHUNG\'S OWN CHAT — no share sheet, nothing to scroll',
   /_askGoTo\(win, mbAskWaUrl\(text \+ \(link \? '\\n' \+ link : ''\)\)\)/.test(html));
ok('…and the share sheet is only ever reached by asking for it',
   /if \(attach && pic && mbAskRoute\(\) === 'share'\)/.test(html));
ok('…so the default mode is the direct one', /var attach = mode === 'attach';/.test(html));
ok('📎 asks for the attach route by name',
   /mbAskChung\(\\'' \+ m\.id \+ '\\', \\'attach\\'\)/.test(html));
ok('…and is drawn ONLY where the device can really share a file',
   /mbAskRoute\(\) === 'share'\s*\n\s*\? '<button class="btn btnGhost mbAskAttach"/.test(html));
ok('…and that link points at the TYPESET sheet, falling back to the crop already in Storage',
   /var link = m\.img \|\| '';[\s\S]{0,320}_mbUpload\(pic,/.test(html));
/* THE TAB IS CLAIMED INSIDE THE CLICK. The sheet is drawn and uploaded first,
   so by the time the link exists the user gesture has gone: a window.open()
   after the await is a blocked popup on iOS Safari, and a blocked popup reads
   as a button that does nothing at all — on the phones this is FOR. */
ok('the tab is opened at the press, before anything is awaited',
   /var win = attach \? null : _askClaimTab\(\);[\s\S]{0,200}?try \{/.test(html));
ok('…and a claimed tab that was never used is closed, not left blank',
   /if \(win && !win\.closed\) \{ try \{ win\.close\(\); \}/.test(html));
ok('…and a tab that could not be claimed still opens WhatsApp',
   /window\.open\(url, '_blank', 'noopener'\);/.test(html));
ok('a share the student cancelled is not reported as a failure',
   /e\.name === 'AbortError'/.test(html));
ok('the button is on every row of BOTH lists', /mbAskChung\(/.test(html) &&
   /💬 Ask Mr Chung/.test(html));

/* ---------- CROP ONLY. DO NOT CLEAN. ----------
   Cleaning a scanned page is not reliably an improvement, and it went wrong
   in the one way that matters: the clamp reads "near the paper's white" as
   paper, and a student's own PENCIL WORKING is near the paper's white. A page
   at 205 with pencil at 175 had every stroke of that working snapped to pure
   white while the printed text, being far darker, came through untouched —
   so the picture that reached the teacher was the question with the child's
   work rubbed off it, which is the one thing he needed to see.

   So it is OFF unless there is working on the picture, and when it does run
   it is a shallow, colour-preserving lift that provably keeps the working. */
ok('nothing written on it means no clean at all — the crop goes as it was cut',
   /function _askClean\(dataUrl, on\) \{\s*\n\s*if \(!on\) return Promise\.resolve\(dataUrl\);/.test(html));
ok('…and working on it is what turns it on',
   api._askHasWorking({ studentAnswer: '7x + 12' }) === true &&
   api._askHasWorking({ verdict: 'wrong' }) === true &&
   api._askHasWorking({}) === false);
ok('…read at both call sites, never assumed',
   (html.match(/_askClean\(raw, _askHasWorking\(m\)\)/g) || []).length === 2);
ok('the band is NARROW — the deep one is what erased the pencil',
   api.ASK_CLEAN_DEPTH <= 20);

{
  const px = (n, f) => { const a = new Uint8ClampedArray(n * 4); for (let i = 0; i < n; i++) f(a, i * 4, i); return a; };
  const W = 40;                                   // the rows the neighbour test walks
  /* A photographed page: grey paper at ~205 with a bit of dark ink. */
  const page = px(1000, (a, o, i) => {
    const ink = i % 100 < 2;                     // 2% ink
    a[o] = a[o + 1] = a[o + 2] = ink ? 40 : 200 + (i % 7);
    a[o + 3] = 255;
  });
  ok('a flat page with working on it is still lifted', api._askCleanPixels(page, W) === true);
  ok('…and its background really goes to pure white',
     page[4 * 20] === 255 && page[4 * 20 + 1] === 255);          // pixel 20 is background
  ok('…and the ink is left alone', page[0] === 40);               // pixel 0 is ink

  /* THE ONE THAT MATTERS. Faint pencil sits just under the paper's white, so
     a deep band eats it. Not one pencil pixel may be whitened. */
  const pencil = px(2000, (a, o, i) => {
    const printed = i % 200 < 2;                  // dark printed text
    const pencilled = i % 200 >= 100 && i % 200 < 112;   // faint working
    a[o] = a[o + 1] = a[o + 2] = printed ? 45 : (pencilled ? 175 : 205);
    a[o + 3] = 255;
  });
  const before = pencil.filter((v, k) => k % 4 === 0 && v > 150 && v < 195).length;
  api._askCleanPixels(pencil, W);
  const after = pencil.filter((v, k) => k % 4 === 0 && v > 150 && v < 195).length;
  ok('a page with pencil working on it never loses a stroke of it', after === before, before + ' → ' + after);

  /* A shadow gradient is most real photographs, and it puts a real share of
     the picture inside the band — which is not paper, so the whole pass is
     refused and the crop goes as it is. */
  const shadow = px(4000, (a, o, i) => {
    const ink = i % 400 < 3;
    a[o] = a[o + 1] = a[o + 2] = ink ? 45 : Math.round(212 - (i / 4000) * 26);
    a[o + 3] = 255;
  });
  ok('a page with a shadow across it is refused — cleaning it is guesswork',
     api._askCleanPixels(shadow, W) === false);

  /* A dark photograph is not a page and must be handed back untouched. */
  const dark = px(1000, (a, o) => { a[o] = a[o + 1] = a[o + 2] = 60; a[o + 3] = 255; });
  ok('a dark photograph is refused rather than half-cleaned', api._askCleanPixels(dark, W) === false);
  /* No line work at all — a photo of an experiment, not a worksheet. */
  const blank = px(1000, (a, o) => { a[o] = a[o + 1] = a[o + 2] = 250; a[o + 3] = 255; });
  ok('a picture with nothing written on it is refused', api._askCleanPixels(blank, W) === false);
  /* COLOUR SURVIVES — a blue pen, a highlighter, a pale wash of water are all
     part of what is being asked about. */
  const blue = px(1000, (a, o, i) => {
    const ink = i % 100 < 2;
    if (ink) { a[o] = a[o + 1] = a[o + 2] = 40; }
    else { a[o] = 190; a[o + 1] = 205; a[o + 2] = 245; }   // pale blue water
    a[o + 3] = 255;
  });
  api._askCleanPixels(blue, W);
  ok('a pale wash of real colour survives — it is the drawing, not the page',
     !(blue[0] === 255 && blue[1] === 255 && blue[2] === 255));
}
ok('a stroke and its own anti-aliased edge are spared by construction',
   /if \(nearInk\(j\)\) continue;/.test(html));
ok('a hole stays a hole', /if \(px\[i \+ 3\] < 60\) continue; {26}\/\/ a hole stays a hole/.test(html));
ok('the clean-up is plain code, never an AI call',
   !/askGemini[\s\S]{0,40}_askClean/.test(html) &&
   /function _askCleanPixels[\s\S]{0,3200}return true;\n\}/.test(html));
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


/* =====================================================================
   👣 ONE STEP AT A TIME — and 🏷 the subject said on the card
   ---------------------------------------------------------------------
   Every way this goes wrong is silent and the card looks finished either
   way. A reveal that shows every step at once has handed the whole solution
   to a student who pressed Next once. A reveal that shows none of them on
   PAPER prints a worksheet with no working on it. An answer left sitting
   above the working is the only line that gets read, so the steps below it
   are never read at all. Steps kept on an answer the teacher has just
   rewritten walk a student to the answer that is no longer on the card. And
   algebra that was rewritten out of the explanation and left in the steps is
   algebra in the one place the student is walked through line by line.
   ===================================================================== */
{
  const st = api._scanSteps({ steps: [
    { do: '5 units = 200', why: 'The whole is 5 equal parts.' },
    { do: '1 unit = 200 ÷ 5 = 40', why: 'Divide to get one part.' },
    { why: 'And that is the answer: $40.' },
    { do: '', why: '' },
    'not an object'
  ] });
  ok('the steps come through the one door', st.length === 3);
  ok('…a step keeps its working and its reason apart',
     st[0].do === '5 units = 200' && st[0].why === 'The whole is 5 equal parts.');
  /* Half a step is still something to walk through; an empty numbered row is
     not, and neither is a string where an object was asked for. */
  ok('…a step that came back with only its reason is shown as the step',
     st[2].do === 'And that is the answer: $40.' && st[2].why === '');
  ok('…and an empty step is dropped rather than drawn blank', st.length === 3);

  /* A model that returns forty steps for one sum would otherwise put forty
     presses of Next between a student and their answer. */
  const many = api._scanSteps({ steps: Array.from({ length: 40 }, (_, n) => ({ do: 's' + n })) });
  ok('the number of steps is capped in CODE, not just asked for',
     many.length === api.SCAN_STEPS_MAX && api.SCAN_STEPS_MAX > 0);
  ok('a question with no steps at all is fine', api._scanSteps({}).length === 0);

  /* `stepsShown` is the only thing the reveal moves, and it is clamped on the
     way out: a card opened to five steps and then edited down to two must not
     claim to be showing five. */
  ok('what is shown is never more than what there is',
     api._stepsShown({ steps: st, stepsShown: 99 }) === 3 &&
     api._stepsShown({ steps: st, stepsShown: -1 }) === 0 &&
     api._stepsShown({ steps: st }) === 0 &&
     api._stepsShown({ steps: st, stepsShown: 2 }) === 2);

  /* ---- what the model is asked for ---- */
  ok('the scan asks for the steps', api.SCAN_SYS.includes(api.SCAN_STEPS_RULE));
  ok('…and so does the ask with no paper at all', api.SCAN_ASK_SYS.includes(api.SCAN_STEPS_RULE));
  ok('the shape names the field on both', /"steps":\[\{"do"/.test(api.SCAN_SYS) &&
     /"steps":\[\{"do"/.test(api.SCAN_ASK_SYS));
  /* A P5 word problem IS its steps. A maths card with the whole solution in
     one paragraph is the exact thing this feature exists to stop. */
  ok('maths always gets steps, and never one step holding the whole sum',
     /EVERY MATHEMATICS question[\s\S]{0,120}at least two/.test(api.SCAN_STEPS_RULE) &&
     /never one step holding the whole solution/.test(api.SCAN_STEPS_RULE));
  /* A walk-through that stops one line short leaves the student where they
     started — the last step is the last thing they are shown. */
  ok('…and the last step ends at the answer',
     /THE LAST STEP ENDS AT THE FINAL ANSWER/.test(api.SCAN_STEPS_RULE));
  /* The steps are the SAME working as the explanation. A card whose steps and
     whose "Why" disagree is the app contradicting itself about the question
     it has just answered — and Copy, Print and the report all read "Why". */
  ok('…and they are the same working as the explanation, not a second answer',
     /SAME working/.test(api.SCAN_STEPS_RULE));
  /* "Answer only" must turn the walk-through off too, or a teacher who asked
     for the answer alone gets a card that hands over five presses of working. */
  ok('"answer only" asks for no steps either',
     /"steps" is an empty array/.test(api.SCAN_DETAIL_RULE.short));

  /* ---- the item carries them, on both paths ---- */
  const pageIt = api._scanNewItem({
    number: '7', page: 1, question: 'Q', answer: '$40', subject: 'math',
    steps: [{ do: '5 units = 200', why: 'a' }, { do: '1 unit = 40', why: 'b' }]
  }, 0, 1);
  ok('a scanned question carries its steps', pageIt.steps.length === 2 && pageIt.stepsShown === 0);
  const askIt = api._askNewItem({
    heading: 'Fractions', answer: '3/4', explanation: 'w',
    steps: [{ do: 'a', why: 'b' }]
  });
  ok('…and so does a typed question with no paper behind it',
     askIt.steps.length === 1 && askIt.stepsShown === 0);

  /* A question stitched across a batch boundary takes its steps from the half
     that could see the whole question — the same half its answer comes from. */
  {
    const into = [];
    api._scanFoldRows([{ number: '9', page: 1, question: 'first half', answer: '',
                         steps: [{ do: 'half a walk-through' }] }], 0, 1, into);
    api._scanFoldRows([{ continuation: true, page: 1, question: 'second half', answer: '12 cm',
                         steps: [{ do: 'the whole one, step 1' }, { do: '= 12 cm' }] }], 1, 1, into);
    ok('a question stitched over a page break gets ONE walk-through, the whole one',
       into.length === 1 && into[0].steps.length === 2 &&
       into[0].steps[1].do === '= 12 cm' && into[0].stepsShown === 0);
  }

  /* ---- the card ---- */
  const card = api.stepsBoxHtml({ steps: st, stepsShown: 1 }, 3);
  ok('only what has been revealed is displayed…',
     (card.match(/class="stepRow"/g) || []).length === 1 &&
     (card.match(/class="stepRow hid"/g) || []).length === 2);
  /* …and every step is in the markup from the moment the card is drawn.
     Nothing is fetched between presses, so nothing can be lost between them —
     and it is what lets Print put the whole worked answer on paper without
     touching what is on the screen. */
  ok('…but every step is in the markup all along',
     card.includes('5 units = 200') && card.includes('1 unit = 200 ÷ 5 = 40') &&
     card.includes('And that is the answer: $40.'));
  ok('the card says how far through it is', /1 of 3 shown/.test(card));
  ok('Next step is offered, and so is the whole thing at once',
     /stepNext\(3\)/.test(card) && /stepAll\(3\)/.test(card));
  ok('a card nobody has started says so on the button',
     /Show me the first step/.test(api.stepsBoxHtml({ steps: st, stepsShown: 0 }, 0)));
  const done = api.stepsBoxHtml({ steps: st, stepsShown: 3 }, 0);
  ok('a finished walk-through offers a second go, not another Next',
     /stepReset\(0\)/.test(done) && !/stepNext\(/.test(done));
  ok('a question with nothing to work through draws no box at all',
     api.stepsBoxHtml({ steps: [] }, 0) === '');
  /* A "<" in a maths step is a less-than sign, not the start of a tag. */
  ok('a step crosses into the card escaped',
     /&lt;/.test(api.stepsBoxHtml({ steps: [{ do: '3 < 5', why: '' }], stepsShown: 1 }, 0)));
  /* The nav is a button nobody can press on paper, and "1 of 3 shown" is a
     lie on a sheet that prints all three. */
  ok('the buttons and the counter never reach paper',
     /class="stepNav noPrint"/.test(card) && /class="stepCount noPrint"/.test(card));
  ok('…and every step does, whatever the screen was showing',
     /\.stepRow\.hid \{ display: flex !important; \}/.test(html));
  ok('…as does the answer that was being held back',
     /\.ansHidden \.ansText \{ display: block !important; \}/.test(html) &&
     /\.stepNav, \.ansCover \{ display: none !important; \}/.test(html));

  /* ---- the presses ---- */
  const live = [{ steps: st, stepsShown: 0 }, { steps: [], stepsShown: 0 }];
  api.answers = live;
  api.stepNext(0);
  ok('Next step reveals exactly one more', api._stepsShown(live[0]) === 1);
  api.stepNext(0); api.stepNext(0); api.stepNext(0); api.stepNext(0);
  ok('…and stops at the last one', api._stepsShown(live[0]) === 3);
  api.stepReset(0);
  ok('↺ closes it back up', api._stepsShown(live[0]) === 0);
  api.stepAll(0);
  ok('Show all working opens the whole card in one press', api._stepsShown(live[0]) === 3);
  /* These are inline handlers on rendered HTML, so a stale card can reach them
     after a new run has replaced the answers. */
  ok('a press on a card that is no longer there is not a crash', (() => {
    try { api.stepNext(99); api.stepAll(99); api.stepReset(99); return true; }
    catch (e) { return false; }
  })());

  /* ---- and the whole paper at once ---- */
  ok('the paper knows it has working to show', api.stepsAnyCard() === true);
  const paper = [{ steps: st, stepsShown: 0 }, { steps: [{ do: 'x' }], stepsShown: 0 }];
  api.answers = paper;
  ok('…and that it is not open yet', api.stepsAllOpen() === false);
  api.stepAllCards();
  ok('one press opens every card', api.stepsAllOpen() === true &&
     api._stepsShown(paper[0]) === 3 && api._stepsShown(paper[1]) === 1);
  /* A teacher who has opened every card wants one press to put them all away
     again — not a button that does nothing the second time. */
  api.stepAllCards();
  ok('…and pressing it again closes them all',
     api._stepsShown(paper[0]) === 0 && api._stepsShown(paper[1]) === 0);
  api.answers = [{ steps: [], stepsShown: 0 }];
  ok('a paper with nothing to walk through offers no button',
     api.stepsAnyCard() === false && api.stepsAllOpen() === false);
  ok('…which is what hides it', /b\.classList\.toggle\('hidden', !any\)/.test(html));
  ok('the button is really wired to the whole paper',
     /\$\('stepAllBtn'\)\.addEventListener\('click', stepAllCards\)/.test(html));
  ok('…and it is repainted by the ONE painter',
     /renderStepAllBtn\(\);\n  renderVetAllBtn\(\);/.test(html));

  /* ---- the answer is the last step ---- */
  /* An answer printed above the working is the only line that gets read, so on
     a question NOBODY HAS ANSWERED YET it waits behind the steps. */
  ok('a blank question keeps its answer behind the working',
     /var hideAns = !it\.marked && hideWhy;/.test(html));
  /* …and on a MARKED one it is shown at once: the student has committed to an
     answer, the verdict chip has already told them how it went, and a teacher
     marking a script must not click through twenty cards to see what they are
     marking against. The cover, and the class that hides the answer under it,
     are drawn ONLY on that branch — a card that wears one and not the other
     either gives the answer away or loses it. */
  ok('…and the cover and the hidden answer are the same branch',
     /\(hideAns \? ' ansHidden' : ''\)/.test(html) &&
     /\(hideAns\n\s*\? '<div class="ansCover">/.test(html));
  ok('the cover says where the answer is', /the last one is the answer/.test(html));
  /* "Why" IS THE WHOLE SOLUTION at full detail — the working line by line
     ending with the answer stated. Left under a walk-through nobody has
     started, it hands over in one paragraph exactly what the steps hand over
     one at a time, and the reveal is decoration. It waits with them on a
     MARKED card too: the mark, the correct answer and the feedback are all
     still there, and only the worked solution waits. */
  ok('…and the whole worked solution waits with the steps',
     /var hideWhy = stepCount > 0 && _stepsShown\(it\) < stepCount;/.test(html) &&
     /var hideAns = !it\.marked && hideWhy;/.test(html) &&
     /'<div class="whyBox' \+ \(hideWhy \? ' hidWhy' : ''\)/.test(html));
  ok('…but reaches paper all the same',
     /\.whyBox\.hidWhy \{ display: none; \}/.test(html) &&
     /\.whyBox\.hidWhy \{ display: block !important; \}/.test(html));

  /* ---- Copy carries the whole thing ---- */
  ok('every step goes out with Copy, whatever the screen was showing',
     /Working, step by step:/.test(html) &&
     /lines\.push\('     ' \+ \(n \+ 1\) \+ '\. ' \+ st\.do/.test(html));

  /* ---- algebra cannot hide in the steps ---- */
  const algIt = { subject: 'math', question: 'A number problem.', answer: '40',
                  explanation: 'Five units make 200, so one unit is 40.', feedback: '',
                  steps: [{ do: 'Let x be the number', why: '5x = 200' }] };
  ok('algebra left in the STEPS is still algebra', api._itemUsesAlgebra(algIt) === true);
  ok('…and a clean walk-through is not', api._itemUsesAlgebra({
    subject: 'math', question: 'A number problem.', answer: '40',
    explanation: 'Five units make 200, so one unit is 40.',
    steps: [{ do: '5 units = 200', why: 'The whole is 5 equal parts.' }]
  }) === false);
  /* A rewrite that put the explanation right and left the steps alone would
     leave the algebra in the one place the student is walked through it. */
  ok('the rewrite is asked for the steps too',
     /Rewrite the "steps" the same way/.test(html) &&
     /'\\nSTEPS: ' \+ _stepsText\(it\)/.test(html));
  {
    const bad = [{ subject: 'math', question: 'q', answer: '40', explanation: 'let x be 5x = 200',
                   feedback: '', steps: [{ do: 'Let x be the number', why: '' }] }];
    api._applyAlgebraFix(bad, [{ i: 0, answer: '40', explanation: 'Five units make 200, so one unit is 40.',
                                 steps: [{ do: '5 units = 200', why: 'The whole is 5 parts.' },
                                         { do: '1 unit = 40', why: 'Divide by 5.' }] }]);
    ok('a rewritten walk-through replaces the algebraic one',
       bad[0].steps.length === 2 && bad[0].steps[0].do === '5 units = 200');
    ok('…and the card it was opened on is closed again, not left mid-way through',
       bad[0].stepsShown === 0);
  }
  {
    const bad2 = [{ subject: 'math', question: 'q', answer: '40', explanation: 'let x be 5x = 200',
                    feedback: '', steps: [{ do: 'clean enough', why: '' }] }];
    api._applyAlgebraFix(bad2, [{ i: 0, answer: '40', explanation: 'Five units make 200.',
                                  steps: [{ do: 'Let x be the number', why: '' }] }]);
    ok('a second algebraic walk-through is refused, and the first one kept',
       bad2[0].steps.length === 1 && bad2[0].steps[0].do === 'clean enough');
  }

  /* ---- ✎ Edit ---- */
  /* The steps were written to arrive at an answer that is no longer on the
     card: walking a student through them now ends one line short of the
     answer printed above it. */
  {
    const it = { answer: '40', explanation: 'w', marked: false, options: [], option: '',
                 steps: [{ do: '1 unit = 40', why: '' }], stepsShown: 1 };
    api._ansEditApply(it, { answer: '45', explanation: 'w' });
    ok('an answer the teacher has rewritten drops the walk-through to the old one',
       it.steps.length === 0 && it.stepsShown === 0);
  }
  {
    const it = { answer: '40', explanation: 'w', marked: false, options: [], option: '',
                 steps: [{ do: '1 unit = 40', why: '' }], stepsShown: 1 };
    api._ansEditApply(it, { answer: '40', explanation: 'a fuller reason' });
    ok('…and one whose answer is unchanged keeps it', it.steps.length === 1);
  }

  /* ---- 🏷 the subject, said on the card ---- */
  /* A maths question read off a mixed pile is answered to the maths standard,
     marked to it, held to the no-algebra rule and filed in the maths list —
     and the card never once said it was a maths question. */
  ok('every answer card wears the subject the question was read as',
     /var sw = itemSubjectWhy\(it\);/.test(html) &&
     /subjectLabel\(sw\.key\)\) \+ ' question<\/span>'/.test(html));
  /* "What this question reads as" and "the subject you set on another tab" are
     very different claims to put in front of somebody. */
  ok('…and says which of the two claims it is making',
     /What this question itself reads as\./.test(html) &&
     /The subject you set in Settings/.test(html));
  ok('the chip is drawn through the ONE door, not a second reading',
     !/it\.subject \|\| wsMeta\.subject/.test(html));
  /* The mistake book was filing every question under the PICKER, so a maths
     question off a mixed pile came back in the book chipped as Science and
     printed on a worksheet titled Science. `itemSubject` falls back to the
     picker itself, so a paper that is all one subject is filed as before. */
  ok('…and the book files a question under its own subject too',
     /subject: itemSubject\(it\),/.test(html));
  ok('the subject goes out with Copy as well',
     /\[' \+ subjectLabel\(csub\) \+ ' question\]/.test(html));
}

console.log((fails ? '✗ ' : '✓ ') + (ran - fails) + '/' + ran + ' checks passed');
process.exit(fails ? 1 : 0);
