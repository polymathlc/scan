# Scan & Answer

Photograph a worksheet or an exam paper — or pick pictures out of the gallery — and every question
printed on them is read and answered, in the teacher's own words.

Part of the Polymath Learning Centre family of apps, on the shared `mathgen--app` Firebase project:

| App | Repo | What it does |
| --- | --- | --- |
| Science Learning Portal | `polymathlc/cer` | question bank, practice, the games |
| Ans Key | `polymathlc/anskey` | the PDF worksheet annotator and answer keys |
| **Scan & Answer** | **`polymathlc/scan`** | **photos in, answers out** |

## What it does

1. **Add your pictures.** Take a photo of each page, or choose several out of the gallery at once.
   On a computer you can drag them in or paste one. Pages can be reordered and removed.
2. **Read & answer.** The pictures go up three at a time as one run, so a question that carries on
   over the page is stitched back together instead of coming back as two halves. Every question
   printed on the pages is answered — multiple choice, fill in the blank, open-ended and lettered
   parts alike.
3. **Copy or print.** Nothing is saved anywhere: a photographed paper is somebody's work, so it
   lives in the tab and leaves through those two buttons.

Pick the amount of explanation you want: the answer alone, the answer with a short reason, or the
answer with the full working line by line.

## The answers are the teacher's, not the model's

Every answer is written against the teacher's own **teaching notes** and the **style** learned from
the answers they have written on their own worksheets — the same notebook the Ans Key app and the
Science Learning Portal use, at `users/{adminUid}/teachingNotes`. Notes uploaded in any of the three
apps ground all three.

- **✍️ Add a note** (admin only) — house rules in your own words, obeyed word for word on every
  question. Type it and it is live.
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
