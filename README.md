# Scan & Answer

Photograph a worksheet or an exam paper — or pick pictures out of the gallery — and every question
printed on them is read: whatever the student has already written is **marked**, whatever is still
blank is **answered**, in the teacher's own words, with **the working handed over one step at a
time** — the whole paper comes back as a **report**, and
every question the student got wrong is kept in their own **mistake book** to try again later. Science, Mathematics, English and Chinese.
Type or dictate a question alongside the photo — or with no photo at all. Or switch to
**📄 Worksheet** and the same photographs come back as a fresh worksheet to print.

Part of the Polymath Learning Centre family of apps, on the shared `mathgen--app` Firebase project:

| App | Repo | What it does |
| --- | --- | --- |
| Science Learning Portal | `polymathlc/cer` | question bank, practice, the games |
| Ans Key | `polymathlc/anskey` | the PDF worksheet annotator and answer keys |
| Math Practice | `polymathlc/math` | the maths bank, practice, Nova Protocol |
| English Learning Portal | `polymathlc/english` | the English bank and practice |
| Chinese Learning Portal | `polymathlc/chinese` | the 华文 bank and practice |
| **Scan & Answer** | **`polymathlc/scan`** | **photos in, marks and answers out** |

## 📄 Worksheet mode — the whole scan becomes the worksheet (v1.29.0)

Two pills above the box say what ✓ is for. Leave them alone and the app does exactly what it always
has. Press **📄 Worksheet** and the very same photographs are read for their **questions** instead
of their answers: every question on the pages is typed out clean and the whole scan comes back as
**one worksheet** — renumbered from 1, with the marks the paper printed, ruled lines under each
question to write on, and the answer key on a page of its own. Press 🖨 and it is the thing that
comes out of the printer.

**Nothing anybody wrote on the paper comes across.** A worked-through paper goes back to being the
blank one it started as: a filled-in blank comes back empty, a circled option comes back as an
ordinary option. That is the point of the mode, and it is what makes the sheet safe to hand out —
no named child's work on a paper thirty other children are about to sit.

**It also creates questions.** “Another five like question 3”, “same topic but harder”, “change the
numbers” — those are written for you and go on the sheet after the ones off the paper, each wearing
a purple **✎ written for you** note on screen so you know what to read first. It never prints on the
pupil's copy. Press ✓ in worksheet mode with no photo at all and the whole worksheet is written from
scratch.

**🔑 Answer key** takes the key off the page for the pupils' copy and puts it back for yours — what
is on the screen is exactly what prints, and **📋 Copy** follows it too. Nothing is marked in this
mode, so nothing reaches your mistake book and no report is written; a question that needs a diagram
says **[Diagram: …]** where it belongs and the page counts how many there are to draw back in. No
mark allocation is invented — only the ones the paper really prints.

## 📱 The worksheet button that ate the window (v1.28.7)

Opening **📕 Your questions** on a phone showed two enormous buttons filling the
whole window, with "The link goes to chungzhikai@gmail.com" printed down the
left edge one letter per line, and nothing else reachable.

Two changes from the previous rounds, each correct on its own, collided:

- `.sub` was given `overflow-wrap: anywhere` so a pasted link could not widen
  the page — which also means a long email can wrap **anywhere**, so its
  narrowest possible width is one character.
- The modal foot's buttons were allowed to grow to fill their row.

A flex row stretches its children to the tallest one by default. The buttons
took all the width, the note was crushed into a 38-line column, and the buttons
grew to match it.

Fixed on the row itself — the foot no longer stretches anything, the note takes
its own line rather than being squeezed, and the buttons are half the row each.
And the phone tool now has the check that was missing: every check it had asked
whether a control was too *small*; none asked whether one had become absurd.

## 📱 The tab bar, for real this time (v1.28.6)

The previous round said the tab bar was fixed. It was fixed at one width.

The header **wraps** — that is its documented last line of defence when the
toolbar will not fit — so giving the tabs the header's height as a number
(68px) was right on a phone and wrong everywhere else. On an iPad in portrait,
at 621px, and on a 320px fold, the header is 101 or 171px tall and the tab bar
sat *underneath* it: not merely hidden but unclickable. The header and the tabs
are now one sticky box, so neither has to know the other's size and there is no
number left to drift.

Two more of the same shape:

- **The ask box still clipped its placeholder below 375px.** Shortening the
  text fixed the width it was measured at; the box had no minimum height at
  all, and it sizes itself from typed content, which a placeholder is not.
- **Every check the phone tool has ran at scroll 0**, and a full-page
  screenshot resizes the viewport to the document height — so a sticky overlap
  could never appear in any picture it wrote. It now scrolls, hit-tests the
  tab, and writes a second screenshot per viewport from partway down the page.

Also: the report card in the tool's own screenshots had been printing
"NaN / 3 of the questions attempted" — a fixture bug, but it meant the tool had
never once shown the number a parent reads.

## 📱 The sticky header, the delete button, and a tool that was measuring a page the app never shows (v1.28.5)

A fifth review round, and most of what it found was in the *checking*, not the app:

- **The sticky header stopped sticking** after about one screenful — `height: 100%`
  on `body` bounds it — so on a twenty-question paper the header, the version
  badge, 📕 My questions and Sign out all left the screen for good. And the two
  tabs were **hidden behind the header** from the first pixel of scroll.
- **The mistake book's per-row delete was a ✕ identical to the window's close
  button** — same class, same glyph, same size, both hard against the right
  edge — and it deleted *immediately*, while its labelled twin in the foot
  asked first. It is 🗑 now, and it asks. (The 📕 chip on an answer card stays
  a single tap; that one is a toggle on the card in front of you.)
- **The verdict and the marks split onto two rows at exactly 390 and 393px** —
  most of the school — leaving "1/2" alone as an unlabelled fragment.
- **The ask box clipped its own placeholder** on every phone, on the first
  screen.
- **A report that failed printed the raw error**, and a Gemini spending-cap
  message is one unbroken URL: 456px of it on a 393px screen. The app broke its
  own layout precisely when it was being used to diagnose a breakage.

And the tool: it was never rendering the camera bar — **the shutter, the gallery
and ✓, the three controls the app actually is** — so they were exempt from every
check and the dock measured 59px instead of 161px. Its exemption for scrolling
rows also exempted `overflow-x: hidden`, which meant the *original* bug with the
classic band-aid over it passed everything. Both fixed, the How tab and the
report card are now rendered and measured, and every mutant must break **exactly**
the set of checks it declares — an over-broad one proves nothing.

## 📱 …and the tablet, and the phone on its side (v1.28.4)

Two more review rounds. The fixes had been done in one place and not the next,
and the tool that said otherwise had a blind spot each time:

- **A misplaced brace carried thirty phone-only rules up to 900px** — so an
  iPad, and every phone turned sideways, got the phone's two-up button grid,
  phone page margins, and a 44px ✎ disc with the word "Edit" spilling out from
  under it on every card. Every check passed: the layout was *valid*, just the
  wrong one. Both harnesses now check which rules actually win at 768px.
- **A phone on its side got the desktop header** — 117px of chrome on the
  shortest screen the app ever has. The compact header is keyed to height and
  pointer now, not width alone.
- **One long unbroken token** — a pasted link in an answer — still laid a card
  out at 439px on a 393px screen. Every text container wraps now.
- **The 44px floor was height-only**, so 📎 Attach was 40×44 — on precisely the
  phones the floor exists for.
- **A generated build artifact had been committed**, in a directory named
  `--selftest`. Removed, and the tool now refuses to write anywhere inside the
  repository.

And the tool got the two checks it was missing: one that notices a *window*
laid out too wide (a 900px dialog passed everything before), and one that
notices the phone layout leaking past its breakpoint. `--selftest` now also
carries a mutant that must stay **green** — a page strip with eight pages in it
is *meant* to run off the side of itself, and a check that fires on correct
code is how a tool stops being read.

## 📱 It fits the phone, the tablet and the landscape too (v1.28.2)

Three reviewers went over v1.28.1 and found the same fix had been done in one
place and not the next:

- **The header toolbar could not wrap either.** A header that wraps whose
  toolbar cannot is 751px of buttons on a 728px row — so from 621px to about
  906px (iPad portrait, a phone turned on its side, a half-screen laptop
  window) the page was still too wide and **Sign out was still off the edge**.
- **The two-up button grid only existed at four buttons** — the rarest case.
  A student sees three and 🖨 Print stretched across the whole card; a teacher
  sees five once 📊 Report appears. Every button is now exactly half the card.
- **44px is about fingers, not about width.** Keyed to a narrow screen the
  floor switched off the moment the phone was turned sideways. It is keyed to
  the pointer now, and it covers *every* control — the mistake book's tick box
  was 19×19, ✎ Edit's "remember this" 17×17, the three Settings pickers 41px,
  💬 Ask Mr Chung 30px.
- **✎ Edit is a square, not a pill.** At 67×44 it no longer fitted the card's
  head line, so every card grew a row holding nothing but ✎ Edit.
- **The waiting answer box is gone, not greyed.** A box labelled ANSWER whose
  contents are not the answer is the same misreading in a quieter colour — and
  the grey dashed styling leaked onto **paper**, so an unattempted question
  printed its answer in a "waiting" box while a walked-through one printed
  green. The card now says *"The last step is the answer"* over the working,
  and print gets the ordinary answer box.

**And the checking tool was checking nothing.** Two of its five measurements
could not fail: under mobile emulation `innerWidth` *grows* to the overflowed
width, so "is the page wider than the screen" was true no matter what — run
against the broken file it reported all three viewports clean. Both now measure
what they name, the viewports straddle the breakpoint instead of all sitting
below it, the harness is signed in as somebody, and

```
node tools/mobile-check.mjs --selftest
```

breaks the page in the exact way each check names and requires the check to go
red. A check that cannot fail is not a check.

## 📱 It fits the phone again (v1.28.1)

Adding the 👣 button made the answers' button row four buttons wide — about
570px of buttons on a 390px screen — and a row that wide does not just spill
over the edge. iOS lays the **whole page** out at that width and shrinks it to
fit, so every card went small, the header clipped to *"Scan & A…er"*, and the
page scrolled sideways with **Print** cut in half.

Fixed properly, and pinned so it cannot come back:

- The answers' buttons **wrap**, and on a phone they become a two-up grid at
  thumb height — 📥 / 👣 on one line, 📋 / 🖨 on the next.
- The header is a proper **app toolbar**: one 44px square per control, the
  mistake-book count sitting *on* the book rather than making it wider than
  everything beside it, and the whole toolbar drops to its own row on a screen
  too narrow to hold it. The app wears the short name **Scan** on a phone —
  five controls, a logo and "Scan & Answer" do not fit across 393px however
  they are tuned. The **version badge stays**, always.
- **Everything you press is at least 44px**, on both axes, in every window.
  ✎ Edit was 27px tall; the vetting and mistake-book buttons were under 20.
  (The page strip's ◀ ▶ ✕ are the one deliberate exception — they live inside
  a 116px thumbnail.)
- The **held-back answer** no longer sits in a green *ANSWER* box pretending the
  cover sentence is the answer — it is plain paper with a dashed edge until the
  working has been walked through, then it comes back green with the answer in
  it.
- Cards, step boxes and modals give back their side padding on small screens
  without giving up any of their line spacing.

**`node tools/mobile-check.mjs`** is new: it lays the real page out in three
real phone viewports (iPhone 15 Pro, iPhone SE, Galaxy Fold), measures that
nothing is wider than the screen, names the element if anything is, checks every
button against the 44px floor, and writes a screenshot of each to look at.

## 👣 One step at a time, and every card says what subject it is (v1.28.0)

A worked answer printed in full is read from the bottom up: the student finds
the final number, writes it down and learns nothing. So every card that has
real working now hands it over **one step at a time**.

Press **Show me the first step**, read the line of working and the sentence
under it saying why it is done, then press **Next step** — and keep going. Each
step is a line a student could have written themselves, and **the last one is
the answer**. On a question that is still blank the answer waits behind the
steps, because an answer printed above the working is the only line that gets
read; on one the student has already answered it is shown straight away, since
the mark is already on the card and a script being marked must not have to be
clicked through. The full **Why** waits with the steps on both.

**Show all working** on a card opens that one. **👣 Show all working** at the top
of the answers opens the whole paper at once, and presses again to close it back
up for a second go. **Copy** and **Print** always carry every step, whatever is
on the screen at the time — a printed answer key is the whole worked answer.

Every maths question is broken into at least two steps, and the no-algebra rule
holds inside them: a walk-through that reached for "let x be" is rewritten with
the rest of the answer, because the steps are the one place a student reads
line by line.

Set *How much explanation* to **Answer only** and there are no steps at all.

**And every answer card now wears the subject it was read as** — *Mathematics
question*, *Science question*. It was already worked out per question, and it
already decided which standard the answer was held to, whether the no-algebra
rule applied and which vetting list 📥 offered — the card simply never said so.
A mixed pile of pages now says on each card which subject that question was
answered and marked to, and where the question did not say, the chip says the
subject came from Settings instead. The **mistake book** files a question under
its own subject too, so a maths question off a mixed pile stops coming back
chipped as Science.

## No square behind the logo (v1.27.2)

The header's mark was a pale-orange rounded tile — right when what sat in it
was an emoji, which needs something to sit on. A logo does not, so the tile is
gone and the logo stands on the page. Nothing else moved.

## The roster read “[object Object]”, and the logo is on (v1.27.1)

Opening **👥 Students** printed a wall of `[object Object]` where the roster
should have been. Loading the list handed the students to the slot that prints
an *error message*, so every one of them was stringified into it and not a
single row was drawn. Fixed, and the slot now refuses anything that is not
really a message.

The header, the browser tab and a home-screen shortcut also wear the Polymath
logo now — the same mark the other apps use. There was no icon at all before.

## 👥 Scan a paper FOR one of your students (v1.27.0)

A student comes to the centre with a paper. Press **👥 Students** in the header,
pick them, and every paper you scan from then on is marked and filed under
**them** — their mistake book, their learning list, their questions to try
again. The banner across the top of the Snap tab says who you are scanning for
the whole time, and **↩ Stop** puts you back on your own account.

- **The roster is the one you already have.** It is the same student list your
  Ans Key app keeps, so a student appears in both and you keep one list, not
  two. A student who has signed in to any of the Polymath apps is on it
  already.
- **Add a child who has no Google account.** The **Add a student** box at the
  bottom of the window makes a record kept at the centre. Their book lives on
  your side and you open it for them; a student with an account of their own
  gets their questions on their own phone. **Each row says which of the two it
  is**, so you always know.
- **Their level and subject are used** while you are scanning for them, and
  yours come back when you stop — which is what pitches the answers right and
  matches the right teaching notes.
- **Only three things move**: whose mistake book is read, whose it is written
  to, and where the cropped questions are stored. Your **teaching notes**, your
  **vetting lists** and the **worksheet you print** all stay yours. It is not a
  "sign in as them" — you are still you.
- It is the **teacher's** button and nobody else's, and it is dropped the moment
  the account changes.

## 📄 Send a PDF, and it is marked against the answer key inside it (v1.26.0)

A parent asked for this: *"may I request for a function where my child can
upload a PDF where he did his mistakes working and have the app mark it with
reference to the answer in the PDF?"*

Tap **🖼** on the Snap tab (or drag the file onto the page) and choose a PDF.

- **Every page is read.** The PDF is split into its pages and each one is put
  through exactly the same reading the camera's photos get — three pages a
  call, in order, with a question that runs over a page break stitched back
  together. It is deliberately not sent as one file: a whole PDF handed to the
  AI in one go is how a page gets quietly skipped.
- **A page that will not open is shown as a failed page**, never dropped, and
  a PDF longer than there is room for says how many pages were left out.
- **🔑 The answer key in the same PDF is used first.** Most practice papers
  carry their answers — beside each question, or as a marking scheme at the
  back. The back is the hard case, because the pages are read in threes and
  the questions on page 1 are marked long before page 11 is reached, so the
  key is now hunted for and transcribed **before any marking starts** and then
  given to every batch. The pages it came off are labelled 🔑 and every answer
  taken from it wears **🔑 from the paper's key**, so you can see at a glance
  which marks came off the paper and which the AI worked out.
- **…but the key says what the answer IS, not how it has to be worded.** A key
  that says "24 g" still marks "24 grams" correct, and one that says "it
  evaporates" still marks "it turns into water vapour" correct. **Your own
  marking notes decide** what wording is acceptable — the same notebook your
  Ans Key app and the Science Learning Portal write to.
- **A disagreement is said out loud.** If the working reaches a different
  answer from the printed key, the key still stands, and the card says ⚠ with
  one line explaining the difference. A printed key can hold a misprint, and
  that is for a teacher to look at rather than for the app to decide.

Everything else follows for free: the score, the report on the whole script,
and the mistake book that keeps every question the child got wrong.

## 💬 Ask Mr Chung goes straight to his chat now (v1.25.0)

Pressing **💬 Ask Mr Chung** used to open the phone's share sheet: find
WhatsApp in it, then find Mr Chung in a contact list. It now opens **his own
conversation directly**, by his number — no sheet, nothing to hunt for and
nothing to scroll, and it works even if you have never messaged him and do not
have him saved. The message is already written and the question travels as a
link to the typeset sheet, which opens for him whether or not he is signed in.

**📎 beside it is the other way**, for when you would rather the picture came
through as an image: that is the share sheet, with the picture really
attached, at the price of picking WhatsApp and then picking the chat. It is
only shown on a device that can actually do it.

No web page can attach a file to a WhatsApp link — `wa.me` carries text and
nothing else — so those two really are the only routes there are, and the
button now takes the one that lands in the right chat.

## What it does

Three buttons and two tabs. The **Snap** tab is a camera:

|  |  |
| --- | --- |
| 🖼 **left** | your gallery — and the badge on it is how many pages you have so far |
| 📷 **middle** | the shutter — and the camera **stays open**: page after page, no "use photo / retake" |
| ✓ **right** | read the lot: mark what has been answered, answer what has not — or make the worksheet |

Above those three there is a box to type in, a 🎤 beside it where your browser can hear you, and
two pills saying what ✓ is for: **✅ Answer & mark**, or **📄 Worksheet**.

That is the whole interaction. The pictures go up three at a time as **one run**, so a question
that carries on over the page is stitched back together instead of coming back as two halves, and
every question printed on the pages is dealt with — multiple choice, fill in the blank, open-ended
and lettered parts alike.

Then **Copy** or **Print**. Nothing is saved anywhere — bar the teacher's own ✎ and 📥, below: a photographed paper is somebody's work, so
it lives in the tab and leaves through those two buttons.

The **How to use** tab holds the instructions and the only settings there are — how much
explanation you want (answer alone, a short reason, or the full working), and optionally the level
and subject, which narrow which of your teaching notes apply and which standard the paper is held
to.

## Say what you want, in writing or out loud

- **With photos** — what you ask governs the run. *“Only question 5”* does question 5 and leaves the
  rest out; *“check my working on the last page”* checks that; *“P5 maths, test on Friday”* is taken
  as background and every question is still done. It never stops the marking.
- **With no photo at all** — press ✓ with just the box filled in and it answers what you asked. Ask
  for five practice questions and five come back, one card each. Tell it the answer you got and it
  marks that instead.

The 🎤 appears only where the browser really has dictation, and it listens in the language of the
paper — set the subject to Chinese and it listens in Chinese. What you asked is shown above the
answers and travels with **Copy**, so one card where you expected twenty always says why.

## It marks what is already written

There is nothing to choose and no mode to switch. Every question is looked at for an answer already
on the paper:

- **Something written** → it is **marked** — ✓ correct, ~ partly right or ✗ wrong — with the marks
  where the paper prints an allocation, a line or two of **feedback** written to the student saying
  exactly where it went wrong and what to do instead, and the correct answer beside it.
- **Still blank** → it is simply **answered**. A blank is never marked wrong: it has not been
  attempted, so there is nothing to mark.

A page holding some of each — the ordinary case — comes back with some of each, and the chips above
the answers say how it went. The correct answer is always worked out from scratch **first**, from
the printed question alone, so what the student wrote can never talk the app into agreeing with it.

## 📋 And then the report on the whole paper

Twenty marked cards are twenty separate verdicts. What a teacher writes at the bottom of a paper
they have just marked is the thing none of those cards can say — so once the last page has been
read, the marked script is looked at **as a whole** and the report appears above the answers:

- **the score**, and how it was arrived at;
- **what went well** — what the student can already do, named;
- **what to work on** — the mistakes grouped into *themes*, each naming the questions it shows up
  in, because the same slip in questions 3, 7 and 12 is one misunderstanding, not three;
- **what to practise next.**

It writes itself; there is nothing to switch on. **The score is counted by the app, never by the
AI** — out of the paper's own marks where every question prints one, and otherwise a question at a
time with a partly right answer worth half. The card says which of the two it did. A question left
blank is never counted against you, and an answer the AI would not commit to a verdict on is left
out rather than marked wrong.

A paper with nothing written on it gets no report — there is nothing to report on, only answers.
The report goes out with **Copy** and **Print**, and **📊 Report** writes it again.

## 📕 Your mistake book

Every question you get **wrong** or **partly right** on a scanned paper is kept — the question, its
diagram, what you wrote, the right answer and the feedback. It fills itself as you scan; the number
on **📕 Mistake book** at the top of the screen is how many are in it, and every marked-wrong card
carries a 📕 chip that takes it back out in one tap.

**This is the only thing the app keeps.** Your photographs are not saved and your right answers are
not saved. The book is under your own account: nobody else can see it, and your teacher's book is
their own mistakes, not yours. Everyone has one — students and teacher alike.

### 📤 …and a worksheet of the ones you choose

Open the book, tick the questions you want to try again, and press **📤 Make a worksheet**. A link
is sent to the email you sign in with (and it is always on screen with a **Copy** button, so it
never depends on the email arriving). The page it opens is the questions on their own, with the
answers on a page at the back — ready to print or save as a PDF.

It opens **cleaned up**: the printing sharpened to black and white and your own working rubbed out,
so the question is blank again and can honestly be attempted a second time. One switch brings back
**the original photograph** instead. The wording is the same in both — only the pictures are
redrawn, and the answers, options and marking never pass through an image model.

The worksheet keeps for a year, and only you and your teacher can open it.

### ✓✓ …and questions take themselves out again

Print it, do it, and then **photograph it back in** like any other paper. Every question you get
**fully right** counts once — get the same one right **twice in a row** and it leaves your mistake
book for good. Get it wrong in between and the count starts again, because two in a row is the
whole point: once is luck often enough to matter. A question left blank changes nothing either way,
and a *partly right* answer counts as a miss.

The card says where each question is up to (*right 1 of 2 — 1 more and it clears*), the book shows
the same on every row, and the run's message names what cleared. Nothing ever disappears out of the
book without saying so.

## ✎ Fix an answer, and teach it for next time

Every answer card carries an **✎ Edit**. The top half fixes the card in front of you — the answer,
the explanation, and on a question the student attempted, the mark and the feedback. That is what
**Copy** and **Print** hand over, and a card you have rewritten says *✎ Edited by you* so it never
reads as one the AI wrote. Correcting a multiple-choice answer by naming another option moves the
tick with it.

The bottom half is the point. Type the rule behind the correction — *“on ‘explain’ questions, always
name the process and say who benefits”* — and it is saved as a **standing instruction** in your
notebook: obeyed word for word on every question from then on, here, in **Ans Key** and in the
**Science Learning Portal**, because all three read the same notebook. Tick *Remember my answer to
this question* and the question and your corrected answer are filed alongside it as a key fact, so
that very question comes back right. The note is offered at the level and subject of the paper you
are scanning and can be widened to every subject in one tap.

**The ✎ is the teacher's alone.** It is not drawn on a student's device and the window will not
open there, because it is a door into the notebook that grounds all three apps — and a student's own
non-standard answer is the one thing those notes must never learn from.

## 📥 Keeping a question (teacher only)

✎ Edit fixes the answer. **📥 Send to vetting** keeps the *question*: a question read off a
photograph is one the centre does not have, and until now the only way it reached a bank was to be
typed out again in the portal it belongs to.

Every answer card carries **📥 Send to vetting** beside its ✎, the header carries **📥 Send all to
vetting** for a whole paper, and the How-to-use tab carries **📥 File every question read** — set
the portal once and the whole paper is filed the moment it has been read.

| Portal | Repo |
| --- | --- |
| 🔬 Science Learning Portal | `polymathlc/cer` |
| 📐 Math Practice | `polymathlc/math` |
| 📘 English Learning Portal | `polymathlc/english` |
| 📕 Chinese Learning Portal | `polymathlc/chinese` |

**Each question goes to the app for its own subject.** The subject is worked out from the question
itself, so a pile holding two subjects files itself correctly and a maths question never lands in
the science list. The button on the card says where it is going *before* you press it, and you can
always choose a different list. Set **Subject** in the settings and the whole paper goes to that one
app instead. A question whose subject cannot be told is never guessed at — it stays on the card for
you to send by hand, and the toast says how many.

It lands in **vetting**, never in the bank. The card is highlighted **purple** there and says it
came from this app, because a scanned question is not like a typed one: it was read by a model from
a picture of somebody's worksheet, the wording may be half a line short, **the diagram is not there
at all**, and the topic is left for you to choose — it belongs to that app's syllabus, not this
one. Nothing reaches a student until you approve it there.

The question, its options, its answer and the reason why travel. What the student wrote, the mark
and the feedback do not — a bank question is the question, not somebody's marked answer to it.

**📥 is the teacher's alone**, like the ✎: the buttons are not drawn on a student's device and the
write refuses as well.

## Maths is never answered with algebra

Every maths answer uses the methods the PSLE is marked on — the **unitary method** (units and parts), a
**model** described in words, before-and-after, working backwards, the assumption method. No letters
standing for unknowns and no equations to solve: an answer that reaches the right number by algebra is
one a pupil cannot reproduce in the exam, and it is worse than no answer because it looks right.

It is not only asked for in the prompt, it is **checked**. Every maths answer is read afterwards by plain
code — no AI, so the same answer always gets the same verdict — and one that slipped into algebra is
rewritten *before it reaches the screen*.

The rewrite is **rationed**: at most two extra calls for a whole run, each carrying up to twelve
questions, and text-only. A page where fifteen answers all slipped is one call, not fifteen; an ordinary
paper spends none. If an answer still uses algebra after that, the card says **⚠ uses algebra** rather
than hiding it, so it can be put right with ✎ Edit.

A question that *prints* the algebra itself — "simplify 3x + 5x" — is answered as the paper asks.
Answering a printed algebra question another way is answering a different question.

## Four subjects

Science, Mathematics, English and Chinese, each held to its own standard: a maths answer needs its
working and its unit, a science answer has to name the process, an English comprehension answer is
full sentences in the student's own words, and a Chinese paper is answered, explained and marked
**in Chinese**. Leave the subject picker on *Any* and the paper decides for itself. Every answer card
says which of the four the question was read as, so a mixed pile of pages says on each card which
standard it was held to.

## The answers are the teacher's, not the model's

The teacher's own **teaching notes** and the **style** learned from the answers they have written on
their own worksheets are consulted **first** — before a blank is answered and before a written
answer is marked. They come from the same notebook the Ans Key app and the Science Learning Portal
use, at `users/{adminUid}/teachingNotes`. Notes uploaded in any of the three apps ground all three.

Where there are no notes there is no digest at all and the ordinary syllabus standard applies —
the plain AI, exactly as it was before any of this existed. Notes can be tagged to one of the four
subjects (and to levels), so a Chinese 词语 rule never turns up in an English comprehension
answer.

- **✎ Edit** on any answer card (admin only) — the fastest way in: correct the answer in front of
  you and say what should have happened, in the same breath.
- **✍️ Add a note** (admin only) — house rules in your own words, obeyed word for word on every
  question, when answering and when marking alike. Leave it on *Every subject* or tag it to one of
  the four. Type it and it is live.
- **📚 Teaching notes** (admin only) — upload PDFs and photos of your notes; the AI pulls out the
  keywords students must use, the marking standards and the key facts, and everything it extracts
  stays editable.
- **🧠 Your learned style** — read here, learned in **Ans Key**. Press *Learn from this worksheet*
  there on a worksheet you have already answered and every answer written here sharpens with it.

**The notebook is live.** Type a note in Ans Key mid-lesson and the very next question answered
here obeys it — no reload, nothing to press. The same goes the other way and for the Learning
Portal: one notebook, three apps, always the same one.

The page says which of those it is applying, under the answers. An ungrounded answer looks exactly
like a grounded one, so it says so rather than leaving you to guess.

## Running it

It is one static file. Open `index.html`, or serve the folder — it is published at
`polymathlc.github.io/scan`. Sign in with Google; the teaching notes window is the admin's alone.
