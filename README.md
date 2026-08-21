# Scan & Answer

Photograph a worksheet or an exam paper — or pick pictures out of the gallery — and every question
printed on them is read: whatever the student has already written is **marked**, whatever is still
blank is **answered**, in the teacher's own words. Science, Mathematics, English and Chinese.

Part of the Polymath Learning Centre family of apps, on the shared `mathgen--app` Firebase project:

| App | Repo | What it does |
| --- | --- | --- |
| Science Learning Portal | `polymathlc/cer` | question bank, practice, the games |
| Ans Key | `polymathlc/anskey` | the PDF worksheet annotator and answer keys |
| **Scan & Answer** | **`polymathlc/scan`** | **photos in, marks and answers out** |

## What it does

Three buttons and two tabs. The **Snap** tab is a camera:

|  |  |
| --- | --- |
| 🖼 **left** | your gallery — and the badge on it is how many pages you have so far |
| 📷 **middle** | the shutter: one photo per page, in the order they are printed |
| ✓ **right** | read the lot: mark what has been answered, answer what has not |

That is the whole interaction. The pictures go up three at a time as **one run**, so a question
that carries on over the page is stitched back together instead of coming back as two halves, and
every question printed on the pages is dealt with — multiple choice, fill in the blank, open-ended
and lettered parts alike.

Then **Copy** or **Print**. Nothing is saved anywhere: a photographed paper is somebody's work, so
it lives in the tab and leaves through those two buttons.

The **How to use** tab holds the instructions and the only settings there are — how much
explanation you want (answer alone, a short reason, or the full working), and optionally the level
and subject, which narrow which of your teaching notes apply and which standard the paper is held
to.

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

## Four subjects

Science, Mathematics, English and Chinese, each held to its own standard: a maths answer needs its
working and its unit, a science answer has to name the process, an English comprehension answer is
full sentences in the student's own words, and a Chinese paper is answered, explained and marked
**in Chinese**. Leave the subject picker on *Any* and the paper decides for itself.

## The answers are the teacher's, not the model's

The teacher's own **teaching notes** and the **style** learned from the answers they have written on
their own worksheets are consulted **first** — before a blank is answered and before a written
answer is marked. They come from the same notebook the Ans Key app and the Science Learning Portal
use, at `users/{adminUid}/teachingNotes`. Notes uploaded in any of the three apps ground all three.

Where there are no notes there is no digest at all and the ordinary syllabus standard applies —
the plain AI, exactly as it was before any of this existed. Notes can be tagged to one of the four
subjects (and to levels), so a Chinese 词语 rule never turns up in an English comprehension
answer.

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
