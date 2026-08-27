# CLAUDE.md

Guidance for Claude when working in this repo.

## App
- `index.html` — **"Scan & Answer"**. One self-contained file (markup + CSS + JS) on the shared
  `mathgen--app` Firebase project with Google sign-in. Photograph a worksheet or an exam paper —
  or pick pictures out of the gallery — and **every question printed on them is read: what the
  student has already written is MARKED, what is still blank is ANSWERED**. Four subjects:
  Science, Mathematics, English, Chinese, and **every answer card says which of the four the question
  is**. **The working is handed over ONE STEP AT A TIME** — press Next step, read the line and the
  reason under it, and the answer is the last step — with one press to open the whole paper; see
  that section below. **A typed or dictated question is the other way in**:
  with pages it governs the run, with no pages it *is* the run. **When the last page has been read,
  the marked script comes back as a REPORT** — the score, what went well, what the mistakes have in
  common, what to practise next. See that section below. **Every question the student gets WRONG is
  kept, in their own mistake book**, and a worksheet of the ones they choose is emailed to them as a
  link — see those sections too. Nothing else is saved anywhere: a
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
  - **THE QUESTION'S OWN SUBJECT DECIDES, and the Settings picker is the fallback behind it**
    (v1.21.0). That is the opposite way round from how this shipped, and the reversal was asked
    for by name: a maths question was coming up as *"Send to Science vetting"* because the picker
    happened to be set to Science, and **the subject a question IS does not change according to
    what somebody chose on another tab before photographing it**. `itemSubjectWhy` is the ONE
    place it is decided, and it returns **`from`** as well as the key — "what this question reads
    as" and "the subject you set" are very different claims to put in front of somebody about to
    file a question in another app, so the picker and the confirm sentence each say which of the
    two they mean.
  - **The picker still does its REAL job, which was never routing.** It is what
    `scanSubjectRule()` reads to hold the ANSWERS to one subject's standard, and it is what a
    question the model could not place falls back to — so a paper that is all one subject still
    files itself in one list. Setting it is still how you say "this whole pile is maths"; it is no
    longer a way to overrule what a question plainly is. There is deliberately no "always file in
    the science list" setting: routing every question the same way is the fault this section
    exists to prevent.
  - **`_itemIsMathish` reads the same one place**, so the no-algebra rule follows the question too:
    a maths question photographed on a pile set to Science is now held to it instead of being
    exempt from it.
  - **Nothing is filed on a guess.** No usable read and no picker → `''`, no destination, and the
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

## 📋 The report on the whole script (v1.9.0)
- **Twenty marked cards are twenty separate verdicts.** What a teacher writes at the bottom of a
  paper they have just marked is the thing none of those cards can say: the same mistake in
  questions 3, 7 and 12 is ONE misunderstanding, not three. So when the run finishes, the marked
  script goes up once more and comes back as a report — the score, what is already solid, what the
  mistakes have in common, and what to practise next.
- **It is automatic and has no setting**, exactly like the marking. A picker asking "report or no
  report?" is a decision demanded before the app has seen the paper.
- **THE SCORE IS NEVER THE MODEL'S.** Every number on the card is counted in plain code by
  `reportScore`, from the verdicts already on the answer cards, and `REPORT_SYS` forbids the model
  a score, a total, a mark or a percentage at all. A model asked to add up its own marking gets it
  wrong often enough, and a total that disagrees with the chips printed directly above it is the
  app contradicting itself in front of a parent — worse than no report.
- **`_reportMarkStr` is the ONE place "2/3" becomes two numbers**, and it is deliberately strict:
  "3 marks", "2 out of 3" and "½" are not allocations this can add up. **The paper's own marks are
  used only when EVERY judged question printed one** (`marksUsable`) — a paper where three
  questions in ten print an allocation would otherwise come back "5/6", which reads as the score
  for the whole script. Otherwise it is counted a question at a time, a `partial` worth half
  (`REPORT_CREDIT`), and the card SAYS which of the two it did (`reportBasisText`).
- **A blank is never in it**, on either side: `reportScore` counts it as blank rather than wrong,
  only attempted questions reach `_reportPrompt`, and the prompt says in as many words that a blank
  is not a mistake. **An answer the model would not give a verdict on is out of the percentage
  altogether** — counting it wrong marks the student down for the model's indecision.
- **It is NOT a second marker.** The pictures are not sent again: the call sees only the
  transcription the run already produced (reading and marking are separate passes, as the Learning
  Portal's Mark Paper keeps them), and it is told the verdicts are final. A report that quietly
  re-marked question 4 would leave a card saying "correct" above a report saying it was not.
- **It is grounded as `aiGrounding('mark')`** — the one-door rule. `'mark'` is the honest kind: the
  report is written ABOUT marking, so it gets the teacher's marking standard and deliberately not
  the key facts and exemplars, which would tempt it into answering the paper again.
- **`reportEligible` decides who gets one**: two or more MARKED page questions. A fresh worksheet
  has nothing to report on, and one marked question is the feedback card again in longer words. An
  answer to a typed question (`kind: 'ask'`) was never on a paper and is never a script.
- **A failed call still leaves a real report** — the score is on screen the moment the run ends and
  only the WORDS are waited for. 📋 Report rewrites it.
- **A question reference the model invented is dropped** (`_reportRefs`, matched the way the option
  labels are, so "7(a)", "7a" and "(7a)" are one question): a reference to a question that is not
  on this paper points the student at nothing.
- **It PRINTS.** `#reportWrap` sits outside the `noPrint` header card on purpose — the chips at the
  top of the page do not print, and a printed script with no score on it loses the half a parent
  reads. It goes out with Copy too. Nothing is saved, as everywhere else here.
- Run **`node tools/scan-tests.mjs`** after touching any of it.

## 📷 The camera stays open (v1.10.0)
- **`<input capture>` hands the job to the PHONE'S OWN camera app**, and that app is built around
  taking ONE photograph: "use photo / retake", and then it closes. On a twelve-page paper that is
  four taps a page and eleven trips in and out of the browser, and the pages that get skipped are
  the ones at the end. So the page grows its own camera: `getUserMedia` puts the live picture on
  screen, the shutter grabs the frame, and **nothing else happens** — no confirmation, no leaving
  the page, the lens still open on the next page. Done closes it.
- **`camAvailable()` is the ONE test, and the fallback is the route that was always there.** No
  `getUserMedia`, no camera, a permission refused, a lens another tab is holding — every one of
  them falls back to `$('cameraInput').click()` rather than leaving a shutter that does nothing. A
  refusal says once why the screen looks different and then gets out of the way.
- **`facingMode` is asked for as `ideal`, never `exact`.** A laptop with only a front camera must
  still get a camera rather than an `OverconstrainedError`.
- **BOTH ROUTES END AT `addShots`**, the one queue: a frame is drawn to a canvas at
  `SCAN_PHOTO_MAX_SIDE`, encoded as **JPEG (never PNG** — a photograph re-encoded as PNG comes out
  bigger), wrapped as a `File` and handed over, so the shrinking, the page numbering, the
  failed-card rule and the batching are written once. Do not give the viewfinder its own pipeline.
- **THE TRACKS ARE STOPPED ON EVERY WAY OUT** — Done, Cancel, Escape and leaving the Snap tab. A
  camera left running is a recording light on somebody's phone and a flat battery, and there are
  four doors out of that overlay.
- **Cancel asks BEFORE the stream is dropped** (so "no" costs nothing) and only ever drops the
  photos taken in THIS visit: the pages already in hand when it opened were not taken here.
- **The strip along the bottom is the whole feedback loop.** A shutter that gives nothing back is
  one nobody trusts, and the page you thought you took is the page nobody notices is missing until
  the answers come back short. `renderShots` refreshes it, so one painter keeps it in step.
- Run **`node tools/scan-tests.mjs`** after touching any of it.

## 📕 The mistake book, and the worksheet it makes (v1.10.0)
- **THIS IS THE ONE PLACE THIS APP KEEPS A CHILD'S WORK, and the rule above was changed on purpose
  to put it here.** Everything else is built on nothing being saved. But a mistake nobody writes
  down is one made again next week, and a paper marked, closed and forgotten is exactly what that
  rule was costing. So the wrong answers — and only the wrong answers — are kept.
- **It is the student's OWN**, under their own account (`users/{uid}/scanMistakes`). Nobody else's
  device reads it, the teacher's book is the teacher's own mistakes, and there is no roster
  anywhere. **Everyone gets one — student and admin alike** — which is what makes it different from
  📥 Send to vetting.
- **THE COLLECTION NAME IS NAMESPACED, and that is not tidiness.** The Science portal writes
  `users/{uid}/mistakes` under this very same project and this very same uid, so a book called
  `mistakes` here would be two apps sharing one collection — this app's questions in that app's
  mistake log and back again, with nothing throwing and nothing looking wrong. `MB_COL`
  (`scanMistakes`), `MB_PAPER_COL` (`scanPapers`) and `MB_IMG_PATH` (`scan-mistakes/`) are this
  app's and nobody else's, and every path is built from those constants.
- **It SAYS SO, every time.** The run's toast names how many went in, the header button wears the
  count, and every marked-wrong card carries a 📕 chip that takes it back out in one tap. A thing
  quietly saved is a thing nobody knows to delete.
- **`mbIsWrong` is the ONE test**, and it re-states the blank rule: a blank was never attempted, so
  it is not a mistake; a correct answer is not; an answer to a typed question was never on a paper.
- **`mbKeyOf` folds the wording**, so a paper photographed twice is one mistake rather than two.
- **WHAT IS KEPT IS THE WHOLE QUESTION, CUT OUT OF THE STUDENT'S OWN PHOTOGRAPH** (v1.17.0). A
  question rebuilt from a transcription is only ever as good as the OCR, and a maths or science
  question is its LAYOUT as much as its words — a table, a number line, ruled working space, four
  options in a grid. Retyping that is where a re-do stops being the same question. So
  `SCAN_BOX_RULE` asks for **`questionBox`** round the whole printed question — number, wording,
  options, figure and answer space — and that crop is what the student gets back to answer on.
  The transcription goes back to being what it always honestly was: what the marking was done
  against, and what fills the answer key.
- **THE PICTURE IS CROPPED AT THE MOMENT IT IS FILED**, because that is the only moment the
  photograph is still in the tab. Both rectangles are `[ymin,xmin,ymax,xmax]` as integers 0–1000,
  the same convention the Learning Portal's rapid question adder uses.
- **`_mbBoxOk(box, whole)` is the ONE test, and `whole` is the whole difference.** A FIGURE that
  fills the page is a selection that failed — nothing was picked out — so it is refused. A whole
  QUESTION that fills the page is perfectly ordinary: an open-ended question with a big diagram and
  six ruled lines really is the whole sheet, and refusing it would throw away exactly the questions
  worth trying again. Everything else — malformed, off the page, minute — is refused either way,
  because **a wrong rectangle is worse than none**: it keeps somebody else's question and looks
  like a working crop.
- **`diagramBox` IS STILL THE FALLBACK.** A question box the model would not draw, or drew badly
  enough to fail the test, leaves the old behaviour exactly as it was rather than leaving the card
  with no picture at all — which is the one outcome worse than a figure without its wording. The
  prompt still says to OMIT `diagramBox` for a question that is only words.
- **`shot` (`'question'` / `'figure'`) TRAVELS WITH THE CROP**, onto the mistake and onto the
  worksheet, because the two are laid out completely differently at the other end: a question
  picture IS the question and its wording must not be printed above it as well, while a figure sits
  beside wording that is doing the asking. A picture filed as the wrong one of those reads, on
  paper, as the question asked twice or as a diagram with nothing to do — and it cannot be guessed
  later. An old paper carries no flag and is read as `'figure'`, which is exactly what it holds.
- **A whole question keeps more pixels than a figure** (`MB_QCROP_MAX_SIDE`): it is READ, not
  glanced at, and 9pt print that survives a look at 1400px does not survive being answered from.
- **A crop that fails costs the DIAGRAM and never the mistake.** The document is written last, the
  picture is only ever an extra on it, and `imgNote` puts the gap on the card rather than leaving a
  question that quietly lost its figure. Storage being absent is survivable in the same way.
- **A stitched question crops from the page its rectangle was drawn on** (`boxPage`), or a question
  running over the page keeps a rectangle of the wrong sheet.
- Run **`node tools/scan-tests.mjs`** after touching any of it.

## 🧩 Reproducing the question — the Learning Portal's Rapid add, ported (v1.18.0)

`MB_BUILD_SYS` / `_mbCleanBlocks` / `_mbBuildShots` / `_mbBuildBlocks` / `_mbBuildFigures` /
`_mbBuildFor` / `MB_BUILD_MAX` (search `REPRODUCING THE QUESTION`), and the `blocks` array on the
mistake and on the `scanPapers` item. The other half is `mistakes.html` in `polymathlc/cer`.

A crop of the photograph is the question as it really was and it is unbeatable for LAYOUT — but it
is a photograph: grey, skewed, and carrying whatever was on the desk. The Science portal's ⚡ Rapid
add does something better, and this is a port of it: the printed question is read into **ordered
blocks** — the wording as text, with an `image` block wherever a figure belongs, each figure cut
from the page by its own rectangle — so the question comes back **typeset**, with the paper's own
diagrams still in it.

- **IT IS ITS OWN CALL, and that is deliberate.** The scan run is already doing two hard things at
  once (marking what is written, answering what is not) on a prompt tuned for both, and bolting a
  block specification onto `SCAN_SYS` would buy a better worksheet at the price of worse marking.
  This runs afterwards, on the handful of questions actually being FILED — two or three out of
  twenty on an ordinary paper.
- **THREE TIERS, BEST FIRST, and nothing above may cost anything below it**: the blocks, then the
  whole-question crop, then the flat transcription. `_mbBuildFor` swallows every failure and
  returns `[]`, so a rebuild that did not work files the entry exactly as it would have been filed
  before this existed. That is the same shape as the answer key's three sources.
- **THE RATION IS PER RUN**, like the algebra rewrite's: `MB_BUILD_MAX` (10), spent **before** the
  call so a failure cannot buy another try, and refilled **once** in `mbFileRun` and nowhere else.
  A paper where every question is wrong must not quietly spend twenty vision calls.
- **A build with no WORDING is refused outright** (`_mbCleanBlocks` returns `[]` unless at least one
  text block survives). A question made of pictures with nothing asking anything is worse than the
  tiers under it — and validating on ARRIVAL rather than at render is what stops a block that
  cannot draw being found out on the printed page.
- **INCLUDE THE SHARED STEM.** Scan files a lettered part as its own item, so a part torn away from
  the stem it depends on cannot be answered at all: the prompt asks for question 13's wording and
  figure first, then 13(a)'s own.
- **LEAVE THE MCQ OPTIONS OUT.** They are already held on the mistake and the worksheet prints them
  under the blocks; inside the wording as well they would be the choices offered twice.
- **A figure that will not crop or upload is DROPPED from the blocks**, never left as an empty
  frame — the wording around it still reads, which is exactly what the whole-question crop cannot
  fall back on.
- **`page` says which attached picture a rectangle was drawn on**, so a question stitched over a
  page break crops from the right sheet — the same rule `boxPage` carries for the crop.
- Run **`node tools/scan-tests.mjs`** after touching any of it.

## ✂️ The figure, and not the sentence above it (v1.19.0)

`_mbInkLevel` / `_mbLumaHist` / `_mbInkProfile` / `_mbClearEdge` / `_mbRuleGroups` /
`_mbTrimTextRows` / `_mbTightenRect` (in `index.html`, search `THE FIGURE, AND NOT THE
SENTENCE ABOVE IT`).

A model's rectangle round a figure is a guess made by eye, and the way it is wrong is
always the same: it overshoots up or down and takes a line of the question's own WORDING
with it. The worksheet then prints the figure with half a sentence stuck to its top edge
and the tail of the next one under it, which is exactly what a scanned question looked
like before this.

- **THE OLD PAD MADE IT WORSE, and it is worth writing down why.** The margin was measured
  on the PAGE — 3% of its width, 2.5% of its height — so on an ordinary phone photograph it
  grew every rectangle by fifty or sixty pixels in every direction, a whole line of 9pt
  print, whether or not the rectangle needed any help at all. A pad that size cannot be
  tuned: it is either too small to rescue a clipped label or big enough to swallow a
  sentence. The pad is measured on the BOX now (`MB_PAD_FRAC`, 1.5%) and is deliberately
  tiny; the two jobs it was doing badly are done properly by the passes below.
- **THE THRESHOLD IS MEASURED, NOT ASSUMED, and that is the one thing that could not be
  ported as it stood.** `polymathlc/cer`'s `_expandRectToWhitespace` / `_trimEdgeTextLines`
  read a SCREENSHOT, which is white at 255, so a fixed "darker than 190 is ink" works
  there. This app reads a PHOTOGRAPH: the paper is grey, the light slopes across the sheet,
  and a fixed line reads the whole page as ink — so the trimmer finds ONE band covering
  everything and does nothing at all, on every photograph, with nothing on screen to say it
  has stopped working. `_mbInkLevel` takes the paper's own white as the **98th percentile**
  of the luma (the statistic the Portal's paper-clean pass already uses — the top 2% is
  given away because a specular highlight off a glossy sheet is 255 and is not what the
  page is made of) and ink is `MB_INK_RATIO` of it or darker.
- **IT IS PIXEL WORK, NOT ANOTHER AI CALL.** The Portal asks a second vision call to tidy
  each crop (`_aiRefineCrop`), which works and costs a call per figure on a run that is
  already reading a whole paper. These are free, instant and deterministic — the same
  picture always comes out the same way — and the Portal keeps its refine pass on top of
  them.
- **ONE READBACK, THREE PASSES.** The probe covers the box plus everywhere an edge is
  allowed to move to, downscaled to `MB_ANALYSE_MAX_SIDE`, read once. ① every edge standing
  on ink walks out until it stands on clear paper (generous sideways, because a label and
  its leader line stick far out of the drawing they name; mean vertically, because what
  sits above and below a figure is nearly always the wording). ② bands that are plainly
  prose are cut off the top and the bottom. ③ whatever survives is pulled in to the first
  and last row with any ink in it — the one move here that cannot be wrong, because it
  removes measured empty paper and nothing else, and it is what the old pad was reaching
  for and getting backwards.
- **A BAND IS PROSE ON FIVE COUNTS, and the last two are what stop a table or a graph being
  eaten a row at a time**: one line tall, spanning most of the width, not solid — and then
  **no long stroke in it** (`MB_MAXRUN_FRAC`) and **made of many short pieces**
  (`MB_RUNS_MIN`). Density alone cannot see an axis: a hairline right across a wide crop is
  a fraction of a percent of the pixels in its row, so "not solid" passes it happily and the
  trimmer takes the top off the table it was pointed at. A caption, an axis title and a
  label are all narrow and survive on the width test.
- **A FRAMED TABLE IS NOT TRIMMED AT ALL.** `MB_RULE_GROUPS` full-width rules in one crop is
  a ruled table, whose every row is short, wide and full of letters — prose on every count
  that reads a row on its own. **Four, not three**: an ordinary boxed diagram is a rule top,
  a rule bottom and a divider across the middle, and at three the pass would stand down on
  half the figures it was written to clean.
- **A RUN OF CONSECUTIVE LINES goes together**, which is the case the Portal's version
  cannot reach. Two lines of a question sit a few pixels apart, far less than the clear band
  that separates the wording from the figure, so a trimmer that insists on clear paper after
  the FIRST line finds none, stops, and leaves both lines on the picture. The cut is
  remembered only at the end of a run that ended in a real gap, so a band with nothing but
  figure after it is still never touched.
- **IT FAILS SAFE, ALWAYS** — a crop too small to analyse, a canvas that will not read back,
  a trim that would take more than `MB_TRIM_MAX` of the crop or leave less than
  `MB_TRIM_KEEP` of it: every one of them hands back the rectangle it was given. A slightly
  loose crop is a figure with a stray line over it; a confident wrong one is a figure with
  its own labels cut off, and only one of those can be seen for what it is on the printed
  page.
- **THE WHOLE-QUESTION CROP IS NEVER TIGHTENED.** It is MEANT to hold the wording — that is
  what it is for — so `whole` skips both passes.
- Known limit, and it is deliberate: the page is not de-skewed. A sheet photographed more
  than a couple of degrees off square smears every row profile into one band, which is
  refused as prose (too tall) — so the pass does nothing rather than something wrong.
- Run **`node tools/scan-tests.mjs`** after touching any of it.

## 🔢 Four picture options are ONE picture (v1.19.0)

`MB_UNION_SLACK` / `MB_UNION_MAX_AREA` / `_mbUnionBox` / `_mbCleanBlocks`'s `options` arm,
and `role: 'options'` on the block that comes out.

A multiple-choice question whose four choices are little DRAWINGS — four shapes, four
graphs, four circuits — has options that cannot be written out. The rebuild was told to
leave every option out on the grounds that the app already holds them as words; for a
picture question it holds four empty strings, so what came back was a question with a
diagram and four blank choices, printed and handed to a child with nothing to choose
between.

- **THEY TRAVEL AS ONE RECTANGLE.** Cut out separately, four options become four pictures
  stacked down the page: the row they were printed in is gone, they are each a different
  size, and they stop reading as a set of choices at all — a student answering "(3)" cannot
  see which one (3) was. One rectangle keeps the paper's own layout, keeps the (1) (2) (3)
  (4) labels attached to the pictures they name, and is one crop instead of four.
- **AND IT IS NEVER TRIMMED.** The prose trimmer exists to take lines of text off a figure;
  an options band is a row of pictures with a number printed under each of them, so pointed
  at this it works perfectly and takes the choices off one line at a time. `role: 'options'`
  is what says so, and `{ trim: false }` in `_mbBuildFigures` is the one place it is read.
- **THE BLOCK IS AN ORDINARY `image` WEARING A ROLE**, and that is the whole contract with
  the viewer (`polymathlc/cer`'s `mistakes.html`, v1.4.0, `hasPictureOptions`). A viewer
  that has never heard of picture options draws it as a figure and prints the (empty) word
  options under it — untidy, and the question is still answerable. A block of a TYPE nobody
  knows would have been dropped on the floor instead, and the choices with it. **Ship a
  change to the word in both repos together.**
- **"One rectangle" is a rule a model can be ASKED to follow and cannot be MADE to**, so
  several are merged rather than the first being kept — but only when they really do sit
  together. Boxes in opposite corners union to most of the sheet, which is not a set of
  options but a failed reading, and the caller is better off with nothing
  (`MB_UNION_SLACK`, `MB_UNION_MAX_AREA`).
- Run **`node tools/scan-tests.mjs`** after touching any of it.

## ✓✓ …and takes itself out again (v1.11.0)
- **A book that only fills is a list of everything a student has ever got wrong**, which is a list
  nobody opens. What empties it is the thing the whole feature is for: doing the question again and
  getting it right — `MB_CLEAR_WINS` (2) times **in a row**.
- **THE LOOP CLOSES BY PHOTOGRAPHING THE WORKSHEET BACK IN.** That is the only place this app can
  honestly learn the answer is now right: the sheet is printed and done on paper, scanned like any
  other paper, marked like any other paper, and `mbFileRun` reads the verdicts that came out. There
  is no second marker and no "I got it right" button — a book emptied by a student ticking their
  own work empties itself the day before the exam. The printed sheet SAYS to scan it back
  (`cer/mistakes.html`), because a loop nobody knows about is a loop nobody closes.
- **"In a row" is the whole rule, and the RESET is the half that carries it.** `mbNoteWin` moves the
  streak on and clears at 2; `mbNoteMiss` puts it straight back to 0 for anything attempted and not
  fully right — **`partial` included**, because that is an attempt that was not right. Without the
  reset this is "right twice ever", which a student reaches by accident on a question they still
  cannot do.
- **A BLANK changes nothing, either way.** The pass skips an unmarked answer before it ever looks
  the question up, so skipping a question on the re-do cannot wipe a streak that was earned. It is
  the same rule the marking, the report and the filing are all built on.
- **`mbFileRun` is ONE pass and the ONE place a run changes the book** — what was got wrong goes in,
  what was got right moves towards coming out, what was attempted and missed starts again. `seen`
  is the guard that makes one attempt one attempt: a question photographed on two pages, or a page
  shot twice, would otherwise clear in a single sitting.
- **`mbFindByKey` is the ONE matcher, and its two failures are NOT symmetrical.** Failing to match
  leaves a mistake in the book a moment longer, which costs nothing; matching the WRONG one deletes
  a question the student still cannot do, on somebody else's right answer, with nothing anywhere
  saying so. So it is the exact folded key first, and a `MB_KEY_PREFIX` (60) prefix only when it is
  **unique** — two entries that both match means no match at all, never a guess between them.
- **It SAYS what it did**, because a question that vanishes with nothing on screen is what makes a
  student stop trusting the book: the toast names what cleared and what is one away, the card wears
  the count (*right 1 of 2*) — and `_mbRunNews` is what lets a CLEARED question still report itself
  from a card whose entry is no longer there to look up.
- Run **`node tools/scan-tests.mjs`** after touching any of it.

## 📤 The worksheet, and the link that reaches it (v1.10.0)
- The chosen mistakes are written as ONE `scanPapers` document and the student is sent a link. **The
  page at the other end is NOT in this repository**: it is `mistakes.html` in the Science Learning
  Portal (`polymathlc/cer`), which already owns the printed-worksheet look and the image model that
  cleans a photographed figure up. This app keeps the photographs, so it crops; that app renders and
  cleans.
- **IT MUST NOT DISTURB THAT APP.** Nothing is written into the Portal's question bank, its vetting
  list, its notebook or a student's progress there, and the page that reads the paper is a
  standalone file that touches nothing else of its own. Same reason as the collection names above.
- **The link is built RELATIVELY and then made absolute.** `MB_VIEWER_PATH` is
  `../cer/mistakes.html` — the four portals are sibling folders on one host, so that resolves on
  GitHub Pages, on a local checkout and on a domain of the centre's own later — and
  `new URL(..., location.href).href` gives the whole address an email needs without this file ever
  naming a host.
- **THE EMAIL IS BEST-EFFORT AND THE LINK IS NOT.** The mail document is written in the shape
  Firebase's Trigger Email extension reads (`mail/{id}` = `{ to: [address], message: {…} }`), and a
  queue that failed is REPORTED. The link is always on screen with a Copy button, and the window
  says plainly whether the email could even be queued: telling a student an email is on its way when
  nothing can send it is the outcome worth engineering against.
- **The student's own answer TRAVELS with their own paper** — unlike a question sent to a vetting
  list, where it must never go. The difference is who it is for: a bank question is for thirty other
  children, and this is the child's own paper coming back to them.
- **A paper expires** after `MB_PAPER_DAYS` (365) and only the account that made it, or the admin,
  can open it. There is no backend, so nothing sweeps an expired paper: the viewer refuses to render
  one, which is the honest half that can be done from a browser.
- **The rules this needs live in `polymathlc/math/firestore.rules` and `storage.rules`** — that is
  where the shared project's rules are kept, and **deploying them replaces the rules for the WHOLE
  project**, so read that file's own DEPLOY WARNING first. The `mail` rule had to be widened to let
  a signed-in user enqueue a message **to their own address and no other**; until it is deployed the
  writes are refused and the app degrades exactly as it is built to — the book cannot be written and
  says so, the email cannot be queued and says so.
- Run **`node tools/scan-tests.mjs`** after touching any of it.

## ⚙️ Two engines, and whichever one will answer (v1.12.0, key moved to the server in v1.13.0)
- **The way this app dies is not a bug in it.** Every card on every page came back
  `AI: Error … [429] Your billing account has exceeded its monthly spending cap` — the same
  answer to every call, on every device, until the month turns over. One engine is one thing
  standing between the centre and a dead app, so **Gemini is the engine and ChatGPT
  (`OPENAI_DEFAULT_MODEL`, `gpt-5.6-sol`) is the BACKUP**.
- **`window.askGemini` keeps its name and its shape, and that is the whole reason this was one
  change rather than seven.** It is the ONE door every call site already goes through — the scan
  run, the ask-alone call, the algebra rewrite, the report, the notes upload — so all of them
  gained the backup at once and not one of them had to be told. `aiAskWith(prompt, opts, order,
  run)` is the failover loop and `_aiRun` is the dispatcher; a second route past them is a call
  that still dies on the cap with nothing on screen saying why.
- **THERE ARE THREE ROUTES, NOT TWO, AND THE ORDER IS THE DESIGN** (v1.13.0): Gemini, then
  **ChatGPT on the SERVER**, then ChatGPT on a key pasted into this one browser.
- **THE KEY LIVES ON THE SERVER, and that is what makes the backup real.** v1.12.0 shipped it in
  `localStorage`, which rescued the teacher's laptop and no student's phone — the half of the
  school that matters. `askOpenAiServer` now calls the **`askOpenAi` Cloud Function** in
  `polymathlc/math/functions`, which holds the key as a Firebase secret (`OPENAI_API_KEY`) and
  enforces the sign-in, the model, the size caps and the daily quota. A browser never sees the key
  and cannot read it back. **It needs one deploy to work** — `firebase functions:secrets:set
  OPENAI_API_KEY` and then the functions deploy — and until then the call comes back
  `failed-precondition` and the How tab says so **in those words**, rather than reporting it as an
  AI error the teacher would go looking for in the wrong place.
- **THE KEY IS NEVER IN THIS FILE, and that is WHY the server holds it.** This is a public static
  site served to every student's browser, so a key committed here is a key handed to the whole
  school and spendable without limit by any of them — the harness fails on an `sk-`-shaped string
  anywhere in `index.html`.
- **A key in `localStorage` is the THIRD route, not the first.** It is what the other four portals
  already do, so a key pasted into any of them on this device is picked up here — and it is what
  keeps the backup working before the function is deployed, or if it ever stops answering. Its
  honest limit is the one device it was typed into, which is the limit the server route exists to
  remove. The field on the How tab says all of that rather than presenting itself as the fix.
- **`openai` is ALWAYS in the order.** Whether the function is deployed is not something a page can
  know without asking; asking wrongly costs one call, and the down-marking below then stops it
  being paid for again on every batch. `aiReady()` is therefore simply `true` — an app that asked
  "is Gemini up" would refuse every button on a capped project that can in fact answer.
- **`_aiWhy` keeps what each route last said.** "Nobody has deployed the function yet", "the key was
  rejected" and "the account is out of credit" are three different problems with three different
  fixes, and an app that reports all three as *AI error* sends the teacher to the wrong one.
- **`AI_ENGINE_STORE` is the SHARED slot table** — `sq_ai_engine` / `sq_openai_key` /
  `sq_openai_model` / `sq_openai_image_model`, the very names `polymathlc/cer`, `math`, `english`
  and `chinese` already use. All five apps are sibling folders on ONE GitHub Pages origin, so they
  share a `localStorage`: a key pasted into the Science portal on this device is **already**
  readable here, and one entered here switches the backup on in all five. Renaming a slot to
  something tidier signs this app out of a key it can plainly see, with nothing anywhere to say so.
- **THE FAILOVER GOES BOTH WAYS.** The preferred engine is tried first and the other answers when
  it refuses, so a ChatGPT key that has run out falls back to Gemini exactly as a capped Gemini
  falls back to ChatGPT. **A PREFERENCE IS NOT AN ENGINE**: `aiEngineOrder` lists only an engine
  that really exists, so choosing ChatGPT with no key saved leaves Gemini answering rather than an
  app that refuses every call.
- **A refusal is remembered for `AI_DOWN_MS` (10 min), and that is what makes it cheap.** A
  spending cap does not lift between one batch and the next, so a twelve-page paper would otherwise
  pay the same failed call four times over and fall back four times over. The engine goes to the
  **BACK** of the list and **never off it** — a cap is lifted eventually and a network does come
  back, and an app that refuses on a stale note is worse than one that spends a call finding out.
  A success clears the mark.
- **When both refuse, the FIRST error is the one thrown.** It names the real problem; the second is
  usually "no key saved on this device", which is a true sentence about the wrong thing.
- **`_openAiBody` is where the two engines are made to ask the same question**, and it carries the
  two things the Science portal's own `askOpenAI` does not need: a **system** prompt (every call
  here has one — it is where `aiGrounding` goes) and **images**, which are the entire scan. A body
  that quietly dropped the pages would come back fluent and about nothing at all. Three shapes are
  load-bearing and each is a 400 rather than a worse answer: no `temperature` to a `gpt-5` model,
  `max_completion_tokens` floored at 1024 and capped, and the word *JSON* somewhere in the messages
  whenever `response_format` is asked for. **`thinkingLevel` is deliberately NOT translated** — an
  argument a model does not know is a failed call, and the scan's `'high'` has no honest equivalent
  to guess at.
- **`aiReady()` is true when EITHER engine can answer**, or a capped project with a key saved would
  still show "AI is not available" on every button.
- **The page SAYS which route answered** (`renderEngineLine`, on the How tab), and it reports only
  what it KNOWS: the routes in the order they will be tried, and what each said the last time it
  refused. A "the backup is fine" that was never tested is the sentence this feature exists to stop
  anyone believing. The **line** is for everybody; the **key field** is the teacher's alone
  (`applyAiVisibility`, plus a second check inside `aiSaveKey` / `aiClearKey`, because hiding a
  field is not a lock), and it is hidden and never CLEARED — the same rule the vetting setting
  carries, since this runs once before sign-in resolves and again after it.
- **The callable rides the COMPAT app** (`firebase-functions-compat.js`), because that is the app
  holding the signed-in user; the modular app beside it carries App Check but no session, and the
  function refuses a caller it cannot name.
- **The module is deferred, so it repaints the line when it loads.** The classic script paints it
  before either engine exists, and would otherwise leave "No AI is available at all" on a page
  where there plainly is.
- **THE ENGINE CHOICE BELONGS TO THE CENTRE, not to a phone** (v1.14.0). `aiPreferredEngine` reads
  `_aiSharedEngine` — fetched from the `aiEngineConfig` callable in `polymathlc/math/functions` —
  and falls back to this device's own `aiEnginePref()` only until that answers. A device-local
  choice was the bug wearing a feature's clothes: the teacher switched to ChatGPT on their own
  phone, watched it work, and every student stayed on the capped Gemini. The toggle is the
  **admin's** and the function checks that again; a write that FAILED is reported, because a
  teacher told nothing would believe the whole centre had moved. (v1.14.0 read it through a
  CALLABLE; v1.15.0 moved it onto a document this app already reads — see the next bullet — and
  the callable stayed as the fallback.)
- **THE SETTING LIVES ON `config/admin`** (v1.15.0) — the Portal's own admin pointer, which this
  app ALREADY reads to learn whose teaching notes to apply and which only the admin can write. So
  it needs no rules change and no deploy, and it is the very SAME document the Science portal's
  toggle writes: one switch moves both apps. The write is a **MERGE**, always — a plain set would
  take `uid` off it and every student in the Science app would lose the bank. It is a **live
  listener**, so a phone with the app open follows the teacher within seconds, and it **comes down
  on every account change**, or one account's setting governs the next person to sign in. An unset
  field means Gemini, so a centre that never touches it is unaffected.
- **WHEN NOTHING ANSWERS, EVERY ROUTE IS NAMED** (`AI_ROUTE_LABEL`, the tail of `aiAskWith`). The
  first error is kept as `cause`, but the message lists them all. Reporting one hides the rest: a
  card reading "Gemini: your billing account has exceeded its monthly spending cap" and nothing
  else sends the teacher to the Google console when the job is to deploy the ChatGPT function —
  which is exactly what happened.
- Run **`node tools/scan-tests.mjs`** after touching any of it.

### 🌙 Kimi — the THIRD supplier (v1.16.0)

`AI_ENGINES` / `_aiRoutesFor` / `kimiKey` / `kimiModel` / `kimiReady` /
`askKimiServer` / `askKimiDirect` / `window.kimiListModels` /
`window.aiSaveKimiKey` / `kimiModelHint` (search `KIMI (Moonshot AI)`), plus
the third option in **Which to try first**, the Kimi key box and the model box
with 🔄 **Load models** on the How tab.

Two engines is barely one. Gemini and ChatGPT are two accounts on two bills,
so the morning the Firebase project is capped **and** the OpenAI balance is at
zero is the morning every app in the family goes down together. Kimi is a
third company, a third account and a third cap.

- **An ENGINE is one or two ROUTES, and that is now the whole order.**
  `AI_ENGINES` names the three; `_aiRoutesFor` turns each into the routes it
  actually has — the server's key, and behind it a key pasted into this
  browser. The chosen engine goes first and **the other two stay behind it**.
  An engine name nobody recognises still yields every route rather than an
  empty list: a stale word in the centre-wide setting would otherwise take the
  AI off every device at once.
- **`window.askGemini` is still the ONE door**, and `_aiRun` still the one
  dispatcher. Every call site — the scan run, the ask, the algebra rewrite,
  the report, the notes upload — gained the third supplier without being told.
- **The card prints the order the CALLS take** (`st.order`, straight from
  `aiEngineOrder`). It used to assemble its own list and `reverse()` it when
  ChatGPT was preferred — right with two engines, silently wrong with three,
  and the symptom is a card confidently describing an order nothing follows.
- **THE MODEL IS A FIELD, NOT A CONSTANT.** Moonshot renames its flagship with
  every release (`kimi-k2-…`, `kimi-k3-…`), so an id frozen in this file is a
  404 on every call a few months from now — and a 404 on every call reads as
  *Kimi is broken* rather than *the id is a release out of date*. 🔄 **Load
  models** asks the account itself and `kimiModelHint` says it in words on the
  card. It is the one thing the server callable takes from the client, because
  a teacher cannot redeploy a Cloud Function to follow a rename; the function
  only accepts a Moonshot-shaped id.
- **An empty key box means "I did not change the key", never "delete it"** —
  that is what **Remove Kimi key** is for. `window.aiSaveKimiKey` takes
  `undefined` for leave-alone and `''` for remove, so an admin running on the
  server route can save a model id without wiping a key they never typed.
- **The server route** is `askKimi` in `polymathlc/math/functions`
  (`MOONSHOT_API_KEY`). Until it is deployed the card says the secret has not
  been set rather than *AI error* — a deploy and a bill are different jobs.
- The key is the teacher's alone and device-local, exactly as ChatGPT's is:
  this is a public static site served to every student's browser.

## 🔑 Signing in is a POPUP, and never a redirect (v1.19.1)

`signIn` / `_authWhy` / the one `auth.getRedirectResult()` (in `index.html`, search
`SIGNING IN IS A POPUP`).

Google sign-in stopped working, and it stopped in the quietest way there is: a hop to the
Google screen, a hop back, and a page still signed out with nothing on it to say why.

- **The redirect fallback was the bug.** This app is served from `polymathlc.github.io`
  and its `authDomain` is `mathgen--app.firebaseapp.com` — two different origins — so
  `signInWithRedirect` has to write the half-finished sign-in down on one and read it back
  on the other. Safari's tracking prevention and Chrome's storage partitioning both now
  refuse that, so what was written before the trip to Google is unreadable on the way back.
  When it says anything at all it says `auth/missing-initial-state`, which is a sentence
  nobody can act on.
- **THE FALLBACK FIRED EXACTLY WHERE IT FAILS.** It was reached on
  `auth/popup-blocked` — a phone — which is both the likeliest place for a popup to be
  blocked and the likeliest place for partitioned storage to break the redirect. So the
  one route offered to the device most likely to need it was the one route that could not
  work.
- **The other four portals had already worked this out.** `polymathlc/cer`, `math`,
  `english` and `chinese` all call `signInWithPopup` with an explicit
  `browserPopupRedirectResolver` and NONE of them falls back to a redirect; their comment
  names this failure in these very words. This app was the only one still doing it. The
  compat SDK's `signInWithPopup` already carries that resolver, so a popup is all this
  file needs.
- **A blocked popup is TOLD to the user**, because allowing pop-ups is a thing they can do.
  Sending them silently round a redirect that cannot work is not a fallback, it is the
  failure wearing a fallback's clothes.
- **`_authWhy` is the ONE place a Firebase code becomes something a person can act on**,
  and every message names the fix rather than the internal state. `auth/unauthorized-domain`
  is the other half of "I cannot log in" and the only one that is a CONSOLE setting rather
  than a browser one, so it names itself, the console page and the domain being refused —
  otherwise the teacher goes looking in the browser for an hour.
- **The old redirect is still collected once on load.** A device that went round it before
  this change can still come back carrying its error, and reading it turns "signed out for
  no reason" into a sentence. It costs nothing on a device that never did.
- **`prompt: 'select_account'`** — a device already signed into several Google accounts
  silently choosing the wrong one is its own kind of "I cannot log in".
- **This app is NOT an installable PWA** (no manifest, no service worker), so the one case
  that genuinely needs a redirect does not arise here. `polymathlc/anskey` keeps a redirect
  for exactly that case and only in standalone mode — do not "fix" it to match this.
- Run **`node tools/scan-tests.mjs`** after touching any of it.

## 👣 One step at a time, and 🏷 the subject said on the card (v1.28.0)
- **A worked answer printed in full is read from the bottom up.** The student finds the final
  number, writes it down and learns nothing — which makes a card that hands over the whole solution
  the exact opposite of teaching. So the SAME working is asked for a second time cut into `steps`
  (`SCAN_STEPS_RULE`), one line of working and one line saying why it is done, and the card hands
  them over one press of **Next step** at a time.
- **`_scanSteps` is the ONE door**, used by `_scanNewItem` and `_askNewItem` alike exactly as
  `_markFields` is for the marking fields. It drops an empty step, promotes a step that came back
  with only its reason (half a step is still something to walk through; a blank numbered row is
  not), and **caps the count in code** — `SCAN_STEPS_MAX` is in the prompt as well, but a model that
  returns forty steps for one sum would otherwise put forty presses between a student and their
  answer.
- **THE WHOLE WORKING IS IN THE MARKUP FROM THE MOMENT THE CARD IS DRAWN**, and the steps still to
  come simply are not displayed (`.stepRow.hid`). Nothing is fetched between presses so nothing can
  be lost between them; **🖨 Print reveals every one of them** without touching what is on screen,
  and 📋 Copy carries them all whatever the reader had got to.
- **`stepsShown` is the only thing the reveal moves**, and `_stepsShown` CLAMPS it on the way out —
  a card opened to five steps and then edited down to two must not claim to be showing five.
- **THE ANSWER IS THE LAST STEP.** On a question **nobody has answered yet** it waits behind the
  steps (`.ansHidden`), because an answer printed above the working is the only line that gets read.
  On a question the student **has** answered it is shown at once: they have committed to an answer,
  the verdict chip has already said how it went, and a teacher marking a script must not click
  through twenty cards to see what they are marking against.
- **`Why` waits with the steps on BOTH**, marked or blank. At full detail the explanation *is* the
  worked solution ending with the answer stated, so leaving it under an unstarted walk-through hands
  over in one paragraph exactly what the steps hand over one at a time, and the reveal is
  decoration. The mark, the correct answer and the feedback all stay on a marked card; only the
  solution waits. Print has it either way.
- **One press opens everything.** `Show all working` on the card, and **👣 Show all working** at the
  top of the answers for the whole paper — which **toggles**, because a teacher who has opened every
  card wants one press to put them all away. `↺ Start again` closes one card for a second go. A
  student who wants the answer can always have it; the point is that taking it is a choice rather
  than the default.
- **The reveal repaints through `renderAnswers`, the ONE painter.** A second one would drift the
  first time a card gained a chip. `stepNext` / `stepAll` / `stepReset` are inline handlers on
  rendered HTML, so a card that is no longer there is left alone rather than throwing.
- **"Answer only" turns it off.** The steps ARE the working, so a run asked for the answer alone has
  none to walk through — `SCAN_DETAIL_RULE.short` says so, and the Settings card says it out loud.
- **Algebra cannot hide in the steps.** `_itemUsesAlgebra` reads `_stepsText` too, the rewrite call
  is asked for the steps and given the old ones, and a rewritten walk-through is taken only when it
  is really free of algebra — otherwise the explanation is put right and the student is still walked
  through "let x be" line by line, in the one place they are reading it hardest.
- **An answer the teacher rewrites drops its steps.** They were written to arrive at an answer that
  is no longer on the card, so walking a student through them now ends one line short of the answer
  printed above them — a card contradicting itself. No walk-through is better than one to somewhere
  else, and the teacher's own working is in Why where they typed it. Same rule, same place, as the
  🔑 badge and the key note `_ansEditApply` already drops.
- **EVERY CARD SAYS WHAT SUBJECT THE QUESTION IS** (`.subjChip` — "Mathematics question"). It was
  already worked out per question and it already decided which standard the answer is held to,
  whether the no-algebra rule applies and which list 📥 offers — and the card never once said so, so
  a maths question off a mixed pile was answered as maths, marked as maths and filed as maths with
  nothing on screen calling it a maths question. It is drawn through `itemSubjectWhy`, the ONE door,
  and `from` is what lets the chip say whether this is what the question READS as or merely what the
  picker was set to. **Never add a second reading of the subject to draw it with.**
- **The mistake book files the question's OWN subject too** (`itemSubject(it)`, not `wsMeta.subject`
  straight). It was filing every question under the picker, so a maths question off a mixed pile
  came back in the book chipped as Science and printed on a worksheet titled Science.
  `itemSubject` falls back to the picker itself, so a paper that is all one subject is filed exactly
  as before.
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
- After touching **the sign-in** (`signIn`, `_authWhy`, `auth.getRedirectResult`), run
  **`node tools/scan-tests.mjs`**. A student who cannot get past the sign-in screen has no
  app at all, and this failed silently: the redirect went to Google, came back, and left
  the page signed out with nothing said. Re-adding `signInWithRedirect` as a "fallback"
  restores exactly that, on the phones most likely to hit it — which is why the harness
  pins its absence rather than merely pinning that a popup is used.
- After touching **the crop** (`_mbBoxOk`, `_mbInkLevel`, `_mbLumaHist`, `_mbInkProfile`,
  `_mbClearEdge`, `_mbRuleGroups`, `_mbTrimTextRows`, `_mbTightenRect`, `_mbCropBox`,
  `_mbUnionBox`, `_mbCleanBlocks`'s options arm, `MB_BUILD_SYS`), run
  **`node tools/scan-tests.mjs`**. Both directions fail silently and the worksheet prints
  either way: too timid and every figure still carries the sentence above it, with nothing
  on any screen to say the trimmer ran and did nothing; too eager and it is worse than the
  bug it fixes — a table comes back with its top row gone, a graph loses its axis labels, a
  caption is cut off the picture it names, and all three look like a perfectly successful
  crop. The threshold is the silent one of all: a fixed ink level is right on a screenshot
  and reads a whole PHOTOGRAPH as ink, so the pass finds one band and stands down on every
  page this app will ever see. And `role: 'options'` is one word shared with a repository
  this one cannot see — rename it and the picture still prints, with four empty brackets
  back underneath it.
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

## 👥 Scanning a paper FOR a student at the centre (v1.27.0)

`STU_COL` / `_asStudent` / **`scanForUid`** / `scanForName` / `stuAllowed` /
`stuLoad` / `stuOpen` / `stuRowHtml` / `stuAdd` / `stuStart` / `stuStop` /
`stuSyncBar` (search `SCANNING FOR A STUDENT AT THE CENTRE`), plus the 👥
button in the header, `#stuModal` and the `#stuBar` banner on the Snap tab.

A student comes in with a paper and the teacher scans it on the centre's own
device. Every question they got wrong should land in **that student's** mistake
book — not in the teacher's, where it is of no use to anybody and where thirty
children's mistakes pile into one heap.

- **THE ROSTER IS THE ONE THE CENTRE ALREADY HAS.** `studentProfiles` is the
  Ans Key annotator's own collection, admin-readable and admin-writable. A
  second roster here would be a second list to keep in step, and the first
  thing anybody would notice is a student who exists in one app and not the
  other.
- **NO FIRESTORE RULES CHANGE WAS NEEDED**, and that is not luck — it is what
  made this worth doing. `users/{uid}/scanMistakes` is already
  `isOwner(uid) || isAdmin()` and `scan-mistakes/{uid}/…` in Storage already
  lets `request.auth.token.admin` write. The rules live in `polymathlc/math`
  and are shared with the whole project, so a deploy from there is a manual
  assembly job with everything's access as the blast radius: **a feature that
  needs one is a feature that waits.** The harness pins that no new collection
  was invented — one would fail closed, silently.
- **IT IS NOT AN IMPERSONATION, and that is the whole safety story.**
  `scanForUid()` is the ONE door and it changes exactly THREE things: which
  book is read, which book is written, and which Storage folder the crops go
  to. Everything else stays the signed-in teacher's, by name — the **teaching
  notes** (a global "pretend to be this student" would write the teacher's own
  notebook into a child's account, or ground the marking on nothing), the
  **vetting lists**, the **✎ Edit → teach-a-rule** door, and
  **`scanPapers.owner`**, which the rules pin to `request.auth.uid` at create.
- **The worksheet stays the teacher's copy**, therefore — theirs to print and
  hand over. The student's own copy is one they make from their own book on
  their own device, which is what the book was built for.
- **A MANAGED STUDENT IS A REAL CASE, not a workaround.** A child who has never
  signed in has no Firebase account and cannot be given one from here, so they
  get a `managed_…` profile — the same id shape the Ans Key annotator makes, so
  one student is one row in both apps. Their book is the CENTRE's record of
  them. **The panel says which of the two each row is**, because a teacher who
  thinks a child is getting their mistakes on their own phone and is wrong will
  find out weeks later.
- **Only the teacher, checked in the HANDLERS** — `stuOpen`, `stuStart` and
  `stuAdd` each ask `stuAllowed()` again. This writes into another account's
  subtree; hiding a button is never the lock. And an account change **drops**
  it (`renderAuth`), or a device signed out and back in as somebody else goes
  on filing papers into a child's book.
- **THE BANNER IS THE SAFETY.** Filing a paper under the wrong child is the one
  thing this can get wrong and it is silent, so who the run is for is on screen
  the whole time rather than tucked into a menu — and the 📕 button and the
  💬 Ask Mr Chung message both name them too.
- **`.then(stuRender)` PRINTED THE WHOLE ROSTER AS `[object Object]`** (v1.27.1).
  A promise hands its resolved value to the first parameter, and `stuRender`'s
  first parameter is the error MESSAGE — so forty students were stringified
  into the error paragraph and not one row was drawn. It is called with
  nothing (`.then(function () { stuRender(); })`), **and the parameter now
  refuses anything that is not a string**: an error message is text, and
  something else arriving there is a caller mistake rather than a thing to
  print at the teacher. Both halves, because either alone leaves the trap set.
- **The header wears the centre's own logo**, the same picture the four portals
  use, with the same inline-SVG fallback — a broken-image icon in the header of
  every page is worse than the emoji it replaced, and this app is opened on
  school connections. It is the favicon and the home-screen icon too; there was
  none of either before. **`.brandMark` carries no background, radius or
  clipping** (v1.27.2): the accent-coloured rounded square was there for the
  EMOJI, which needs something to sit on, and a tile behind a logo is a second
  badge around a badge — with no background the radius and the overflow only
  crop the corners off a logo that is not square.
- **Switching REREADS the book** (`mbForget()` then `mbLoad(true)`, on both
  start and stop): a badge left from the last child is a count of somebody
  else's mistakes sitting under this one's name. And it is **refused mid-run**,
  or half a paper is filed in one book and half in another.
- **The student's level and subject are used while scanning for them**, and the
  teacher's own are put back on ↩. They are what the answers are pitched at AND
  what the teaching notes are matched against, so a P3 paper must not be
  answered to whatever the picker was left on.

## 📄 A PDF is a pile of pages, and 🔑 its own answer key (v1.26.0)

`PDFJS_URL` / `pdfIsPdf` / `pdfjsReady` / `pdfPageScale` / `_pdfPageToFile` /
`pdfToFiles` / `_filesToPages` / `_pdfBusy` (search `A PDF IS A PILE OF
PAGES`), and `SCAN_KEY_*` / `_keyRow` / `keyNumKey` / `_keyFold` / `_keyBlock`
/ `_keySourceOf` / `_scanKeyPass` / `SCAN_KEY_SYS` / `_keyPrompt` (search
`THE PAPER'S OWN ANSWER KEY`).

A parent asked for this in as many words: let the child upload the PDF he did
his working on, and have the app **mark it against the answer key printed in
that same PDF**.

### The PDF is SPLIT, never sent whole

- **Every page is rendered to a picture and handed to `addShots` — the ONE
  queue.** From that moment a PDF page is a photographed page: the same
  batching, the same continuation stitching across a page break, the same
  marking, report and mistake book. Do not give a PDF its own pipeline.
- **It is not sent as one attachment.** Gemini will take a PDF, and that is
  exactly how a page gets skipped: a twenty-page document arrives as one blur
  and the model answers the questions it noticed. `SCAN_BATCH` pages a call is
  what makes the read exhaustive, and it can only work on PAGES. A whole PDF
  would also lock **Kimi** out entirely, which refuses one by name.
- **Every page is accounted for.** A page that will not render is pushed as a
  **failed card in its own place**, never skipped and never swept to the front
  — a page that vanishes reads as one that was read and had nothing on it, and
  one shown out of order sends a teacher looking for the wrong page. A document longer than there is room for says
  how many were left out; a PDF that would not open says why.
- **The page is painted WHITE before it is drawn.** A PDF page is transparent
  where nothing is drawn and a transparent canvas flattens to **black** in a
  JPEG — the whole page, ink and all.
- **pdf.js DETACHES the buffer it is handed** (`buf.slice(0)`), and it is
  loaded **only when a PDF is really chosen**: this app opens on a camera on a
  phone, and half a megabyte of library on every load for a feature most runs
  never touch is the wrong trade. A failed load is not remembered for ever.
- **`pdfPageScale`** takes the long side to `SCAN_PHOTO_MAX_SIDE`. A PDF page
  is measured at 72dpi, so an A4 at scale 1 is 595px across and "$140.20" and
  "$14.20" are the same handful of pixels.
- **`_pdfBusy` holds the buttons exactly as a run does.** A second pile queued
  on top of one still being rendered is pages in the wrong order, and the
  order IS the page numbers every answer cites.

### 🔑 The answer key

- **The inline case needs nothing** — a key printed beside its question is in
  the same batch as the question.
- **THE KEY AT THE BACK IS A PROBLEM OF BATCHING, not of prompting.** The call
  marking pages 1–3 has never seen the marking scheme on page 11 and never
  will: those pages are not in the request. So the key is read FIRST, in its
  own pass over every page, and the rows are handed to every batch as TEXT.
- **It only runs where a key could be somewhere the batch cannot see**
  (`SCAN_KEY_MIN_PAGES`). One or two photographed pages cannot hide a marking
  scheme, and a second pass on the commonest case buys nothing.
- **The ration is per run and spent BEFORE the call**, refilled once in
  `runScan` and nowhere else — the same shape as the algebra rewrite and the
  marking repair.
- **It TRANSCRIBES, and is deliberately the one call that is NOT grounded.** A
  transcriber told what the answer should say writes that down instead of what
  is on the page. It is also told never to solve, never to invent a row, and
  that a child's handwriting is not a key.
- **THE KEY IS THE AUTHORITY ON WHAT THE ANSWER IS, NOT ON HOW IT MUST BE
  WORDED.** A key says "24 g" and a child who wrote "24 grams" is right; a key
  says "it evaporates" and "it turns into water vapour" is right. What decides
  that is the teacher's own **marking standards**, which reach the prompt
  through `aiGrounding('scan')` like everything else. Lose that clause and the
  app marks on characters, which is worse than not marking at all.
- **A disagreement is SAID, never resolved in silence.** The key stands — it
  is the paper speaking — but a printed key can hold a misprint, so `keyNote`
  carries one plain sentence and the card prints it. On the card, not only in
  a tooltip: a phone has no hover.
- **`_keySourceOf` is the ONE place 🔑 is decided**, and it needs both halves:
  the model said "key" AND a key was really in play. A badge that is on every
  card says nothing, and the badge's whole value is that a teacher can trust
  it — this mark came off the paper, not out of a model.
- **`keyNumKey` collapses `Q12 (b)`, `12b` and `12(B)`** — a paper and its
  marking scheme almost never number a question the same way twice. It is the
  Learning Portal's `_epNumKey` under another name.
- **An answer-key page returns no questions, and SAYS SO** (`status: 'key'`).
  Rendered as "nothing on this page" it reads as a page that failed.
- **Rewriting the answer takes 🔑 off the card** (`_ansEditApply`). A teacher
  who has just retyped it owns it, and leaving the badge would claim the
  paper's key said something it did not.

## ✍️ What the student actually WROTE — the marking repair pass (v1.20.0)

`SCAN_MARK_FIX_CALLS` / `SCAN_MARK_FIX_MAX` / `SCAN_MARK_FIX_SYS` /
`_markFixPrompt` / `_applyMarkFix` / `_markFixBatchItems` / `_itemNeedsMarking`
/ `_markFixPass` (search `WHAT THE STUDENT ACTUALLY WROTE`), plus
`"hasWriting"` in `SCAN_SYS`, `SCAN_MARK_RULE` and `_markFields`.

- **EVERYTHING IN THIS APP HANGS OFF ONE FIELD.** `_markFields` sets
  `marked = !!studentAnswer`, and `marked` is what puts the verdict chip on the
  card, what `markTally` counts, what `reportScore` is computed from and what
  `mbFileRun` files in the mistake book. So a question the model answered
  **without transcribing what the student wrote** is not "missing its
  feedback": it was never marked, never reported and never kept — on a card
  that looks completely finished, because the answer and the working are both
  on it. **The two reported symptoms — "maths is not marked" and "wrong answers
  are not going into the mistake list" — are ONE bug**, and fixing the first
  fixes the second for free.
- **It showed up on MATHS first for a reason.** A science or English answer is
  written in pen on a ruled line and an MCQ is a bold tick; a maths answer is
  faint grey pencil working in the working space with a number on the answer
  line, rubbed out and written over, on a photograph. That is far easier to
  read straight past — so `SCAN_SUBJECT_RULE.math` now says where a maths
  answer physically IS, and that a page of sums with pencil on it has been
  attempted however faint.
- **ASKING IS NOT THE SAME AS READING, and separating the two is the trick.**
  The reading call is asked, per question, whether there is ANY handwriting on
  it (`hasWriting`) — a judgement about the PAPER, not about what it managed to
  transcribe. A question that says yes and still comes back with an empty
  `studentAnswer` is the model contradicting itself, and **that** is the
  trigger. Nothing else spends a call: **a blank worksheet sent up to be
  answered is the commonest use this app has and must stay a one-call read**,
  so a paper with no writing on it never reaches the repair at all. A missing
  `hasWriting` reads as "no writing", which is the side that spends nothing.
- **The second half of the trigger is the easy one to miss.** `_markFields`
  deliberately lets a transcribed answer through with **no verdict** ("half a
  mark is better than silently dropping the student's work"), and `mbIsWrong` /
  `mbIsRight` both want a verdict — so such a question is filed in the mistake
  book by **nothing at all**, exactly as an untranscribed one is.
  `_itemNeedsMarking` covers both.
- **IT MAY ONLY EVER ADD MARKING, and that is STRUCTURAL** rather than
  something the prompt asks for: `_applyMarkFix` writes the four marking fields
  and nothing else, so a repair that misread the paper can cost the marking and
  never the answer the student is reading. A blank still cannot be marked wrong
  — the repaired fields go through `_markFields` like every other route.
- **And only on the questions that NEEDED it** (`need`). The call is shown the
  whole batch, because the pages are attached anyway and the surrounding
  questions make the numbering read straight — but a question that came back
  properly marked the first time is left exactly as it was. A second opinion is
  not a better one, and a verdict that changes under the student for no reason
  they can see is worse than the one it replaced.
- **THE RATION IS PER RUN**, like the algebra rewrite's: `SCAN_MARK_FIX_CALLS`
  (2) in total, spent **BEFORE** the call so a failure cannot buy another try,
  refilled **once** in `runScan` and nowhere else. Left unbounded this is the
  loop that quietly spends a term's tokens on one stubborn paper.
- **It runs BEFORE `_algebraPass`**, so feedback the repair has just written is
  rewritten free of algebra too.
- **The pages it attaches are the batch's own** (`_markFixBatchItems`). An item
  from an earlier batch carried into the call would be marked against a page it
  is not printed on.
- Run **`node tools/scan-tests.mjs`** after touching any of it.

## 📗 The learning list, and 💬 Ask Mr Chung (v1.22.0)

`MB_LIST_MISTAKE` / `MB_LIST_LEARNING` / `mbListOf` / `mbIsLearning` / `mbInList`
/ `mbCardLearnClick` / `mbSetTab` (search `TWO LISTS, ONE MACHINE`), and
`ASK_WA_NUMBER` / `mbAskText` / `mbAskWaUrl` / `mbAskRoute` / `_askCleanPixels`
/ `_askClaimTab` / `_askGoTo` / `mbAskChung` (search `ASK MR CHUNG`).

### Two lists, one collection

- **EVERY question can be kept now, not just the ones that went wrong.**
  `mbCardChipHtml` used to `return ''` unless `mbIsWrong(it)`, so a question
  answered correctly and a question left blank had no button at all — the only
  way into the book was to get something wrong. Both now offer 📕 **and** 📗.
- **They are ONE collection with a `list` field, not two collections**, and
  that is not tidiness: `firestore.rules` lives in `polymathlc/math` and is
  shared with the whole family, so a new subcollection **fails closed** — reads
  empty, writes denied, nothing on screen saying why — until somebody does a
  whole-project rules deploy. A field on a document this app already writes
  needs none. An entry with **no** `list` reads as a mistake, which is every
  entry written before this shipped.
- **THE LEARNING LIST NEVER EMPTIES ITSELF, and that is the whole difference
  between the two.** A student put the question there knowing they could
  already do it, so clearing it on a right answer would delete the list the
  moment it started working. `mbNoteWin` returns early for a learning entry,
  `mbNoteMiss` does too, `mbFileRun` skips it entirely — and
  **`mbCardChipHtml`'s streak chip is gated on it as well**, or a learning
  entry answered correctly is told *"2 more and it clears"* about a list that
  never clears. That last one is the easy one to miss; the harness pins it.
- **The automatic filing still only ever writes to the MISTAKE book**
  (`mbSaveOne(it, MB_LIST_MISTAKE)`). Nothing reaches the learning list except
  a student pressing 📗.
- **Switching tab CLEARS the ticks** (`mbSetTab`), and `mbSelectedIds` is
  scoped to the tab on show. Those ids drive one worksheet and one Remove
  button, and a tick left behind on a row nobody can see is how the wrong
  question gets deleted — the vetting list's own rule.

### 💬 Ask Mr Chung

- **WHAT A WEB PAGE CAN AND CANNOT DO HERE decides the whole design.** A page
  **cannot** put a file into a WhatsApp message: `wa.me/<number>?text=` carries
  text and nothing else, and there is no API, URL or trick that attaches an
  image to it. What a page **can** do is `navigator.share({ files })`, which
  hands the picture and the message to the phone's own share sheet with the
  image really attached — at the price of picking WhatsApp out of the sheet
  and then picking Mr Chung out of a contact list. Those are the only two
  routes there are; do not "fix" this by reaching for an attachment parameter
  that does not exist.
- **THE BUTTON TAKES THE ONE THAT LANDS IN THE RIGHT CHAT** (v1.25.0). `wa.me`
  with his NUMBER opens Mr Chung's own conversation — no share sheet, nothing
  to hunt for, nothing to scroll, and it works even for a student who has
  never messaged him and does not have him saved. The picture goes as a
  **link** to the sheet in Storage, which is a Firebase download url and
  therefore opens for him whether or not he is signed in. **Getting to the
  right chat is the part a student gives up on**, so that is the part the
  button buys; the share sheet was the default until v1.25.0 and it is exactly
  what the complaint was about.
- **📎 is the other trade-off, kept and never made the default.** It is drawn
  only on a device that can really share a file — **`mbAskRoute` is the ONE
  place that is decided** — so it is never a button that does nothing.
  `mbAskChung(id, mode)` takes `'attach'` for it; anything else is direct.
- **THE TAB IS CLAIMED INSIDE THE CLICK** (`_askClaimTab` / `_askGoTo`). The
  sheet has to be drawn and uploaded before the link exists, and by then the
  user gesture has expired: a `window.open` after the `await` is a **blocked
  popup on iOS Safari**, which reads as a button that does nothing at all — on
  exactly the phones this is for. A claimed tab that ends up unused is closed
  rather than left blank, and a tab that could not be claimed still falls back
  to a plain `window.open`.
- **The message names WHO is asking.** A picture arriving from an unknown
  number with "could you help me" is a message the teacher cannot act on, so
  the student's name, level, subject and the question's number go in the text.
  Nothing else about them travels — not their marks, not the report, not the
  rest of the paper.
- **Nothing is sent in the background.** The button opens the share sheet or
  the chat; the student presses send. A share they cancelled (`AbortError`) is
  not reported as a failure.
- **CROP ONLY. DO NOT CLEAN** (v1.24.0). The crop goes as it came off the
  photograph and IN COLOUR. Cleaning a scanned page is not reliably an
  improvement, and it went wrong in the one way that matters: the clamp reads
  "near the paper's white" as paper, and **a student's own pencil working is
  near the paper's white**. A page at 205 with pencil at 175 had every stroke
  of that working snapped to pure white while the printed text, being far
  darker, came through untouched — so the picture that reached the teacher was
  the question with the child's work rubbed off it, which is the one thing he
  needed to see.
  - **`_askHasWorking` is the switch**, and it is already on the entry: a
    question that was MARKED is a question the student wrote on. With nothing
    written there is no clean at all (`_askClean(url, false)` hands the url
    straight back).
  - **When it does run it is a SHALLOW, COLOUR-PRESERVING lift.**
    `ASK_CLEAN_DEPTH` is 16, not 46 — a narrow band just under the paper's own
    white, so anything with any body to it is below the floor and is never
    touched. Pencil at 175 under paper at 205 is thirty units down: at the old
    depth it was inside the band and was erased, at this one it is ink.
  - **NOTHING TOUCHING A STROKE IS EVER WHITENED** (`nearInk`). Every stroke
    has an anti-aliased skirt a shade lighter than its core, and that skirt
    sits inside the band — whiten it and the working is not erased but THINNED,
    which on faint pencil is most of the way to erased. Ink is marked first and
    its neighbours are spared, so edges are protected **by construction**
    rather than by a threshold that happens to miss them.
  - **A SHADOW refuses the whole pass** (`ASK_CLEAN_BAND_MAX`). A gradient puts
    real paper on both sides of the floor — lifted where it is bright,
    untouched where it is dark — which comes out patchy, so the crop goes as it
    is. `ASK_CLEAN_BG_NOISE` is what keeps that from refusing every page:
    ordinary paper varies by a few luma units and that is not a shadow. In
    practice most photographs take this branch, which is exactly what "crop
    only" means.
  - **Colour survives** (`ASK_CLEAN_CHROMA`): a blue pen, a highlighter and a
    pale wash of water are all part of what is being asked about.
  - Still **all-or-nothing** and still no AI call, so the same picture always
    goes out the same way. Every refusal hands it back untouched, and so does a
    tainted canvas.

### 🖨 …and the picture is the question SET OUT AS A WORKSHEET (v1.23.0)

`ASK_SHEET_*` / `_askTier` / `_askPictureOptions` / `_askWrap` / `_askLayout` /
`_askDrawSheet` / `askSheetFor` (search `SET OUT AS A WORKSHEET`).

- **A crop off a photograph is the wrong thing to send a teacher on a phone**:
  grey paper, the student's own pencil still on it, skewed, 9pt print shrunk
  into a chat bubble. The app already holds something better — `blocks`, the
  rapid-add reproduction made when the question was filed — so what travels is
  that question TYPESET, laid out the way `cer/mistakes.html` lays its own
  "try again" worksheet out.
- **IT IS DRAWN ON A CANVAS, not rendered from HTML.** There is no library
  here, and the two library-free ways of turning markup into a picture both
  fail on exactly this input: `foreignObject` **taints** the canvas the moment
  a figure comes from Storage (and a tainted canvas cannot be read back, which
  is the whole point of drawing it), and a screenshot API does not exist in a
  page. Drawing is more code and it is predictable.
- **`_askTier` mirrors the viewer's `tierOf`, and they must stay in step** —
  `built` (wording typeset, figures in place, the word options printed
  underneath because the blocks deliberately leave them out, full working
  box), `whole` (the crop IS the question, so nothing is printed twice and it
  gets the SHORT box), `flat` (the transcription with its figure). A sheet
  that stops matching the sheet the student gets back on paper is a silent
  drift.
- **The `role: 'options'` contract is honoured here too** (`_askPictureOptions`):
  a picture that already carries the four choices must not have the word list
  printed under it, or the sheet shows four empty brackets.
- **Figures are fetched to a data url BEFORE they are drawn**, or the canvas is
  tainted and `toDataURL` throws.
- **Every failure falls back rather than stopping.** A figure that will not
  load is replaced by a one-line note — wording reading "the diagram below
  shows…" above blank paper cannot be told from a question that never had one.
  A sheet that cannot be drawn hands back `''` and the cleaned crop is sent, as
  it was before this existed. A sheet with **no wording, no picture and no
  options is refused outright**: a page that asks nothing is worse than sending
  the message alone.
- **A crop is never drawn larger than its own pixels**, and the whole sheet is
  capped at `ASK_SHEET_MAX_H` — it has to stay ONE picture.
- **On a device that cannot share files the LINK points at the sheet too**: it
  is uploaded and that url goes in the message, falling back to the crop
  already in Storage if the upload fails.
- There is no canvas in Node, so `tools/scan-tests.mjs` pins what DECIDES the
  sheet and **`node tools/ask-sheet-render.mjs`** draws it for real in a
  headless browser and writes each case out to look at. Run that one after
  touching the layout — it needs `npm i playwright-core`.
- Run **`node tools/scan-tests.mjs`** after touching any of it.

## House rules
- After touching **the learning list or Ask Mr Chung** (`MB_LIST_*`,
  `mbListOf`, `mbIsLearning`, `mbInList`, `mbSetTab`, `mbSelectedIds`,
  `mbCardChipHtml`, `mbCardLearnClick`, `mbNoteWin`/`mbNoteMiss`'s learning
  guards, `ASK_WA_NUMBER`, `mbAskText`, `mbAskWaUrl`, `mbAskRoute`,
  `_askClaimTab`, `_askGoTo`, `mbAskChung`'s `mode`,
  `_askCleanPixels`, `_askHasWorking`, `ASK_CLEAN_DEPTH`, `ASK_CLEAN_BAND_MAX`,
  `_askTier`, `_askPictureOptions`, `askSheetFor`), run
  `node tools/scan-tests.mjs` — and after touching the sheet's LAYOUT run
  `node tools/ask-sheet-render.mjs` and LOOK at what it writes, because a sheet
  that renders is not the same as one that reads. Every failure is silent.
  A learning entry that starts clearing itself deletes the list the moment it
  begins working — and the streak CHIP is the half that is easy to miss, since
  it promises a clearing that never comes. A tick that survives a tab switch
  deletes a question the student cannot see. A message that stops naming who is
  asking reaches the teacher as a picture from an unknown number. The button
  falling back to the share sheet by default still works perfectly and is still
  the thing nobody finishes — hunting for WhatsApp and then scrolling a contact
  list is the friction this was changed to remove. And a tab claimed after the
  `await` rather than inside the click is a blocked popup on iOS Safari, which
  is not an error anywhere: it is a button that does nothing. And the
  clean-up going from all-or-nothing to half-applied flattens a photograph of
  an experiment into a white plate while looking perfectly clean. And a band
  that goes deep again, or a `nearInk` guard that goes away, rubs the child's
  own pencil working off the picture and sends the teacher the question with
  the work removed — which is the one thing he was being asked to look at.
- After touching **the step-by-step reveal or the subject chip** (`SCAN_STEPS_RULE`,
  `SCAN_STEPS_MAX`, `_scanSteps`, `_stepsText`, `_stepsShown`, `stepsBoxHtml`, `stepNext`,
  `stepAll`, `stepReset`, `stepsAnyCard`, `stepsAllOpen`, `stepAllCards`, `renderStepAllBtn`,
  `hideWhy` / `hideAns` in `answerCardHtml`, the `.subjChip`, `mbSaveOne`'s `subject`), run
  `node tools/scan-tests.mjs`. Every failure here is silent and the card looks finished either way:
  a reveal that shows every step at once has handed the whole solution to a student who pressed
  Next once, one that shows none of them on PAPER prints a worksheet with no working on it, and a
  `Why` left open under an unstarted walk-through gives the same solution away in one paragraph
  while the steps below it sit there looking like a feature. Steps kept on an answer the teacher has
  just rewritten walk a student to an answer that is no longer on the card, and algebra rewritten
  out of the explanation and left in the steps is algebra in the one place it is read line by line.
  A subject chip drawn from a second reading of the subject is a card that says Science on a
  question this app answered, marked and filed as maths.
- After touching **scanning for a student** (`STU_COL`, `scanForUid`,
  `scanForName`, `stuAllowed`, `stuLoad`, `stuStart`, `stuStop`, `stuAdd`,
  `stuRowHtml`, `stuSyncBar`, `_mbCol`, `_mbUpload`'s folder, or `renderAuth`'s
  drop), run `node tools/scan-tests.mjs`. This writes into ANOTHER ACCOUNT'S
  subtree, so every failure is somebody else's data: the one door widened past
  the book puts the teacher's own notebook, vetting lists or worksheet into a
  child's account; `stuAllowed` relaxed lets any signed-in student file papers
  under any other; a student that survives an account change goes on filing
  into a child's book after the device has been signed out and back in; and a
  switch allowed mid-run files half a paper in one book and half in another.
  None of it throws and none of it looks wrong on the screen — which is why the
  banner is pinned too: it is the only thing on screen that says who the run is
  for. And the harness checks that no NEW collection was invented, because the
  rules live in `polymathlc/math` and a name they do not know fails closed.
- After touching **the PDF split or the answer key** (`pdfIsPdf`,
  `pdfjsReady`, `pdfPageScale`, `_pdfPageToFile`, `pdfToFiles`,
  `_filesToPages`, `_pdfBusy`, `SCAN_KEY_*`, `_keyRow`, `keyNumKey`,
  `_keyFold`, `_keyBlock`, `_keySourceOf`, `_scanKeyPass`, `_keyPrompt`,
  `SCAN_KEY_SYS`, or `_ansEditApply`'s 🔑 clear), run
  `node tools/scan-tests.mjs`. Every failure is silent and the run still
  finishes — it simply finishes SHORT, and a run that came back with 18
  questions when the paper had 25 looks exactly like one that worked. A page
  dropped instead of shown as failed is a question nobody knows was missed. A
  page rendered at its own 72dpi is a page of guesses. A transparent page not
  painted white flattens to solid black in the JPEG. Sending the PDF whole
  puts a twenty-page blur in front of the model and locks Kimi out entirely.
  On the key side: a badge that stops needing a real key is on every card and
  worth nothing; a key that is allowed to be matched CHARACTER FOR CHARACTER
  marks "24 grams" wrong against "24 g"; a disagreement resolved in silence
  hides a misprint from the one person who could spot it; and a ration spent
  after the call rather than before it lets one stubborn paper buy call after
  call.
- After touching **the marking repair pass** (`SCAN_MARK_FIX_*`,
  `_markFixPass`, `_applyMarkFix`, `_itemNeedsMarking`, `_markFixBatchItems`,
  `_markFixPrompt`, `hasWriting` in `SCAN_SYS` / `SCAN_MARK_RULE` /
  `_markFields`), run `node tools/scan-tests.mjs`. Both directions are silent
  and the app carries on looking finished either way. Too timid and the
  marking simply never happens — which is not a card missing its feedback, it
  is a question that is never marked, never in the report and never in the
  mistake book, because all three read `marked`. Too eager and a second vision
  call is paid for on every blank worksheet sent up to be answered, which is
  the commonest use this app has. And a repair that is allowed to overwrite a
  verdict that already worked changes a mark under the student for no reason
  they can see.
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
  `itemTarget`, `_vetGroupBySubject`,
  `REPORT_SYS`, `REPORT_CREDIT`, `_reportMarkStr`, `reportScore`, `reportEligible`,
  `_reportPrompt`, `_reportNew`, `_reportRefs`, `reportAsText`, `runReport`,
  `AI_ENGINE_STORE`, `OPENAI_DEFAULT_MODEL`, `AI_DOWN_MS`, `openAiKey`, `openAiModel`,
  `openAiReady`, `aiEnginePref`, `aiEngineOrder`, `aiEngineIsDown`, `_openAiBody`, `_openAiText`,
  `askOpenAI`, `askOpenAiServer`, `_aiWhy`, `aiAskWith`, `_aiRun`, `renderEngineLine`,
  `applyAiVisibility`, `aiSaveKey`, `aiClearKey`, `aiSetPrefer`,
  `AI_ENGINES`, `_aiRoutesFor`, `kimiKey`, `kimiModel`, `kimiReady`, `askKimiServer`,
  `askKimiDirect`, `window.kimiListModels`, `window.aiSaveKimiKey`, `kimiModelHint`,
  `kimiSave`, `kimiClear`, `kimiLoadModels`,
  `camAvailable`, `camOpen`, `camClose`, `camSnap`, `camCancel`, `camRenderStrip`,
  `MB_COL`, `MB_PAPER_COL`, `MB_IMG_PATH`, `SCAN_BOX_RULE`, `_mbBoxOk`, `_mbCropBox`, `_mbCropFor`,
  `MB_QCROP_MAX_SIDE`, `MB_BUILD_MAX`, `MB_BUILD_SYS`, `_mbCleanBlocks`, `_mbBuildShots`,
  `_mbBuildBlocks`, `_mbBuildFigures`, `_mbBuildFor`,
  `_mbShotForPage`, `mbIsWrong`, `mbIsRight`, `mbKeyOf`, `mbFindByKey`, `MB_CLEAR_WINS`,
  `MB_KEY_PREFIX`, `mbNoteWin`, `mbNoteMiss`, `_mbRunNews`, `mbRunToast`, `mbCardChipHtml`,
  `mbSaveOne`, `mbFileRun`, `_mbPaperDoc`,
  `_mbMailDoc`, `_mbPaperUrl`, `MB_VIEWER_PATH`),
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
  The report is in there because every number on it is counted in code from the cards beside it: a
  score worked out the wrong way is a wrong number on a page a parent reads, with the chips directly
  above it saying something else and nothing to say which is lying — and a blank folded into the
  denominator marks a child down for the questions they never reached.
  The camera is in there because every one of its failures is a page that is simply not in the run:
  a shutter that does nothing on a browser without `getUserMedia`, a frame that never reached the
  one queue, or a camera left running after the overlay closed. And the mistake book is in there
  because it is the only thing this app keeps, and the way it goes wrong is the way the whole family
  has gone wrong before: `users/{uid}/mistakes` is the SCIENCE app's own log under this same uid, so
  a book named `mistakes` here merges two apps' data with nothing throwing on either screen. A box
  that is not really round a question keeps somebody else's question and looks like a working crop,
  a `shot` flag that goes missing prints the question twice or prints a diagram with nothing asking
  anything, and the whole-page test applied to a question box throws away every big open-ended
  question there is. The REPRODUCTION is in there for the same reason from the other end: a rebuild
  that stops swallowing its failures costs the mistake the app was filing, a budget that is spent
  after the call rather than before it lets one stubborn paper buy call after call, a build kept
  with no wording in it is a question made of pictures asking nothing, and blocks accepted without
  the shared stem hand a child a lettered part torn away from the question it depends on —
  and an email announced as sent by a queue that refused the write is a worksheet nobody ever
  receives. The clearing is the other half of that: a streak that stops resetting turns "twice in a
  row" into "twice ever" and empties the book of questions the child still cannot do, and a matcher
  that guesses between two similar questions deletes the wrong one — both on a screen that looks
  exactly like the feature working.
- After touching **the engines** (`AI_ENGINE_STORE`, `OPENAI_DEFAULT_MODEL`, `aiEngineOrder`,
  `aiAskWith`, `_aiRun`, `_openAiBody`, `_openAiText`, `askOpenAI`, `askOpenAiServer`, `_aiWhy`,
  `AI_DOWN_MS`, `window.aiReady`, `window.askGemini`) — **or the `askOpenAi` function in
  `polymathlc/math/functions`, which is the other half of it** — run
  **`node tools/scan-tests.mjs`**. Every failure here is silent and the
  app looks exactly as it did the morning the spending cap was hit. A slot name that drifts from
  the other four portals signs this app out of a key it can plainly see and reports it as "no
  backup on this device". A preference with no key behind it refuses every call. A "down" note
  that never clears makes the backup permanent, and one that takes an engine OFF the list instead
  of to the back leaves the app dead once the cap has been lifted. The second error reported
  instead of the first tells the teacher "no ChatGPT key is saved" about a paper that actually hit
  a billing cap. And a body that drops the images, or sends a `temperature` to a gpt-5 model, is a
  400 — not a worse answer, no answer at all. And the `openai` route dropping out of the order is
  the whole feature quietly reverting to v1.12.0: the teacher's laptop keeps working, so nothing
  looks wrong, and every student is back on a capped project with no backup at all.
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
