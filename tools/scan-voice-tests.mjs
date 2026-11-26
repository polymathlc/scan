// node --test tools/scan-voice-tests.mjs
//
// 📖 Scan READS the answer book Ans Key writes (teacher-voice.js, byte for
// byte Ans Key's). These checks pin the glue: the scan is grounded with the
// teacher's own answer, a card shows it, an account change drops the cache,
// only the teacher lists the book, and nothing here writes to it.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, '..');
const require = createRequire(import.meta.url);
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const TV = require(path.join(root, 'teacher-voice.js'));
const P = TV.pure;

function section() {
  const s = html.indexOf("📖 THE ANSWER BOOK — the teacher's own answers");
  const e = html.indexOf('End answer book', s);
  assert.ok(s > 0 && e > s, 'the answer book glue is marked');
  const open = html.lastIndexOf('/*', s);
  return html.slice(open, html.indexOf('*/', e) + 2);
}
function fnBody(name) {
  const s = html.search(new RegExp('(?:async )?function ' + name + '\\('));
  assert.ok(s >= 0, name + ' exists');
  const open = html.indexOf('{', s);
  let d = 0;
  for (let i = open; i < html.length; i++) {
    if (html[i] === '{') d++;
    else if (html[i] === '}') { d--; if (!d) return html.slice(open, i + 1); }
  }
  throw new Error('unbalanced ' + name);
}

test('teacher-voice.js is loaded before the app script, with the app version', () => {
  const v = (html.match(/var APP_VERSION = 'v([\d.]+)'/) || [])[1];
  assert.ok(v, 'APP_VERSION');
  const tag = html.indexOf('<script src="teacher-voice.js?v=' + v + '"></script>');
  assert.ok(tag > 0, 'script tag carries ?v=' + v);
  assert.ok(tag < html.indexOf("var APP_VERSION"), 'and loads before the app');
});

test('aiGrounding appends the teacher\'s own answer, and the scan passes its ask', () => {
  const b = fnBody('aiGrounding');
  assert.match(b, /tvBlock\(kind, q\)/);
  assert.match(b, /if \(!guide && !notes && !style && !voice\) return '';/);
  assert.match(b, /guide \+ notes \+ style \+ voice \+ authority/);
  assert.equal((html.match(/aiGrounding\('scan', \{ q: ask \}\)/g) || []).length, 2);
});

test('the cache follows the account; the teacher lists the book; cards are matched after a run', () => {
  assert.match(fnBody('stopTeachingNotes'), /tvReset\(\)/);
  assert.match(html, /loadTeachingNotes\(true\)\.then\(function \(\) \{ renderAnswers\(\); if \(typeof tvLoadAll === 'function'\) tvLoadAll\(\); \}\)/);
  assert.match(fnBody('runScan'), /tvMatchAnswers\(run\)/);
  assert.match(fnBody('answerCardHtml'), /it\.teacher && it\.teacher\.a[\s\S]*escHtml\(it\.teacher\.a\)/);
});

test('nothing here writes to the answer book', () => {
  const s = section();
  assert.ok(!/\.set\(|\.update\(|\.add\(|\.delete\(|runTransaction|batch\(/.test(s), 'the glue only reads');
  assert.ok(!/innerHTML/.test(s));
});

test('only the teacher lists every entry; anyone else reads question by question', () => {
  const s = section();
  assert.match(s, /!isAdmin\(currentUser\) \|\| o !== currentUser\.uid/);
  assert.match(fnBody('tvLoadAll'), /!isAdmin\(currentUser\)/);
});

/* ---- The glue, run against the real teacher-voice.js and a fake Firestore ---- */
function harness({ admin, docs }) {
  const reads = [];
  const fakeDb = {
    doc(p) { return { get: async () => { reads.push(p); const d = docs[p]; return { exists: !!d, data: () => d }; } }; },
    collection(a) {
      return { doc: (b) => ({ collection: (c) => ({ doc: (d) => ({ collection: (e) => ({
        get: async () => { const k = [a, b, c, d, e].join('/'); reads.push(k); const list = docs[k] || [];
          return { forEach: (f) => list.forEach((x) => f({ data: () => x })) }; } }) }) }) }) };
    }
  };
  let renders = 0;
  const ctx = {
    window: { TeacherVoice: TV }, db: fakeDb, console: { warn() {} },
    currentUser: { uid: admin ? 'T' : 'S', email: admin ? 'admin' : 'kid' },
    isAdmin: (u) => !!u && u.email === 'admin',
    notesOwner: () => 'T', wsMeta: { level: 'P5', subject: 'science' },
    _answers: [], _scanRun: 1, renderAnswers: () => { renders++; },
    setTimeout, clearTimeout, Promise
  };
  vm.createContext(ctx);
  vm.runInContext(section(), ctx);
  return { ctx, reads, renders: () => renders };
}

function bookFor(entries) {
  const docs = {};
  const rows = entries.map((e) => P.cleanEntry(e)).filter(Boolean);
  const byBucket = {};
  rows.forEach((r) => { (byBucket[r.bucket] = byBucket[r.bucket] || []).push(r); });
  const base = 'users/T/' + TV.COLL + '/' + TV.BOOK_DOC;
  docs['users/T/' + TV.COLL + '/' + TV.INDEX_DOC] = { v: 1, buckets: Object.fromEntries(Object.keys(byBucket).map((k) => [k, byBucket[k].length])) };
  Object.keys(byBucket).forEach((b) => { docs['users/T/' + TV.COLL + '/' + P.indexDocId(b)] = { v: 1, rows: byBucket[b].map(P.rowOf) }; });
  rows.forEach((r) => { docs[base + '/' + TV.ENTRIES + '/' + r.id] = r; });
  docs[base + '/' + TV.ENTRIES] = rows;
  return docs;
}

const Q = 'A metal spoon left in a cup of hot soup became hot. Explain why.';
const A = 'Metal is a good conductor of heat. The spoon gained heat from the hotter soup.';
const ENTRY = { k: P.slotKey('d', 'p1:q5'), n: '5', q: Q, a: A, src: 'typed', lvl: 'P5', sub: 'science', ws: 'Heat', doc: 'd', page: 1, at: '2026-11-01T00:00:00Z' };

test('a typed ask asked once is grounded from the book the next time, as a model answer for marking', async () => {
  const { ctx } = harness({ admin: false, docs: bookFor([ENTRY]) });
  assert.equal(typeof vm.runInContext('tvBlock("scan", ' + JSON.stringify(Q) + ')', ctx), 'string');
  await new Promise((r) => setTimeout(r, 30));
  const second = vm.runInContext('tvBlock("scan", ' + JSON.stringify(Q) + ')', ctx);
  assert.match(second, /good conductor of heat/);
  assert.match(second, /MARKED[\s\S]*model answer/);
  vm.runInContext('tvReset()', ctx);
  assert.ok(!/good conductor/.test(vm.runInContext('tvBlock("scan", ' + JSON.stringify(Q) + ')', ctx)), 'an account change drops the cache');
});

test('after a run, a card the teacher has answered shows their answer; another is left alone', async () => {
  const { ctx, renders } = harness({ admin: false, docs: bookFor([ENTRY]) });
  ctx._answers.push({ question: Q, subject: 'science' }, { question: 'Name the process by which plants make food.', subject: 'science' });
  const n = await vm.runInContext('tvMatchAnswers(1)', ctx);
  assert.equal(n, 1);
  assert.equal(ctx._answers[0].teacher.a, A);
  assert.equal(ctx._answers[0].teacher.ws, 'Heat');
  assert.ok(!ctx._answers[1].teacher);
  assert.equal(renders(), 1);
});

test('a run that was replaced does not get the answers', async () => {
  const { ctx } = harness({ admin: false, docs: bookFor([ENTRY]) });
  ctx._answers.push({ question: Q });
  ctx._scanRun = 2;
  assert.equal(await vm.runInContext('tvMatchAnswers(1)', ctx), 0);
  assert.ok(!ctx._answers[0].teacher);
});

test('the teacher lists the book; a student never does', async () => {
  const t = harness({ admin: true, docs: bookFor([ENTRY]) });
  await vm.runInContext('tvLoadAll()', t.ctx);
  assert.ok(t.reads.some((p) => p.endsWith('/' + TV.ENTRIES)));
  assert.match(vm.runInContext('tvBlock("answer", ' + JSON.stringify(Q) + ')', t.ctx), /good conductor of heat/);
  const s = harness({ admin: false, docs: bookFor([ENTRY]) });
  await vm.runInContext('tvLoadAll()', s.ctx);
  assert.ok(!s.reads.some((p) => p.endsWith('/' + TV.ENTRIES)));
});

test('no question and no paper, no block', () => {
  const { ctx } = harness({ admin: false, docs: {} });
  assert.equal(vm.runInContext('tvBlock("scan", "")', ctx), '');
});
