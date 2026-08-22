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
/* 📥 The admin's door into the four portals' vetting lists. Everything it can
   get wrong is silent: a document written in the wrong SHAPE renders as a
   question with no answer in it, and a `source` that stops saying 'scan'
   lands a card that is no longer purple and no longer says where it came
   from — in an app this one cannot see. */
const vet = section(
  '/* =====================================================================\n   📥 SENDING A SCANNED QUESTION',
  '/* ================= Sign in ================= */');

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
var db = { collection: () => ({ doc: () => ({
  collection: () => ({ doc: () => ({ get: () => Promise.resolve({ exists: false }) }),
                       get: () => Promise.resolve({ forEach: () => {} }) }),
  get: () => Promise.resolve({ exists: false })
}) }) };
`;

const api = new Function(prelude + json + grounding + scan + vet + `
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
   /if \(_tab !== 'snap'\) micStop\(\);/.test(html));
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
   /applyNotesVisibility\(\);[\s\S]{0,220}if \(_answers\.length\) renderAnswers\(\);/.test(html));
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

console.log((fails ? '✗ ' : '✓ ') + (ran - fails) + '/' + ran + ' checks passed');
process.exit(fails ? 1 : 0);
