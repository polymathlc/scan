# CLAUDE.md

Guidance for Claude when working in this repo.

## App
- `index.html` — **"Scan & Answer"**. One self-contained file (markup + CSS + JS) on the shared
  `mathgen--app` Firebase project with Google sign-in. Photograph a worksheet or an exam paper —
  or pick pictures out of the gallery — and **every question printed on them is read and
  answered**. Nothing is saved anywhere: a photographed paper is somebody's work, so it lives in
  the tab and leaves through Copy or Print.
- Version badge (`APP_VERSION`, shown in the header) is hard-coded — bump it on every change.

## The AI is the Ans Key app's, ported whole
Everything that decides what an answer SAYS is a lift from `polymathlc/anskey` — **keep the two in
step, and ship a change to the shape in both repos together**:

- **`aiGrounding(kind)` is the ONE door.** Every AI call in this app appends it to its system
  prompt. Adding an AI feature means calling it too — grounding one call site and not another is
  how the app ends up answering in the teacher's voice on one button and not the next.
  `kind` is `'answer'` (writing an answer), `'mark'` (marking) or `'teach'` (explaining); marking
  gets the marking standards and never the exemplar answers.
- **The authority order is stated in the digest and never changes**: what the paper itself prints
  wins, then the teacher's general guidance, then the notes and the style, and ordinary syllabus
  knowledge only where they say nothing.
- **`guidance` is the hand-typed note and it is the ONLY field that reaches every `kind`.** It goes
  in verbatim through `guidanceBlock()`, ahead of `notesBlock`/`styleBlock`. Nothing is sent to the
  AI when one is saved: it is a note with empty `subjects`/`levels` (so it applies everywhere) and
  empty `keywords`/`keyFacts`/`markingStandards`, written straight to Firestore.
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

## The screen: three buttons and two tabs (v1.2.0)
- **The Snap tab is a CAMERA, not a form.** Three controls at the bottom, thumb-height, and nothing
  else: **the gallery on the left** (wearing the newest page and a badge counting the pages in
  hand), **the shutter in the middle**, **✓ on the right**. That is the whole interaction — a phone
  held over a worksheet, one thumb. Anything added to that bar has to earn its place against the
  three that are there.
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
- **`thinkingLevel: 'high'` is what decides whether the answers are right.** A P5 word problem is
  four or five steps of units and model drawing, and a model answering off the top of its head gets
  them wrong. Do not turn it down to save tokens.
- **`_scanRun` is bumped on every run**, so a reply that arrives after the teacher has started again
  is dropped instead of landing among the new answers.

## House rules
- After touching **the grounding, the live notebook or the scan run**
  (`aiGrounding`, `notesBlock`, `guidanceBlock`, `styleBlock`, `noteAppliesHere`, `notesRelevant`,
  `groundingSummary`, `loadTeachingNotes`, `_notesDetach`, `stopTeachingNotes`,
  `_notesLiveRepaint`, `_scanNewItem`, `_scanFoldRows`, `SCAN_SYS`, `SCAN_DETAIL_RULE`,
  `_parseAIJson`), run
  **`node tools/scan-tests.mjs`**. It loads the REAL sections out of `index.html` and runs them
  against stubs. Every failure here is silent and the app carries on looking perfectly right: a
  digest that comes back empty is an answer that is no longer the teacher's, key facts leaking into
  a marking digest is the answer handed to the marker, a continuation that stops folding turns one
  question into two halves each with half an answer, and a page number that is batch-local rather
  than global cites the wrong page on every answer after the third. The listener is in there for
  the same reason: a one-shot read looks exactly like a live one until the day somebody types a
  note in Ans Key mid-lesson, and then this app is quietly a day behind the one next to it.
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
