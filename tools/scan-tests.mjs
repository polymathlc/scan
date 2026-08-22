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
    SCAN_SYS, SCAN_DETAIL_RULE, SCAN_SUBJECT_RULE, SCAN_MARK_RULE,
    SCAN_ASK_SYS, SCAN_ASK_WITH_PAGES_RULE,
    VET_TARGETS, vetTarget, VET_SOURCE, _vetPortalDoc, _vetMathDoc,
    _vetTitle, _vetHtml, _vetCorrectIndex, _vetIsMcq, _vetCardFootHtml,
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
ok('the teacher is', /Send to vetting/.test(api._vetCardFootHtml(openItem, 0)));
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

/* ---------- Filing the whole paper automatically ----------
   Set once on the How tab. Everything about it is admin-only and everything
   about it has to be SAID: questions filed somewhere the teacher was not told
   about are questions nobody ever goes and vets. */
ok('the picker is built from the one table, never written out in the markup',
   /function fillVetTargets\(\)[\s\S]{0,400}VET_TARGETS\.forEach/.test(html));
ok('it starts Off, and Off is the empty value',
   /<option value="">Off/.test(html));
ok('the setting is remembered with the others',
   /autoVet: \$\('scanAutoVet'\)/.test(html) && /if \(p\.autoVet && vetTarget\(p\.autoVet\)\)/.test(html));
ok('a run files the paper only after it has been read',
   /await _vetAutoFile\(\);/.test(html) &&
   html.indexOf('await _vetAutoFile();') > html.indexOf('async function runScan'));
ok('an empty run files nothing', /if \(!t \|\| !_answers\.length\) return;/.test(html));
ok('it asks who is signed in at the moment the paper is read',
   /function vetAutoTarget[\s\S]{0,160}!isAdmin\(currentUser\)/.test(html));
ok('the field is hidden for a student and never cleared — that would wipe the setting',
   /if \(field\) field\.classList\.toggle\('hidden', !admin\);/.test(html));
ok('what was filed, and where, is said out loud', /_vetReport\(t, r\)/.test(html));
/* One writer. Two loops would be two places for the admin check, the
   already-sent guard and the failure count to drift apart. */
ok('the button and the automatic filing share ONE writer',
   (html.match(/await _vetSend\(/g) || []).length === 2 &&
   (html.match(/async function _vetSend\(/g) || []).length === 1);
ok('…and the door is inside it', /async function _vetSend[\s\S]{0,320}!isAdmin\(currentUser\)\) return r;/.test(html));

console.log((fails ? '✗ ' : '✓ ') + (ran - fails) + '/' + ran + ' checks passed');
process.exit(fails ? 1 : 0);
