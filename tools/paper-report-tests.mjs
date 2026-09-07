import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { api, prelude, json, grounding, scan, steps, worksheet, report, book, vet, authFns } from './scan-tests.mjs';

let checks = 0;
function test(name, fn) { fn(); checks++; }
function row(n, verdict = 'wrong', marks = '0/2') {
  return api._scanNewItem({ number: String(n), page: 1, endPage: 1, subject: 'science',
    question: 'Explain why the metal spoon feels hot.', answer: 'Heat is conducted from the hot water to the spoon.',
    studentAnswer: 'The spoon gains heat from the air.', hasWriting: true, verdict, marks, maxMarks: 2,
    topics: ['Heat'], learningObjective: 'Explain heat transfer by conduction.',
    lossReason: 'Named the air instead of the hot water as the source of heat.',
    studyAdvice: 'Trace the direction of heat transfer from the hotter object to the cooler object.',
    questionBox: [120, 60, 370, 920], markPoint: [320, 940], markPage: 1 }, 0, 3);
}
api.meta = { subject: 'science', level: 'P5' }; api.notes = []; api.style = null;
api.user = { uid: 'admin1', email: 'chungzhikai@gmail.com' };
const wrong = row(1), right = row(2, 'correct', '2/2'), partial = row(3, 'partial', '1/2');
const blank = api._scanNewItem({ number: '4', question: 'What is conduction?', page: 2, maxMarks: 2,
  verdict: 'wrong', marks: '0/2', topics: ['Heat'], learningObjective: 'Define conduction.' }, 0, 3);
test('blank retains full allocation but no awarded mark or cross', () => {
  assert.equal(api.paperMarkText(blank), '— / 2'); assert.equal(blank.marked, false); assert.equal(blank.verdict, '');
});
test('marks total only adds judged allocations', () => assert.equal(api.paperTotals([wrong,right,partial,blank]), '3 / 6 marks for attempted questions'));
test('missing allocations cannot produce a complete total', () => assert.match(api.paperTotals([right,{...wrong,marks:''}]), /pending/));
test('writing that could not be read is flagged, not a blank zero', () => {
  assert.match(api.paperLossReason({...blank,wrote:true}), /could not be read/);
  assert.match(api.paperTotals([{...blank,wrote:true}]), /pending/);
});
test('contradictory score is unavailable', () => assert.equal(api.paperMark({...right,marks:'0/2'}), null));
test('full marks are not allocated twice to parts', () => assert.match(api.SCAN_SYS, /Never assign a parent question total/));
test('batch pages and annotation points are global', () => {
  const it = api._scanNewItem({question:'Q',page:2,endPage:3,markPage:3,markPoint:[300,900]},3,3);
  assert.equal(it.page,5); assert.equal(it.endPage,6); assert.equal(it.markAnchors[0].page,6);
});
test('invalid annotation points are rejected', () => {
  for (const pt of [[-1,10],[2000,20],['40',10],[NaN,2],[1,2,3]])
    assert.deepEqual(api._scanNewItem({question:'Q',page:1,markPoint:pt},0,3).markAnchors,[]);
});
test('continuation keeps metadata, both page anchors and one question', () => {
  const into = [row('5')];
  api._scanFoldRows([{question:'continued',number:'5',continuation:true,page:1,endPage:2,
    studentAnswer:'Water',verdict:'correct',marks:'2/2',maxMarks:2,topics:['Heat transfer'],
    learningObjective:'Identify the heat source.',markPoint:[200,800],markPage:2}],3,3,into);
  assert.equal(into.length,1); assert.equal(into[0].endPage,5); assert.equal(into[0].markAnchors[1].page,5);
  assert.equal(into[0].topics[0],'Heat transfer'); assert.equal(into[0].verdict,'correct');
});
test('table text is escaped', () => assert.ok(!api.paperRowHtml({...wrong,learningObjective:'<img src=x onerror=alert(1)>'},0).includes('<img')));
test('full-mark answer has no loss reason', () => assert.equal(api.paperLossReason(right),'—'));

const draft = {number:'1(a)', topics:'Heat, Conduction', objective:'Explain conduction.', verdict:'correct',
  awarded:'2',max:'2',reason:'The pupil identified both objects correctly.',studentAnswer:'Heat moves from the water to the spoon.'};
test('teacher correction updates marks, topic, objective and visual verdict', () => {
  const patched = {...wrong,...api.paperEditPatch(wrong,draft)};
  assert.equal(api.paperTotals([patched]),'2 / 2 marks for attempted questions');
  assert.match(api.paperRowHtml(patched,0),/Teacher reviewed/); assert.match(api.paperRowHtml(patched,0),/aria-label="Correct"/);
  assert.equal(patched.lossReason,''); assert.equal(patched.studyAdvice,'');
  assert.deepEqual(patched.topics,['Heat','Conduction']);
});
test('impossible mark cannot be saved', () => assert.throws(()=>api.paperEditPatch(wrong,{...draft,awarded:'3'}),/between/));
test('verdict and marks must agree', () => assert.throws(()=>api.paperEditPatch(wrong,{...draft,verdict:'wrong'}),/disagree/));
test('lost marks require a reason', () => assert.throws(()=>api.paperEditPatch(wrong,{...draft,verdict:'wrong',awarded:'0',reason:''}),/reason/));
test('teacher can repair unreadable transcription', () => assert.equal(api.paperEditPatch(blank,draft).studentAnswer,draft.studentAnswer));
test('a verdict without a transcription is rejected', () => assert.throws(()=>api.paperEditPatch(blank,{...draft,studentAnswer:''}),/student answer/));
test('blank remains unattempted after a correction', () => {
  const patch = api.paperEditPatch(wrong,{...draft,verdict:'blank',studentAnswer:'',awarded:''});
  assert.equal(patch.marked,false); assert.equal(patch.marks,''); assert.equal(patch.maxMarks,2);
});
test('non-admin cannot open editing or save', () => {
  api.answers=[wrong]; api.user={uid:'student',email:'student@example.test'};
  api.paperEditStart();api.paperEditSave(); assert.equal(api.paperEditing,null);
  assert.ok(!api.paperReportHtml().includes('Edit results table'));
});
api.user = { uid: 'admin1', email: 'chungzhikai@gmail.com' }; api.answers=[wrong,right,partial,blank];
test('teacher sees the edit control', () => assert.match(api.paperReportHtml(),/Edit results table/));
test('photo remains attached to original run after gallery is reordered', () => {
  api.paperRun={shots:[{url:'data:image/png;base64,AA==',status:'done'},{url:'data:image/png;base64,AA==',status:'done'}],failedInputs:[],grounding:[],student:'',date:'07/09/2026'};
  api.shots=[]; assert.match(api.markedPhotosHtml(),/Marked page 1/); assert.match(api.markedPhotosHtml(),/photoMark wrong/);
});
test('table and study page survive report failure', () => {
  api.report={status:'failed',err:'offline',score:api.reportScore([wrong,right]),words:null};
  const result=api.paperReportHtml();assert.match(result,/Reason for losing marks/);assert.match(result,/What to study next/);
  assert.match(result,/could not be generated/);assert.match(result,/direction of heat/);
});
test('shared notes appear in marking but table metadata changes no notebook fields', () => {
  api.notes=[{guidance:'Accept equivalent heat transfer wording.',subjects:['science']}];
  assert.match(api.aiGrounding('scan'),/equivalent heat/); assert.ok(!api.paperEditPatch(wrong,draft).guidance);
});
test('prompt receives reasons and objectives for study suggestions', () => {
  const p=api._reportPrompt([wrong,right],api.reportScore([wrong,right]));
  assert.match(p,/Named the air/); assert.match(p,/Explain heat transfer/);
});
// A report started before the teacher saved must not replace the revised report.
api.run=700; api.answers=[wrong,right];
let resolveOld;
api.ai=()=>new Promise(resolve=>{resolveOld=resolve;});
const pending=api.runReport(700);
api.invalidateReport(); resolveOld(JSON.stringify({headline:'Obsolete feedback',strengths:[],gaps:[],next:[]}));
await pending;
test('stale pre-correction report is discarded', () => assert.equal(api.report,null));
console.log('✓ '+checks+'/'+checks+' marked-paper checks passed');

// Optional offline browser fixture. All renderers and edit handlers below are
// extracted from the real app; only Firebase and paid AI are replaced by stubs.
if (process.argv.includes('--fixture')) {
  const out=process.env.SCAN_FIXTURE_DIR || '/tmp/scan-paper-fixture';fs.mkdirSync(out,{recursive:true});
  const app=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
  let stub=prelude.replace('function $(id) { return null; }','function $(id) { return document.getElementById(id); }')
    .replace('function renderAnswers() {}',"function renderAnswers() { renderReport(); $('printAnswersBtn').disabled = !!_paperEditing; }")
    .replace(/var document = .*?;\n/, '').replace(/var location = .*?;\n/, '').replace('var window = {};','');
  const logic=stub+json+grounding+scan+steps+worksheet+report+book+vet+authFns;
  const fixture=[wrong,right,partial,blank];
  // Original photo generated in the fixture, no student work leaves this test.
  const initialise=`
    _answers=${JSON.stringify(fixture)}; _scanRun=1;
    var canvas=document.createElement('canvas');canvas.width=800;canvas.height=1100;
    var ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,800,1100);ctx.fillStyle='#222';ctx.font='22px Arial';
    ctx.fillText('P5 Science — Heat',50,60);ctx.fillText('1. Explain why the metal spoon feels hot. [2]',50,150);
    ctx.fillText('The spoon gains heat from the air.',50,250);ctx.fillText('2. State the direction of heat transfer. [2]',50,480);
    ctx.fillText('From the hot water to the cooler spoon.',50,580);ctx.fillText('3. Explain the result. [2]',50,760);
    ctx.fillText('The spoon gains heat.',50,860);
    _answers[1].markAnchors=[{page:1,y:540,x:940}]; _answers[2].markAnchors=[{page:1,y:790,x:940}];
    _paperRun={shots:[{url:canvas.toDataURL('image/png'),status:'done'},{url:canvas.toDataURL('image/png'),status:'done'}],failedInputs:[],grounding:['teaching notes'],student:'Test pupil',date:'07/09/2026'};
    window.aiReady=()=>false;_report=null;renderAnswers();
    function previewPrint() {preparePaperPrint();document.body.classList.add('testPrint');}
    function longPaper() {_answers=Array.from({length:60},(_,i)=>({..._answers[i%4],number:String(i+1)}));renderAnswers();}
    function studentView() {currentUser={uid:'student',email:'student@example.test'};_paperEditing=null;renderAnswers();}
  `;
  const style=app.match(/<style>([\s\S]*?)<\/style>/)[1];
  const html='<!doctype html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>'+style+
    'body{margin:0} main{max-width:1000px;padding:16px}.testPrint #reportWrap{display:none}.testPrint .paperPrintOnly{display:block}.testPrint .paperPrintPage{border:1px solid #aaa;margin:20px auto;padding:0}.testControls{padding:14px;display:flex;flex-wrap:wrap;gap:12px}.testControls button{min-height:44px}</style></head><body>'+ 
    '<div class="testControls"><button onclick="previewPrint()">Preview print layout</button><button onclick="longPaper()">Load 60 questions</button><button onclick="studentView()">Student view</button></div><main>'+ 
    '<button id="printAnswersBtn">Print marked paper</button><button id="reportBtn">Report</button><div id="reportWrap"></div><div id="markedPhotos"></div></main><script>'+logic+initialise+'</script></body></html>';
  fs.writeFileSync(path.join(out,'index.html'),html);
  fs.writeFileSync(path.join(out,'mobile.html'),html.replace('<main>','<main style="width:393px;max-width:100%;margin:auto">'));
  console.log('Offline fixture: '+out);
}
