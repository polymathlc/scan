# CLAUDE.md

Guidance for Claude when working in this repo.

## App
- `index.html` — **"Scan & Answer"**. Markup + CSS + JS on the shared `mathgen--app` Firebase
  project with Google sign-in. Photograph a worksheet or an exam paper — or pick pictures out of
  the gallery — and **every question printed on them is read: what the student has already written
  is MARKED, what is still blank is ANSWERED**. Four subjects: Science, Mathematics, English,
  Chinese. **A typed or dictated question is the other way in**: with pages it governs the run,
  with no pages it *is* the run. Nothing is saved anywhere: a photographed paper is somebody's
  work, so it lives in the tab and leaves through Copy or Print — **except on the admin's own press
  of 📥 Send to vetting**, which files one question (never the student's answer to it) in another
  Polymath app's vetting list. See that section below.
- `sidekick-art.js` — the Science Sidekick drawings, the Portal's own sheet (`science-coach-art.js`
  in `polymathlc/cer`), so a Scan card and a Portal card wear the same figure. Loaded beside
  `index.html`; do not CDN it, do not rewrite an id into SVG markup.
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
  paper. `'scan'` is the exception on purpose: it is writing the answer anyway. (The marking
  standard here is the NOTES' typed one; the style profile's inferred `markingStandards` reaches
  no kind since v1.9.0 — see 🧠 below.)
- **The authority order is stated in the digest and never changes**: what the paper itself prints
  wins, then the teacher's general guidance, then the notes and the style, and ordinary syllabus
  knowledge only where they say nothing.
- **`guidance` is the hand-typed note and it is the ONLY field that reaches every `kind`.** It goes
  in verbatim through `guidanceBlock()`, ahead of `notesBlock`/`styleBlock`. Nothing is sent to the
  AI when one is saved: it is a note with empty `levels` and empty
  `keywords`/`keyFacts`/`markingStandards`, written straight to Firestore. `subjects` is empty too
  unless the admin picked one in the ✍️ modal — **the picker defaults to "Every subject", so
  leaving it alone keeps what a typed note has always meant.**
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

## 🧠 The teacher's corrections reach this app (v1.9.0)

`cerStyle` / `cerStyleDocRef` / `styleBucketKey` / `styleProfilePick` / `_styleCountIn` /
`_styleTokens` / `_styleOverlap` / `_styleTier` / `_styleRetrieve` / `styleExemplarsFor` /
`styleEditsAll` / `styleCorrections` / `styleEditRules` / `styleLessons` / `styleRecentEdits` /
`_styleProfileBits` / `styleCorpusCount` / **`styleBlock(kind, q)`** / `aiGrounding(kind, opts)`,
the fair-share pots `notesTrimTo` / `notesDedupe` / `notesFairShare` / `notesJoinField` /
`notesLedger*` (search `THE WHOLE LOOP IS READ` and `Every note gets a GUARANTEED share`), and the
🧠 panel in `notesStyleHtml`. **`polymathlc/tutor` carries the same block byte for byte, and both
are a port of `polymathlc/anskey` — ship a change to all three together.**

Until this the app read ONE field of the style document — the flat `profile` mirror — and six
frozen exemplars, and nothing else. So a P3 Maths profile was averaged into every Sec 1 Science
answer, a correction the teacher made in Ans Key on Monday reached Ans Key and NO other app, and
the Science portal's corrections reached nothing here at all. Every one of those was silent: the
answers still came back, they simply went on making the mistake the teacher had already corrected.

- **DOCUMENT A IS READ WHOLE, AND DOCUMENT C BESIDE IT.** A is Ans Key's
  `users/{adminUid}/aiTraining/answerStyle` — the corpus (`samples`), the corrections (`edits`,
  each with the lesson it taught), one profile per level×subject bucket (`profiles`) and the flat
  mirror. C is the Science portal's `users/{adminUid}/settings/answerStyle`, which holds only that
  app's corrections. A second `onSnapshot` sits beside the first in `loadTeachingNotes`, comes
  down in `_notesDetach` / `stopTeachingNotes` on every account change, and a denied read is a
  `console.warn` and nothing more — the block carries fewer corrections, exactly as it did
  before the listener existed.
- **`styleProfilePick(lvl, sub)` IS THE ONE PLACE THE BUCKET IS CHOSEN**, and the chain is the
  family's: `lvl:sub` when that bucket has `STYLE_BUCKET_MIN` (30) answers behind it, then
  `any:sub`, then `_global` (or the flat `profile`). The count is taken off `samples` when the
  corpus travelled, and off the bucket profile's own `n` when it did not. The level and subject
  are the How-tab pickers — the same `wsMeta` `noteAppliesHere` already reads — so another
  worksheet is never served a bucket that is not its own, and an untagged run is the global one.
- **THE EXEMPLARS AND THE RAW CORRECTIONS ARE RETRIEVED FOR THE QUESTION** (`opts.q`, token
  Jaccard over `q`), tier by tier — this bucket, then the same subject at any level, then
  everything — so a strong Maths match never displaces a weaker one from this worksheet's own
  bucket. Omitting `q` is the old behaviour byte for byte: the profile's own six and the NEWEST
  corrections. Both `'scan'` call sites pass the typed ask when there is one — the pages are
  pictures, so it is the only text about the run the retrieval can see.
- **`styleEditsAll()` IS THE UNION**: A's edits (src defaults `'anskey'`) and C's (keyed
  `'cer:' + slot`, src `'cer'`), sorted by time so "the newest" is the newest whichever document
  holds it. They reach a prompt three ways — the profile's distilled `fixes` (up to 6), the
  lessons (up to 8, deduped by exact lowercase text, this bucket first and newest first inside
  each tier) and up to 3 raw before/after pairs, which go LAST, nearest the question.
- **NO EARLY RETURN ON A NULL PROFILE.** The exemplars, the lessons and the pairs come out of the
  corpus and are current the moment the teacher saves; only the distilled description waits for a
  rebuild. `if (!p) return ''` is what made a teacher's very first correction reach nothing.
- **WHAT EACH KIND GETS.** `'mark'` gets the profile's `styleRules`, `phrasing` and `keywords`
  and nothing else — never an exemplar, a fix, a lesson or a pair, because every one of those is
  an ANSWER and a marker handed the answer stops marking against the paper. `'scan'` writes the
  answers too, so it gets everything `'answer'` gets. **NO KIND GETS THE PROFILE'S
  `markingStandards` ANY MORE, `'scan'` included.** That field is INFERRED by a model from the
  teacher's own answers, and an inference must never decide a mark: the standard a student is
  held to is the typed notes and the guidance (`notesBlock`'s `markingStandards` still reaches
  marking exactly as it did). The 🧠 panel shows it as *Inferred standard* and says so.
- **THE HEADING SAYS WHICH BUCKET AND HOW MANY CORRECTIONS** — *learned from 30 of their own P5
  Science answers, following 4 corrections* — and `groundingSummary()` says *the teacher's
  learned style (P5 Science)* and *N corrections*, because an answer grounded on the global
  fallback looks exactly like one grounded on this worksheet's own bucket.
- **THE NOTE BUDGETS ARE POTS, NEVER A LENGTH TO CUT TO.** `notesJoinField` used to be a
  `.slice()` over the JOINED text of every relevant note, so with two standing instructions of
  1,600 characters the first lost most of itself and the second reached no prompt at all.
  `notesFairShare` water-fills: every note takes its floor (`NOTES_GUIDE_MIN_EACH` /
  `NOTES_FIELD_MIN_EACH`), the remainder is handed round, a short note is never trimmed, a long
  one is trimmed on a word and SAYS so (`NOTES_TRIM_MARK`), the pot grows to `n × minEach` when
  it cannot floor everybody, and `NOTES_HARD_CHARS` is the only path on which a note is lost.
  The same rule typed in two apps is ONE rule (`notesDedupe`). The per-app caps stayed as the
  pots. `notesLedger` records what was trimmed or dropped on every `aiGrounding` call.
- **This app still WRITES nothing to either document.** Nothing photographed here is an answer
  the teacher wrote.
- Run **`node tools/scan-tests.mjs`** after touching any of it.

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

## 🐾 The mistake TYPE on a marked answer (v1.7.0 → v1.8.0)

`MISTAKE_ANIMALS` / `MISTAKE_ANIMAL_ALIASES` / `mistakeAnimal` / `mistakeAnimalNormalize` /
`mistakeAnimalLabel` / `mistakeAnimalPromptList` / `MISTAKE_ANIMAL_RULE` / `SCAN_MISTAKE_RULE` /
**`_mistakeField`** / `mistakeTally` / `mistakeBoxHtml` (search `THE MISTAKE ANIMALS`), the
`mistake` field on every answer item, and the `.mkBox` / `.tally.mMistake` CSS.

Marking says WHETHER an answer is wrong; this says HOW, in the one word a student can carry to the
next question. Every wrong or partly-right answer is one of **nine Science Sidekicks' skills,
missing** — Comparison Casey, Context Connie, Specific Sherry, Evidence Ellen, Keyword Kai,
Concept Cora, Reasoning Ravi, Careful Cleo, Complete Cody.

- **THE LIST IS SHARED, BYTE FOR BYTE, WITH `polymathlc/cer` AND `polymathlc/anskey`.** The Portal
  files students' own answers under these ids and quizzes the class on them; Ans Key writes a
  deliberate mistake of one of them into a text box. The `id` is what travels and what is stored —
  rename one here and every entry the other apps hold under it reads as "an unknown mistake" with
  nothing anywhere to say so. **Ship a change to the block to all three together.**
- **The old ten-animal ids still normalise.** `MISTAKE_ANIMAL_ALIASES` carries `rabbit` →
  `careful`, `sloth` → `complete`, `peacock` → `specific` and the rest, so a model's leftover word
  still files as the habit it always meant. Never written, never offered.
- **It rides the SAME call that marks the paper** — `SCAN_MISTAKE_RULE` is appended to both prompts
  (`_scanPrompt` and `_askPrompt`) and the field is in both reply shapes. No second pass, no extra
  cost, and no way for the type and the verdict to come from two different readings.
- **`_mistakeField` is the ONE door, inside `_markFields`**, so the rule holds on both paths without
  being written twice: a type is kept ONLY on a `wrong` or `partial` verdict. A correct answer has
  no mistake to name and a blank was not attempted — whatever the model says, both file `null`. A
  cross on a question nobody attempted is the one mistake marking must never make, and a mistake
  TYPE on one is the same cross wearing a label.
- **`mistakeAnimalNormalize` is how a model's word becomes an id, and '' IS an answer.** It takes
  the id, the Sidekick's name, the habit's name or an old id in any case; "unsure", "none", nothing
  and an invented tenth Sidekick all come back '' and file nothing. Forcing a mistake into the
  nearest animal teaches the wrong lesson with a straight face, so the prompt says so too.
- **The fold across a page break follows the verdict.** The half that judged the question decides
  its type — including "none", which is what a `correct` continuation means for the first half.
- **The child's work still does not travel.** `_vetPortalDoc` / `_vetMathDoc` carry the QUESTION
  to a vetting list and nothing about the student's answer, the type included.
- Run **`node tools/scan-tests.mjs`** after touching any of it.

## 🐾 Science Sidekick analysis on a scanned paper (v1.8.0)

`SCIENCE_COACHES` / `SIDEKICK_ACCENT` / `_scanSubjectOf` / `_itemSubject` / **`_itemGetsSidekick`**
/ `sidekickAvatarHtml` / **`sidekickAnalysisHtml`** (beside the taxonomy — search `SCIENCE SIDEKICK
analysis`), `mistakeBoxHtml`'s first-line hand-off, the `subject` field on every answer item, and
the `.skCard` CSS. Drawings live in `sidekick-art.js`.

A Science Sidekick (Evidence Ellen, Context Connie…) says what a stronger answer needs NEXT, and
names the habit this answer showed, against the question and what the student wrote. It appears
automatically under an open-ended science mark — no second pass, no extra button.

- **OPEN-ENDED SCIENCE ONLY.** `_itemGetsSidekick` is the ONE gate: marked, `wrong` or `partial`,
  `type !== 'mcq'`, subject is science, and a habit this app can name. A multiple-choice tick is a
  tick — "(3)" shows no missed comparison and no vague wording. A blank was not attempted. Maths,
  English and Chinese keep the short 🐾 box. A failure of the gate draws nothing rather than a
  plausible face.
- **THE PICKER IS THE TEACHER'S WORD.** `_itemSubject` / `_scanSubjectOf` read `wsMeta.subject`
  first: a Science paper stays Science even if one question looks like maths. On *Any subject* the
  model's per-question `subject` decides, and an empty name means we do not know — no Sidekick,
  never a guess.
- **IT RIDES THE SAME MARKING CALL.** The habit is the `mistake` field already on the item. The
  card is presentation only: it never marks, never calls a model, never reads an answer key.
  `sidekickAnalysisHtml` refuses through `_itemGetsSidekick` rather than guessing.
- **THE FIGURE IS THE PORTAL'S.** `sidekickAvatarHtml` asks `renderScienceCoachAvatar` from
  `sidekick-art.js` and falls back to the Sidekick's emoji if the sheet is missing, so a test
  harness that never loaded the drawings still names the habit. An unknown id draws nothing: the
  Portal sheet falls back to Comparison Casey, which is the right thing for a coach card and the
  wrong thing here.
- **A SCIENCE MCQ STILL GETS THE SHORT BOX**, not the Sidekick card. The gate is on the analysis,
  not on filing a habit.
- Run **`node tools/scan-tests.mjs`** after touching any of it.

## 📥 Keeping a question — into the four vetting lists (v1.6.0)
> **v1.5.0 is deliberately skipped.** `polymathlc/cer` and `polymathlc/anskey` both already document
> "scan v1.5.0" as the version that types a correction on an ANSWER CARD and files it as a teaching
> note (`sourceQuestion`) — a feature this repo has not shipped yet. Two different features wearing
> one version number across the family is exactly the drift these files exist to prevent, so that
> number is left where those two apps are expecting it.

- **A question read off a photograph is a question the centre does not have.** Until now the only way
  one reached a bank was to be typed out again in the portal it belongs to, so in practice it never
  was: the paper was marked, the tab was closed, and the question went with it. Every answer card
  now carries **📥 Send to vetting**, and the header carries **📥 Send all to vetting** for a whole
  paper.
- **It is the ADMIN's door and nobody else's.** A student's device runs this very same scan — that is
  the whole point of the app — so `_vetCardFootHtml`, `renderVetAllBtn`, `vetOpen` and the How-tab
  card are all behind `isAdmin(currentUser)`, **and `vetChoose` asks again before it writes**. Hiding
  a button is not the same as shutting a door.
- **`VET_TARGETS` is the ONE table**: a subject, the portal it belongs to, the collection that
  portal's vetting list really lives in (`vetting` / `mathVetting` / `vettingEn` / `vettingZh`) and
  the SHAPE that portal's questions take — one row each. A fifth portal is one entry rather than four
  edits that have to agree.
- **Two shapes, not one.** Science, English and Chinese are one lineage: the answer lives in a BLOCK
  and an MCQ's correct option is that option's **id**. Maths files its answer on the QUESTION —
  `expected` / `markingGuide`, the options as plain strings and the correct one as a **position**,
  with `-1` meaning "not settled", which is that app's own convention. A portal-shaped document
  written into Maths renders as a question with no answer in it and nothing errors anywhere.
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
- **Every question that would not go is reported.** A batch that quietly sent nineteen of twenty
  reads exactly like one that sent all twenty.
- **Nothing else about this app changes.** Nothing is saved on a scan, on a Copy or on a Print; this
  is the one path in the app that writes a question anywhere, and only when the teacher presses it.
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
- After touching **🧠 the corrections loop** (`cerStyle`, `cerStyleDocRef`, the third listener
  in `loadTeachingNotes`, `styleBucketKey`, `styleProfilePick`, `_styleCountIn`, `_styleTier`,
  `_styleRetrieve`, `styleExemplarsFor`, `styleEditsAll`, `styleCorrections`, `styleEditRules`,
  `styleLessons`, `styleRecentEdits`, `_styleProfileBits`, `styleBlock`, `aiGrounding`'s
  `opts.q`, either `'scan'` call site's `{ q: ask }`, `notesTrimTo`, `notesDedupe`,
  `notesFairShare`, `notesJoinField`, or the `NOTES_*_MIN_EACH` / `NOTES_HARD_CHARS` pots), run
  `node tools/scan-tests.mjs`. Every failure is silent and the answers still come back. Put the
  `if (!p) return ''` back in `styleBlock` and a teacher's first correction reaches nothing at
  all; read `profile` instead of `styleProfilePick` and every answer is written in the averaged
  voice again; let the profile's `markingStandards` reach `'mark'` or `'scan'` and a guess a
  model drew from the teacher's answers decides a child's mark; let an exemplar, a fix, a lesson
  or a pair reach `'mark'` and the marker has been handed the answer; drop the C listener and a
  correction made in the Science portal reaches nothing here, while the panel says the loop is
  in force; stop sorting the union by time and "the newest correction" is whichever document
  happens to come second; and turn a pot back into a `.slice()` and the teacher's second
  standing instruction reaches no prompt while sitting in the notebook looking obeyed.
- After touching **🐾 the mistake type or the Sidekick analysis** (`MISTAKE_ANIMALS`,
  `MISTAKE_ANIMAL_ALIASES`, `mistakeAnimal`, `mistakeAnimalNormalize`, `MISTAKE_ANIMAL_RULE`,
  `SCAN_MISTAKE_RULE`, `_mistakeField`, `mistakeTally`, `mistakeBoxHtml`, `_itemGetsSidekick`,
  `sidekickAnalysisHtml`, `_scanSubjectOf`, `_itemSubject`, `SCIENCE_COACHES`, the `mistake` or
  `subject` field on an item, or the fold's `prev.mistake` / `prev.subject` line), run
  `node tools/scan-tests.mjs`. Every failure is silent and the card still renders: a type kept on
  a CORRECT answer tells a child they made a mistake they did not make; one kept on a BLANK marks
  a question nobody attempted; an invented animal files the mistake under a name no other app
  knows; a list that drifts from the one in `polymathlc/cer` and `polymathlc/anskey` sorts the same
  answer under a different animal depending on which app read it; and a Sidekick on a maths paper
  or a multiple-choice tick teaches a lesson the answer cannot show.
- After touching **the grounding, the live notebook, the scan run or the vetting door**
  (`aiGrounding`, `notesBlock`, `guidanceBlock`, `styleBlock`, `noteAppliesHere`, `noteSubjects`,
  `notesRelevant`, `groundingSummary`, `loadTeachingNotes`, `_notesDetach`, `stopTeachingNotes`,
  `_notesLiveRepaint`, `_scanNewItem`, `_scanFoldRows`, `_markFields`, `_askNewItem`,
  `_askFoldRows`, `_askPrompt`, `_scanPrompt`, `SCAN_SYS`, `SCAN_DETAIL_RULE`, `SCAN_MARK_RULE`,
  `SCAN_SUBJECT_RULE`, `SCAN_ASK_SYS`, `SCAN_ASK_WITH_PAGES_RULE`, `SUBJECTS`, `_parseAIJson`,
  `VET_TARGETS`, `VET_SOURCE`, `_vetPortalDoc`, `_vetMathDoc`, `_vetCorrectIndex`, `_vetTitle`,
  `_vetHtml`, `_vetCardFootHtml`, `vetOpen`, `vetChoose`),
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
  that is no longer purple and no longer says where it came from.
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
