/* Exercise the real edit handlers in a DOM without a browser, Firebase, or
   paid AI. Layout is deliberately NOT claimed here: jsdom has no renderer.
   Run paper-report-tests.mjs --fixture first, then:
   SCAN_JSDOM_PATH=/path/to/node_modules/jsdom node tools/paper-report-dom-tests.cjs /path/to/fixture/index.html */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { JSDOM, VirtualConsole } = require(process.env.SCAN_JSDOM_PATH || 'jsdom');
const errors = [], vc = new VirtualConsole();
vc.on('jsdomError', error => errors.push(error.message));
const dom = new JSDOM(fs.readFileSync(process.argv[2], 'utf8'), {
  url: 'https://scan-test.example/', runScripts: 'dangerously', virtualConsole: vc,
  beforeParse(window) {
    window.HTMLCanvasElement.prototype.getContext = () => ({ fillRect() {}, fillText() {} });
    window.HTMLCanvasElement.prototype.toDataURL = () => 'data:image/png;base64,AA==';
    window.HTMLElement.prototype.scrollIntoView = function () {};
  }
});
const w = dom.window, d = w.document;
let n = 0;
function check(name, fn) { fn(); n++; }
function fill(i, field, text) { d.getElementById('paperEdit-' + i + '-' + field).value = text; }
function button(text) { return [...d.querySelectorAll('button')].find(el => el.textContent.includes(text)); }
check('fixture starts with all four questions and two marked photos', () => {
  assert.equal(d.querySelectorAll('.paperTable tbody tr').length, 4);
  assert.equal(d.querySelectorAll('.markedPhotoCard').length, 2);
});
button('Edit results table').click();
check('edit control opens real editable cells', () => {
  assert.equal(d.querySelectorAll('.paperEditTable textarea').length, 20);
  assert.equal(d.querySelectorAll('.paperEditTable select').length, 4);
});
fill(0,'awarded','9'); button('Save corrections').click();
check('invalid edit keeps all original scores and entered text', () => {
  assert.equal(w._answers[0].marks,'0/2'); assert.equal(w._answers[1].marks,'2/2');
  assert.equal(d.getElementById('paperEdit-0-awarded').value,'9');
  assert.match(d.getElementById('paperEditError').textContent,/between 0 and full marks/);
});
fill(0,'awarded','2'); fill(0,'verdict','correct');fill(0,'reason','Equivalent wording accepted by teacher.');
fill(0,'number','1(a)');fill(0,'topics','Conduction'); fill(0,'objective','Identify the correct source of heat.');
button('Save corrections').click();
check('saving updates totals and keeps the teacher annotations', () => {
  assert.match(d.querySelector('.paperTotal').textContent,/5 \/ 6 marks/);
  assert.match(d.querySelector('.paperTable tbody').textContent,/Teacher reviewed/);
  assert.equal(w._answers[0].number,'1(a)');assert.equal(w._answers[0].topics[0],'Conduction');
});
check('corrected cross becomes a tick on the photographed page', () => {
  assert.match(d.querySelector('.photoMark').className,/correct/);
  assert.match(d.querySelector('.photoMark').textContent,/1\(a\)/);
});
button('Edit results table').click();fill(0,'topics','Unsaved');
w.renderReport();
check('a background report repaint preserves edits', () => assert.equal(d.getElementById('paperEdit-0-topics').value,'Unsaved'));
button('Cancel').click();
check('cancel preserves saved metadata', () => assert.equal(w._answers[0].topics[0],'Conduction'));
// Simulate measured page capacity so pagination's ordering/loss behaviour is
// exercised independently of browser layout. No pixel/layout claim is made.
Object.defineProperty(w.HTMLElement.prototype, 'offsetHeight', { get() {
  return this.classList.contains('paperPrintPage') ? 220 + this.querySelectorAll('tbody tr').length * 100 +
    this.querySelectorAll('.paperStudyBlock').length * 120 : 0;
}});
w.longPaper();w.preparePaperPrint();
check('60-question print keeps study page second and every row exactly once', () => {
  const pages=[...d.querySelectorAll('.paperPrintPage')];
  assert.equal(pages[0].querySelector('h2').textContent,'Question results');
  assert.equal(pages[1].querySelector('h2').textContent,'What to study next');
  assert.equal(d.querySelectorAll('#paperPrintReport tbody tr').length,60);
  assert.ok(pages.length>2);assert.match(pages[2].querySelector('h2').textContent,/continued/);
});
w.clearPaperPrint();
check('print cleanup restores screen content', () => {
  assert.equal(d.querySelector('#paperPrintReport'),null);assert.equal(d.body.classList.contains('paperPrinting'),false);
});
w.studentView();
check('student does not get editing and cannot invoke it', () => {
  assert.equal(button('Edit results table'),undefined);w.paperEditStart();assert.equal(w._paperEditing,null);
});
check('no JavaScript errors in the exercised workflow', () => assert.deepEqual(errors,[]));
console.log('✓ '+n+'/'+n+' DOM interaction checks passed (layout not emulated)');
dom.window.close();
