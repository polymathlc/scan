# CLAUDE.md

Guidance for Claude when working in this repo.

## App
- `index.html` — **"Scan & Answer"**. One self-contained file (markup + CSS + JS) on the shared
  `mathgen--app` Firebase project with Google sign-in. Photograph a worksheet or an exam paper —
  or pick pictures out of the gallery — and **every question printed on them is read: what the
  student has already written is MARKED, what is still blank is ANSWERED**. Four subjects:
  Science, Mathematics, English, Chinese. **A typed or dictated question is the other way in**:
  with pages it governs the run, with no pages it *is* the run. Nothing is saved anywhere: a
  photographed paper is somebody's work, so it lives in the tab and leaves through Copy or Print —
  **except on the admin's own press**: ✎ Edit teaches a corrected answer into the shared notebook,
  and **📥 Send to vetting** files one question (never the student's answer to it) in another
  Polymath app's vetting list. See those two sections below.
- Version badge (`APP_VERSION`, shown in the header) is hard-coded — bump it on every change.

## The AI is the Ans Key app's, ported whole
Everything that decides what an answer SAYS is a lift from `polymathlc/anskey` — **keep the two in
step, and ship a change to the shape in both repos together**:

- **`aiGrounding(kind)` is the ONE door.** Every AI call in this app appends it to its system
  prompt. Adding an AI feature means calling it too — grounding one call site and not another is
  how the app ends up answering in the teacher's voice on one button and not the next.
  `kind` is `'answer'` (writing an answer), `'mark'` (marking), **`'scan'` (this app's own run —
  it answers the blanks AND marks what is written, so it gets everything `'answer'` gets PLUS the
  marking standard)** or `'teach'` (explaining). **`'mark'` gets the marking standards and never
  the key facts or the exemplar answers** — a marker handed the answer stops marking against the
  paper. `'scan'` is the exception on purpose: it is writing the answer anyway.
- **The authority order is stated in the digest and never changes**: what the paper itself prints
  wins, then the teacher's general guidance, then the notes and the style, and ordinary syllabus
  knowledge only where they say nothing.
- **`guidance` is the hand-typed note and it is the ONLY field that reaches every `kind`.** It goes
  in verbatim through `guidanceBlock()`, ahead of `notesBlock`/`styleBlock`. Nothing is sent to the
  AI when one is saved: it is a note with empty `levels` and empty
  `keywords`/`keyFacts`/`markingStandards`, written straight to Firestore. `subjects` is empty too
  unless the admin picked one in the ✍️ modal — **the picker defaults to "Every subject", so
  leaving it alone keeps what a typed note has always meant.** **The ✎ window on an answer card
  writes the very same field** (see *✎ Fixing an answer* below) — that is the second door into the
  notebook, and because it is the same field the rule reaches all three apps exactly as a typed note
  does.
- **ONE notebook, three apps.** The notes live at `users/{adminUid}/teachingNotes/{id}` — the same
  collection Ans Key and the Science Learning Portal (`polymathlc/cer`) read and write. Keep the
  fields compatible: `topics` is reserved for the Portal's syllabus list and this app writes it
  **empty**, so a note written here reads as a general note there rather than one tagged with
  topics it has never heard of. This app's own wording goes in `noteTopics` / `subjects` / `levels`.
  Renaming `keywords`, `markingStandards`, `keyFacts` or `guidance` silently ungrounds the other two
  apps — nothing throws, the digests just come back empty.
- **The style profile is READ here and never written.** It lives at
  `users/{adminUid}/aiTraining/answerStyle` and is distilled in **Ans Key** from the answers the
  teacher has written on their own worksheets. Nothing photographed here is an answer the teacher
  wrote, so there is nothing honest for this app to add to it. Do not add a harvest path without
  deciding first whose answers those are.
- **The notebook is LIVE, and that is what makes it shared rather than
  copied.** `loadTeachingNotes` attaches an `onSnapshot` listener (and one on
  the style doc), not a one-shot `.get()`. A single read at sign-in meant this
  tab held whatever the notebook said when the teacher signed in and never
  looked again: a note typed in Ans Key mid-lesson reached the app it was
  typed in and NO other, so the same question was answered against two
  different notebooks depending on which tab it was answered in — and nothing
  anywhere said so. Three rules hold it together: **`_notesDetach` releases
  anyone waiting on the first snapshot** (a waiter holding a promise whose
  listener has just been unsubscribed is never answered, and `runScan` awaits
  that promise — the scan would simply never start); **`_notesAttachSeq`**
  makes a superseded attach stand down rather than race the one that replaced
  it; and **the listeners come down on every account change**, or one
  account's notes go on grounding the next person to sign in on the device.
  **`runScan` awaits the notebook before it writes a word**, so a note typed
  seconds earlier is obeyed by the very next answer.
- **A live repaint yields to whatever is being typed.** `renderNotesBody`
  rebuilds the whole window, so a snapshot arriving while the admin is half
  way through an upload comment would silently empty the box. The window waits
  for the next render instead — the notes are already live in every prompt
  whatever the screen happens to show.
- **Only the admin sees the notes window and only the admin ever writes.** A student's device reads
  the notes (the scan runs there) and learns whose notes to read from the Portal's `config/admin`
  pointer — the same document students there resolve the question bank from — remembered in
  `localStorage`. A read that is denied is not an error worth showing: the AI simply carries on
  ungrounded, exactly as it did before the feature existed.
- **The page SAYS whether it is grounded** (`groundingSummary`). An ungrounded answer looks
  identical to a grounded one, so the teacher would otherwise never know the notes were not read.

## Four subjects, and marking (v1.3.0)
- **`SUBJECTS` is the ONE list.** Science, Mathematics, English, Chinese. The settings picker, the
  ✍️ note picker, `SUBJECT_OK` (what a note may be tagged with), `subjectLabel` and
  `SCAN_SUBJECT_RULE` all read it, so a fifth subject is one entry rather than six edits that have
  to agree. Both `<select>`s are filled by `fillSubjects()` — never hand-write an `<option>`.
- **`'both'` is Ans Key's old maths-and-science pairing** and notes written then still carry it.
  `noteSubjects()` spells it out as `['math','science']`: it must go on grounding those two and
  must NOT quietly grow to cover the two subjects that did not exist when it was written.
- **Marking is automatic and has no setting.** A picker asking "mark or answer?" is a decision
  demanded before the app has even seen the page, and the honest answer is usually *both*.
  `SCAN_MARK_RULE` is the rule: something written is marked, nothing written is answered, and a
  page holding both comes back holding both.
- **The correct answer is worked out FIRST, from the printed question alone.** A model that reads
  the pupil's "1.4" before it does the sum agrees with it far too often, and an app that agrees
  with a wrong answer is worse than no app. `SCAN_MARK_RULE` and the `'scan'` authority order both
  say so; the old "IGNORE it" line is gone because ignoring it was never the point — not being
  swayed by it was.
- **A blank is NEVER marked wrong.** `_scanNewItem` drops a `verdict`, `marks` and `feedback` that
  came back with an empty `studentAnswer`, because a red cross on an untouched worksheet is the one
  mistake this feature can make. `it.marked` is `!!studentAnswer` and nothing else.
- **The three verdicts are `correct` / `partial` / `wrong`** (`SCAN_VERDICTS`). Anything else the
  model invents is dropped, but the question still shows as marked with what the student wrote —
  half a mark is better than silently losing their work off the card.
- **`renderTally` says nothing when nothing was attempted.** A fresh worksheet must not be
  announced as a score of zero out of nothing.
- Run **`node tools/scan-tests.mjs`** after touching any of it.

## Asking, in writing or out loud (v1.4.0)
- **A photograph is not the only way in.** `askText()` reads the box in the dock at the moment ✓ is
  pressed — there is no second copy of it to fall out of step with what is on screen.
- **Two paths, one set of cards.** `_runPages` is the scan as it always was, with the ask woven
  into `_scanPrompt`; `_runAskAlone` is one call with no images at all. Both end in `_answers`, so
  the cards, the marking, Copy and Print are written ONCE. `kind` (`'page'` / `'ask'`) is the only
  thing that says where an entry came from, and it is what keeps a page number and a question
  number off a card that never had either.
- **The ask GOVERNS a run that has pages** (`SCAN_ASK_WITH_PAGES_RULE`). "Only question 5" that
  still came back with the whole paper would be an app that did not listen, and the twenty cards
  it returned would bury the one that was asked for. Background ("P5 maths, test on Friday") is
  context, not an order to stop reading — and an instruction NEVER stops the marking.
- **`_markFields` is the ONE door for the marking fields**, used by `_scanNewItem` and
  `_askNewItem` alike, so "a blank is never marked wrong" holds on both paths rather than being
  written twice and drifting.
- **The ask-alone call is grounded too** — `SCAN_ASK_SYS + aiGrounding('scan')`. Grounding one call
  site and not another is exactly what the one-door rule exists to prevent.
- **✓ is reachable with a question and no picture at all.** `renderCamBar` disables it only when
  there is neither: `!ready.length && !ask`.
- **Dictation is feature-detected, never assumed.** The 🎤 is `hidden` in the markup and unhidden
  by `renderMic()` only where `SpeechRecognition` really exists — a button that silently does
  nothing is worse than no button. It listens in `micLang()`: `zh-CN` on a Chinese paper, `en-SG`
  otherwise, because a 华文 question dictated as English phonetics comes back as nonsense.
  `micStop()` runs before a run, when the tab is left and on Escape.
- **The page SAYS what it was asked** (`renderAskedLine`, and the Copy header). One card where
  twenty were expected is only honest if the instruction that narrowed the run is on screen.

## ✎ Fixing an answer, and teaching it for next time (v1.5.0)
- **An answer key that cannot be corrected is one the teacher retypes somewhere else, and a
  correction that dies with the tab is one they make again next week.** So the ✎ window has two
  halves and they are deliberately separate: `_ansEditApply` fixes the CARD (which lives in this tab
  and leaves through Copy or Print, like every other answer here), and `_ansEditNote` turns what was
  typed into a note in the SHARED notebook, so the fix outlives the tab and reaches Ans Key and the
  Science Learning Portal too.
- **The card is fixed FIRST, and the note second.** A note that could not be written must never cost
  the teacher the correction they just typed — `answerEditSave` applies and re-renders before it
  touches Firestore, and a failed write leaves the window open saying exactly that.
- **`_ansEditApply` is the one door for the card, and it re-states the blank rule by hand.** The
  marking fields are only ever touched when `it.marked`; on a blank they are forced empty. A red
  cross on an untouched worksheet is the one mistake this feature can make, and it is no better for
  being made through a picker than by the model. The mark picker is not even drawn on a blank.
- **`guidance` is the RULE and `keyFacts` is the corrected ANSWER, and the split is the whole
  design.** `guidance` is the only field that reaches every kind of call in all three apps, so a
  house rule belongs there and nothing else may go in it. The corrected answer is filed as a key
  fact WITH its question above it (it means nothing on its own) — and key facts never reach a pure
  marking digest, which is the standing rule: a marker handed the answer stops marking against the
  paper.
- **The question is kept for the READER, never for the prompt.** `sourceQuestion` is on the note so
  a person opening the notebook in any of the three apps can see what the rule was written against;
  putting the whole question into `guidance` would drown the rule it was written to carry in a
  paragraph repeated on every question the centre ever answers.
- **The note is offered at the paper's own subject and level, and it SAYS so.** The run already
  knows what it is looking at, so a correction on a P5 science paper is not silently made a rule
  about 华文 — and the two pickers are right there to widen it back to every subject in one tap.
- **`topics` is written EMPTY**, like every other note this app writes: it is the Portal's syllabus
  list and this app has never heard of it.
- **The ✎ is the TEACHER'S, button and window alike** (v1.5.1). It is the second door into the
  shared notebook, and the one thing that must never teach a teacher's notes is a student's own
  non-standard answer — so the button is not drawn for anybody else and `answerEditOpen` refuses as
  well. **Hiding a button is not a lock**: the handler is on `window` for the rendered card's
  `onclick`, so it is reachable from a stale card or a console whatever the head was drawn with.
  `#aeTeach` keeps its own `isAdmin` check behind both of them — three gates, because the cost of
  the last one failing is a rule in the notebook that the teacher never wrote and cannot place.
- **`renderAuth` repaints the cards when the account changes**, and `applyNotesVisibility` closes the
  window. A device handed back to a student mid-edit would otherwise still be wearing the ✎ on every
  card on screen.
- **`_ansOptionFrom` moves the tick when an MCQ is corrected by naming another option.** A card whose
  answer says (3) and whose option list still ticks (2) contradicts itself, and the tick is the half
  a student reads.
- **`_ansTrim` keeps line breaks where `_scanStr` folds them away.** A worked answer and a house rule
  are both written in lines; flattening them is a change the teacher never asked for.
- **The ✎ is not drawn while a run is in flight** — the answers are still arriving and a card can
  still be folded into the one before it — and it is `.noPrint`, because a printed answer key with a
  button on every question is a button nobody can press.
- Run **`node tools/scan-tests.mjs`** after touching any of it.

## 📥 Keeping a question — into the four vetting lists (v1.6.0, routed by subject in v1.7.0)
- **A question read off a photograph is a question the centre does not have.** Until now the only way
  one reached a bank was to be typed out again in the portal it belongs to, so in practice it never
  was: the paper was marked, the tab was closed, and the question went with it. Every answer card
  now carries **📥 Send to vetting** beside its ✎, the header carries **📥 Send all to vetting** for
  a whole paper, and the How tab carries a setting that files every question the moment a paper has
  been read.
- **It is a DIFFERENT DOOR from ✎ Edit, and the two must not be merged.** ✎ fixes the answer on the
  card and teaches the rule behind it into the shared NOTEBOOK — it is about how this app answers
  next time. 📥 files the QUESTION in another app's bank. One changes an answer, the other keeps a
  question; nothing the ✎ writes reaches a vetting list and nothing 📥 writes reaches the notebook.
- **It is the ADMIN's door and nobody else's**, on exactly the ✎'s reasoning: a student's device runs
  this very same scan. `_vetCardFootHtml`, `renderVetAllBtn`, `vetOpen`, `vetAutoTarget` and the
  How-tab card are all behind `isAdmin(currentUser)`, **and `_vetSend` asks again before it writes**.
  Hiding a button is not the same as shutting a door. The card's button carries the ✎'s SECOND gate
  too — it is not drawn while a run is in flight, because this card may be folded into the one
  before it a second later and half a question is worse than none.
- **`itemSubject` is the ONE place a question's LIST is decided** (v1.7.0), and the label on the card's
  button, the send window, the automatic filing and the batch split all read it. Two answers to that
  question is exactly how a maths question ends up in the science vetting list — approved by a
  science teacher, sitting in a science bank, served to a science class, with nothing anywhere
  reporting it because every step after the routing worked perfectly.
  - **The model says the subject per QUESTION, not per paper.** `SCAN_SUBJECT_FIELD_RULE` is the ONE
    fragment both prompts carry, and `_scanSubject` normalises the reply against `SUBJECTS` — the one
    list — mapping the words a model reaches for ("Maths", "华文") and **dropping anything that is
    not one of the four rather than bending it to a near one**. A pile photographed in one go is
    very often more than one subject, and that is the case a per-paper answer cannot serve.
  - **The teacher's own Subject picker OUTRANKS the model.** They are holding the paper: a pile they
    have declared is Mathematics is Mathematics, whatever a single question looks like to a model
    reading a photograph. That is also **the way to force a whole paper into one list** — one
    control, the one that already exists and already sharpens the answers, rather than a second
    control free to disagree with it. There is deliberately no "always file in the science list"
    setting: routing every question the same way is the fault this section exists to prevent.
  - **Nothing is filed on a guess.** No picker and no usable read → `''`, no destination, and the
    question stays on its card with its 📥 and is COUNTED in the toast. A batch that quietly filed
    fifteen of twenty reads exactly like one that filed all twenty.
  - **The button on the card names the list before it is pressed** ("📥 Send to Maths vetting"), and
    the window offers that list FIRST with the other three still there — only a person can overrule
    a misread, and they can only do it if they can see it. A whole paper is offered
    **📥 File each in its own app** with the split shown (`_vetGroupBySubject`) before it is pressed.
  - A question stitched across a batch boundary takes the subject from whichever half could name it.
- **`VET_TARGETS` is the ONE table**: a subject, the portal it belongs to, the collection that
  portal's vetting list really lives in (`vetting` / `mathVetting` / `vettingEn` / `vettingZh`) and
  the SHAPE that portal's questions take — one row each. A fifth portal is one entry rather than four
  edits that have to agree, and the How-tab picker is built from it too.
- **Two shapes, not one.** Science, English and Chinese are one lineage: the answer lives in a BLOCK
  and an MCQ's correct option is that option's **id**. Maths files its answer on the QUESTION —
  `expected` / `markingGuide`, the options as plain strings and the correct one as a **position**,
  with `-1` meaning "not settled", which is that app's own convention. A portal-shaped document
  written into Maths renders as a question with no answer in it and nothing errors anywhere.
- **`_vetSend` is the ONE writer**, used by the button and by the automatic filing alike. Two loops
  would be two places for the admin check, the already-sent guard and the failure count to drift
  apart — the same rule `_markFields` exists for.
- **`source: 'scan'` is the ONE field those four apps read**, and it is the whole contract between
  repositories that cannot see each other. Rename it here and every card still lands, still renders
  and still approves — it simply stops being purple and stops saying where it came from, with nothing
  anywhere to say so. `polymathlc/cer`, `polymathlc/math`, `polymathlc/english` and
  `polymathlc/chinese` each carry the matching `_vetIsScanned` / `vetIsScanned` predicate; **ship a
  change to the word in all five repos together.**
- **It lands in VETTING, never in the bank.** What comes back off a photograph was read by a model
  from a picture of somebody's worksheet: the wording may be half a line short, **the diagram is not
  there at all**, and the topic is a guess. Vetting is the holding pen all four portals already keep
  for exactly that, and every one of them draws the card in PURPLE and says it came from here.
- **No topic is invented.** A topic is read off the destination app's own syllabus list, which this
  app has never seen and must not carry a copy of — a topic guessed from here files the question
  under a heading nobody chose while looking perfectly filed. It is left blank and marked
  `topicConfidence: 'low'`, which is the signal the three portal apps already draw a
  "⚠ check topic" badge from: the gap is on screen rather than merely absent.
- **An option the scan could not name is left UNTICKED** (`correctId: null` / `correctOption: -1`).
  `_vetCorrectIndex` matches the LABEL the model read off the page — "3", "(B)", "b." — against the
  options rather than trusting it as an index. Guessing an option marks every class that ever sits
  the question against the wrong one.
- **The child's work does not travel.** What the student wrote, the verdict, the marks and the
  feedback stay on the card here. A bank question is the QUESTION, its options, its answer and why —
  a marked answer belonging to a named child has no business in a bank thirty other children
  practise from.
- **Plain text crosses into authored HTML escaped** (`_vetHtml`), with the line breaks kept: a "<" in
  a maths question is a less-than sign rather than the start of a tag nobody typed.
- **Filing automatically is Off or by-subject, and nothing else** (`vetAutoOn`), and it is never
  silent: the run's own toast is followed by one naming EACH list, its count, and how many were left
  behind for want of a subject. Questions filed somewhere the teacher was not told about are
  questions nobody goes and vets. `applyVetVisibility` HIDES that field for a student and never
  CLEARS it — it runs once before sign-in resolves and again after, so clearing there would wipe the
  teacher's own setting on every load; what stops a student filing anything is `vetAutoTarget`,
  which asks who is signed in at the moment the paper is read.
- **Every question that would not go is reported.** A batch that quietly sent nineteen of twenty
  reads exactly like one that sent all twenty.
- **Nothing else about this app changes.** Nothing is saved on a scan, on a Copy or on a Print; this
  and the ✎'s note are the only two paths that write anything anywhere, and each only when the
  teacher presses it.
- Run **`node tools/scan-tests.mjs`** after touching any of it.

## Maths is never answered with algebra (v1.8.0)
- **This centre teaches the methods the PSLE is marked on.** An answer that reaches the right number by
  forming an equation is a method the pupil has not been taught and cannot reproduce in the exam — and
  it is **worse than no answer, because it looks right**. So `SCAN_NO_ALGEBRA_RULE` is the ONE fragment
  that says so, and it is carried by the maths standard in `SCAN_SUBJECT_RULE` **and** by the rewrite
  call's own system prompt. It NAMES what to use instead — the unitary method, a model in words,
  before-and-after, working backwards, the assumption method: "do not use algebra" with nothing offered
  in its place is how a model reaches for it again two questions later.
- **The rule is asked in the prompt AND enforced in code.** A prompt is a request; `_itemUsesAlgebra` is
  the check. It is **plain code and never an AI call**, so the same answer always gets the same verdict
  and running it over every maths answer on every paper costs nothing.
- **The reader is narrow in BOTH directions, and every awkward case is pinned in the harness.** A false
  negative puts algebra in front of a pupil; a false positive spends one of the run's two rewrite calls
  turning a perfectly good unitary answer into another one.
  - **"3 x 4" is MULTIPLICATION**, and so is "3x4". Only a number written hard against a letter and then
    an OPERATOR is a term — "3x + 5".
  - **"5 m + 3 m" is metres.** `ALGEBRA_TERM_RE`'s letter set leaves the single-letter units (m, g, l, s,
    h, t, c) out altogether.
  - **"1 unit = 40" is the unitary method** — the very thing the rule exists to encourage — so a letter
    followed by more letters is never a variable.
  - **"x = 55°" is a PSLE angle** the paper itself lettered. `_algebraStrip` takes "∠x" and "angle x" out
    before the bare-variable test rather than trying to spell them into the pattern, and **the `\b` after
    `\d+` in `ALGEBRA_BARE_RE` is load-bearing**: without it the engine backtracks to "5", finds "5"
    where it was told to refuse a degree sign, and flags every angle answer on the paper.
- **A question that PRINTS the algebra is the one exception.** "Simplify 3x + 5x" cannot be answered by
  the unitary method: answering it another way is answering a different question, and the app's own
  authority order already says what the paper prints wins. `_itemAsksAlgebra` reads the printed QUESTION
  and its options — **never the answer**, or an algebraic answer would excuse itself.
- **Only maths is held to it** (`_itemIsMathish`), plus a question whose subject could not be told: on a
  mixed page the unrouted one is very often the maths one, and algebra in an English answer is
  vanishingly rare.
- **THE REWRITE IS RATIONED, AND THE RATION IS PER RUN.** `SCAN_ALGEBRA_FIX_CALLS` (2) and
  `SCAN_ALGEBRA_FIX_MAX` (12): a page of fifteen questions that all slipped is ONE call, not fifteen, and
  a paper that keeps slipping costs two calls and then stops. The ration is spent BEFORE the call, so a
  failed rewrite cannot buy another try, and it is refilled once in `runScan` and nowhere else. The calls
  are **text only** — no pictures are sent again, which is what makes them cheap. An ordinary paper
  spends none at all. Left unbounded this is exactly the loop that quietly spends a term's tokens on one
  stubborn worksheet.
- **It runs BEFORE the cards are painted.** `_algebraPass` sits between `_scanFoldRows` and
  `renderAnswers()` in `_runPages` (and after `_askFoldRows` on the ask-alone path), so an algebraic
  answer is rewritten before a pupil can read it rather than flickering and being replaced.
- **A rewrite is taken only when it is really free of algebra.** A second algebraic answer is not an
  improvement on the first, and keeping the original at least keeps it in step with the marking it was
  written with. An entry naming a question that is not in the batch is dropped, never applied to
  another one.
- **Whatever survives the budget is MARKED, not hidden.** `it.algebra` puts a **⚠ uses algebra** chip on
  the card: an answer nobody can see is worse than one that says what is wrong with it, and ✎ Edit is
  right there. The flag is recomputed on every pass, so a fixed answer stops wearing it.
- Run **`node tools/scan-tests.mjs`** after touching any of it.

## The screen: three buttons and two tabs (v1.2.0)
- **The Snap tab is a CAMERA, not a form.** Three controls at the bottom, thumb-height, and nothing
  else: **the gallery on the left** (wearing the newest page and a badge counting the pages in
  hand), **the shutter in the middle**, **✓ on the right**. That is the whole interaction — a phone
  held over a worksheet, one thumb. Anything added to that bar has to earn its place against the
  three that are there.
- **The ask row is a row of its OWN** (`#askBar`, inside `#camDock`, above `#camBar`). Grown into
  the camera bar it would be a fourth control on the one bar that is allowed exactly three. The
  dock is what is fixed to the viewport now, with `env(safe-area-inset-bottom)`; the bar inside it
  is an ordinary flex row, and **`#scanPage` carries the bottom padding that clears the dock** so
  the How tab does not end in a screenful of nothing.
- **Every setting lives on the How-to-use tab**, because a picker on the snap screen is a decision
  demanded before the first photo. The explanation depth defaults to *answer + full working*; the
  level and subject default to *Any* and only narrow which teaching notes apply, so leaving them
  alone is a correct answer rather than an unfinished one.
- **✓ is the only thing that spends money**, so it is the only control that changes state while a
  run is going: it becomes a spinner, and the other two go flat. A second run started on top of the
  first is the one mistake this screen can make.
- **`renderCamBar` is the ONE place the bar is painted** — the badge, the face, the three disabled
  states and the empty-screen prompt — and `renderShots` calls it. Two painters would drift the
  moment a picture failed to open.
- The camera bar is **fixed to the viewport with `env(safe-area-inset-bottom)`** and belongs to the
  Snap tab alone: a shutter under the instructions is a button that does the wrong thing.
- Run **`node tools/scan-tests.mjs`** after touching the screen — it pins the three controls, their
  order, the two tabs and the settings staying off the snap screen.

## The scan itself
- **The pictures are read as ONE RUN, never one question per picture.** They go up `SCAN_BATCH` (3)
  at a time as several images in a single vision call and the model decides where each question
  starts and ends — so a question spread over two pages comes back as one question, and a page
  holding twelve comes back as twelve.
- **A question straddling a batch boundary is stitched by the `continuation` entry**, the same
  mechanism the Learning Portal's exam-paper builder and Mark Paper use across a page break: the
  first entry of a batch marked `"continuation": true` is folded into the previous question rather
  than filed as half a question of its own. The carry line (the tail of the last question) is what
  tells the model there is something to continue.
- **A lettered part is its own entry** (`8(a)` and `8(b)` are two), because that is how they are
  answered and marked.
- **Both routes in end at `addShots`**, the ONE queue, so a camera photo is prepared exactly as a
  gallery picture is. Do not give the camera its own pipeline.
- **The picker's `value` is cleared BEFORE the files are queued.** An `<input type=file>` still
  holding last time's file fires no `change` for the same photo picked twice, so the second tap
  does nothing at all — a button that looks like it works and does not.
- **An oversized photo is SHRUNK, not refused** (`_prepShot`). A 12 MP camera photo is several
  megabytes; anything over `SCAN_SHRINK_OVER` is re-encoded as **JPEG, never PNG** — a photograph
  re-encoded as PNG comes out bigger than it went in. `SCAN_PHOTO_MAX_SIDE` is deliberately
  generous: the whole read rests on the small print, and "$140.20" and "$14.20" are the same
  handful of pixels.
- **A picture that could not be opened is shown as a failed card, never dropped in silence** — a
  photo that vanishes reads as one that worked. For the same reason **one unreadable batch never
  sinks the rest of the paper**: those pages are marked failed and the run carries on.
- **The thumbnails' page numbers count only the pictures actually SENT.** A picture that could not
  be opened holds no page number, or every answer after it cites a page one out.
- **The run both answers and marks, so it is grounded as `aiGrounding('scan')`.** Grounded as a
  plain `'answer'` call it would mark a whole paper without ever being told how this teacher marks,
  and every card would still look perfectly right.
- **`thinkingLevel: 'high'` is what decides whether the answers are right.** A P5 word problem is
  four or five steps of units and model drawing, and a model answering off the top of its head gets
  them wrong. Do not turn it down to save tokens.
- **`_scanRun` is bumped on every run**, so a reply that arrives after the teacher has started again
  is dropped instead of landing among the new answers.

## House rules
- After touching **the grounding, the live notebook, the scan run or the vetting door**
  (`aiGrounding`, `notesBlock`, `guidanceBlock`, `styleBlock`, `noteAppliesHere`, `noteSubjects`,
  `notesRelevant`, `groundingSummary`, `loadTeachingNotes`, `_notesDetach`, `stopTeachingNotes`,
  `_notesLiveRepaint`, `_ansEditApply`, `_ansEditNote`, `_ansOptionFrom`, `_ansTrim`,
  `_scanNewItem`, `_scanFoldRows`, `_markFields`, `_askNewItem`,
  `_askFoldRows`, `_askPrompt`, `_scanPrompt`, `SCAN_SYS`, `SCAN_DETAIL_RULE`, `SCAN_MARK_RULE`,
  `SCAN_SUBJECT_RULE`, `SCAN_ASK_SYS`, `SCAN_ASK_WITH_PAGES_RULE`, `SUBJECTS`, `_parseAIJson`,
  `SCAN_NO_ALGEBRA_RULE`, `SCAN_ALGEBRA_SYS`, `ALGEBRA_PHRASE_RE`, `ALGEBRA_TERM_RE`,
  `ALGEBRA_BARE_RE`, `_algebraStrip`, `_textUsesAlgebra`, `_itemAsksAlgebra`, `_itemIsMathish`,
  `_itemUsesAlgebra`, `_algebraPass`, `_algebraPrompt`, `_applyAlgebraFix`,
  `SCAN_ALGEBRA_FIX_CALLS`, `SCAN_ALGEBRA_FIX_MAX`,
  `VET_TARGETS`, `VET_SOURCE`, `_vetSend`, `_vetSendBySubject`, `_vetPortalDoc`, `_vetMathDoc`,
  `_vetCorrectIndex`, `_vetTitle`, `_vetHtml`, `_vetCardFootHtml`, `vetOpen`, `vetChoose`,
  `vetChooseAuto`, `_vetAutoFile`, `SCAN_SUBJECT_FIELD_RULE`, `_scanSubject`, `itemSubject`,
  `itemTarget`, `_vetGroupBySubject`),
  run
  **`node tools/scan-tests.mjs`**. It loads the REAL sections out of `index.html` and runs them
  against stubs. Every failure here is silent and the app carries on looking perfectly right: a
  digest that comes back empty is an answer that is no longer the teacher's, key facts leaking into
  a marking digest is the answer handed to the marker, a continuation that stops folding turns one
  question into two halves each with half an answer, and a page number that is batch-local rather
  than global cites the wrong page on every answer after the third. A verdict kept on a blank puts
  a red cross on a question nobody attempted, and a note tagged `english` that grounds a Chinese
  paper is the wrong notebook answering, and an instruction that stops governing the run turns
  "only question 5" back into the whole paper with nothing on screen to say why. The listener is in there for
  the same reason: a one-shot read looks exactly like a live one until the day somebody types a
  note in Ans Key mid-lesson, and then this app is quietly a day behind the one next to it.
  The vetting door is in there because everything it can get wrong happens in an app this one
  cannot see: a document written in the wrong SHAPE renders as a question with no answer in it, a
  guessed option marks a whole class against the wrong word, a topic invented from here files the
  question under a heading nobody chose, and a `source` that stops saying `'scan'` lands a card
  that is no longer purple and no longer says where it came from. The ROUTING is the worst of them:
  a maths question sent to the science list is approved by a science teacher, sits in a science bank
  and is served to a science class, and every step after the wrong turn works perfectly. The algebra
  reader is in there for the mirror of that reason: too eager and it spends the run's whole ration
  rewriting good unitary answers, too timid and a pupil is handed a method they were never taught and
  cannot use in the exam — and both look, on the screen, like an app working perfectly.
- **The Gemini model is `AI_MODEL` and its thinking floor is `AI_THINK_MIN`, and the two move
  TOGETHER.** Every model has its own thinking scale, and a level it does not know is a
  **400 INVALID_ARGUMENT on every AI call in the app** — not a worse answer, no answer at all.
  `gemini-3.7-flash` takes `low` / `medium` / `high` and **dropped the `"minimal"` 3.6 accepted**,
  exactly as 3.x had already dropped 2.x's numeric `thinkingBudget`. So the floor is a named
  constant used at every call site, and swapping the model means checking its scale first.
  `polymathlc/anskey` and `polymathlc/cer` carry the same pair — keep all three in step.
- There is **no secret in this file**. The Firebase web API key and the reCAPTCHA site key are
  public client config; quota abuse is prevented by App Check, enforced in the Firebase console.
  Never commit an OpenAI-style key here — this is a public static site served to every student's
  browser.
- After editing `index.html`, syntax-check both script blocks:
  `python3 -c "import re;s=open('index.html').read();b=re.findall(r'<script(?![^>]*src=)[^>]*>(.*?)</script>',s,re.S);open('/tmp/c0.js','w').write(b[0]);open('/tmp/c1.mjs','w').write(b[1])" && node --check /tmp/c0.js && node --check /tmp/c1.mjs`
- Commit messages and pushed artifacts must not contain the model identifier.

## Versioning convention — applies to EVERY change (do this every time)
1. **Bump the version.** In `index.html`, update `var APP_VERSION = 'vX.Y.Z'`. Patch bump for
   fixes/small tweaks, minor bump for new features.
2. **Keep it visible.** It renders in the header (`#versionTag`).
3. **Report it.** When summarising an update in chat, always state the new version number.

The whole point: the user checks the version shown in the app against the number reported in chat
to know whether the upload/deploy went through.

## Design convention — breathing space (applies to EVERY UI you build/touch)
- Give elements room to breathe: generous, consistent padding inside cards, clear vertical spacing
  between title → description → meta → buttons, and comfortable line-height. Never cram content
  edge-to-edge or stack lines tightly.
- Cards are rounded rectangles constrained to a sensible max-width and centred — not a dense,
  full-bleed block.
- When the user says something is "too big/thick/messy", the fix is usually *more* whitespace and a
  tighter width, not shrinking fonts until it is cramped.
