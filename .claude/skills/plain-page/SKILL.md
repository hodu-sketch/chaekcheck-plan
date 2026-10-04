---
name: plain-page
description: Write a plain-language Korean HTML page for this planning workspace - a decision page for the canvas, an answer to the user's question, or an explanation of a document - that a non-developer can read, with evidence from official sources, diagrams and (for screens) PC/tablet/phone mock-ups. Use whenever the plan-canvas skill needs a decision page, and when the user says "쉽게", "easy하게", "쉬운 말로", "이해가 안 가", or asks to be shown something as a page.
---

<!-- Project copy of the writing rules of the personal `easy` skill (plugin skill `anthropic-skills:easy`), adapted to this workspace
     so the canvas pages do not depend on that skill's name (user, 2026-10-04). The page text is Korean; this file stays in English. -->

Write the page so that someone who has never seen the source document can picture what will happen. Accuracy comes first: a page that is easy but wrong has failed.

## Never add what is not there

- No background, motive or example that the source or an official document does not give. No numbers, dates or names from memory.
- No metaphors, and no friendly nicknames for official names (a nickname is a metaphor). Keep the real name and explain what the thing does.
- "may" stays "may". What could not be verified is written as "확인 못 함"; it is never filled in.
- Reasons for a decision: only the user's own words, quoted. Otherwise `[이유 미확인]`. A proposal the user approved is written as "제안 → 승인", not as the user's reason.

## Writing rules

1. Conclusion first: one large sentence above the cards saying what the page is about and what the reader has to do. Each card starts with its own conclusion in a highlighted block; details come after.
2. Shorter than the source. One idea per sentence. Polite 합니다 style, no emoji, no talking down.
3. Technical terms: leave them out when the reader will never handle them (column names, internal states, storage layout). Names the reader will actually see or type (addresses such as `/signup`, file names, product feature names) stay as they are, explained in one or two sentences where they first appear.
4. No abstract verbs ("처리한다", "관리한다", "연동한다"): say who does what and what changes as a result. Name the actor ("우리 서버", "네이버", "화면") instead of "받는 쪽". Show an effect with one concrete example.
5. Say what a mechanism guarantees, not how it is built, unless the reader has to choose between builds.
6. Never stop at a count or a group name ("문구 넷"): list every member with a one-line meaning, in a table when there are many.
7. At most five items in one card and about seven cards; group longer lists and say why they are grouped that way.
8. When one place is reworded, reword every place of the same kind. The same thing keeps the same name on every card.

## Decision pages (used by `plan-canvas`)

- One numbered item per `[안]`, in the source document's order. Each item has: what happens if the proposal is taken (a concrete example), `다른 선택` with what each alternative costs, and the recommendation. Write the literal text `[안]` exactly once per item (it becomes the chip); do not write `[안]` anywhere else on the page except inside `<code>`.
- Say plainly when a proposal changes something the user decided earlier, and when a recommendation changed since the last round and why.
- Evidence: when a proposal rests on an external fact, look it up in the official source first. Give the source name, URL and check date on the page, record the detail in the cycle's `research.md`, and point to that section. Mark what could not be checked as "확인 못 함".
- **Every page stands alone** (user, 2026-10-04: a heading said `"가"로 가되 …` and the reader could not tell what "가" was). Refer to an option by what it is, never by its label alone: write "서버 메모리에 두는 안(가)" rather than "가". The same goes for item numbers ("3번"), names coined on an earlier page, and "처음 제안 그대로": restate the content in the heading and in the first sentence, because the reader does not have the earlier page open. A label may follow in brackets for matching.
- Answering a question on an open page: add the answer as its own item directly under the proposal it concerns (heading = the question in plain words, then the answer in the first sentence, evidence, picture). Do not rewrite the items the user has already read, and do not move the chip.
- Follow-up pages contain only the items still open, each with the answer to the user's question and a chip. Items decided by the user's own suggestion are shown without a chip, with what was written down.

## Pictures

Draw whatever replaces a paragraph, as inline SVG or plain HTML/CSS. No scripts and no external images: pages sent with `SendUserFile` do not run scripts, so Mermaid must be pre-rendered or the diagram hand-drawn.

| Step | Draw |
|---|---|
| spec | flowchart of a rule with its branches, timeline for time values, comparison table of alternatives |
| flow | screen-to-screen diagram; a mock-up of every new or changed screen as it would look in the service, **separately for PC, tablet and phone**, placed next to the proposals it illustrates |
| design-delta, ADR | module relation diagram, table relation (class) diagram, sequence diagram of each main request |

- Mock-ups show position and order, not visual design; say so on the page. Base existing screens on the dev project's current screens and say when that was not checked.
- SVG text does not wrap: a Korean character is about as wide as the font size, so compute where each label starts and ends before placing it. Stagger labels that would touch; right-align the last label and left-align the first.
- Give every picture a one-line caption that states its point.

## Page format

- Start from the `<head>` of an existing page in the cycle's `easy/` folder so the style and the CSS variables (the canvas chips need them) stay the same. If there is none, define: body 20px or larger, weight 400 or more, Noto Sans KR, `word-break:keep-all`, `overflow-wrap:break-word`, `text-wrap:pretty` on text and `text-wrap:balance` on headings, a `max-width` on the main column, readable at phone width. **Light by default, dark only on request** (user, 2026-10-04): define colours as CSS variables on `:root` (`--bg --card --text --muted --line --accent --accent-bg --ok --ok-bg --warn --warn-bg --no --no-bg --code-bg`) and use only those variables for colours, in SVG too (`fill="var(--text)"`). Do not add `prefers-color-scheme` rules: the page must not follow the operating system. In the canvas the review script adds a 어둡게/밝게 button and supplies the dark values for these variables (`:root[data-theme="dark"]`), so a page that uses the variables turns dark there without carrying dark rules itself. Fixed brand colours (provider buttons) stay fixed.
- **Put the whole page body inside `<main class="doc">`** (user, 2026-10-04). The canvas script (`proposal-review.cjs`) turns `[안]` into chips and adds the 어둡게/밝게 button and the 보내기 bar only inside the element with class `doc`; without it the page opens with plain `[안]` text and no buttons. Copy the body wrapper from an existing page along with the `<head>`, and read the script's output: it prints a `warning` when `.doc` is missing.
- Cards with a number badge. Colours carry meaning only: green = possible/ok, red = not possible, amber = conditional or proposal.
- Break headings by hand with `<br>` at a meaning boundary; keep short groups together with `&nbsp;` (number + unit, "쓸 수 없습니다").
- Save as `<cycle>/easy/YYYY-MM-DD-<name>.html`, add a row to `<cycle>/easy/README.md` (file, what it explains, source document, open `[안]`), and end the page with a line naming the source document.

## Last check

Read the page once as someone who has not seen the source. Fix it if any of these is true: a word appears without explanation; a sentence does not say who acts; "어떻게?" has no answer on the page; a count stands without its members; a number has no stated meaning; the same thing has two names; a picture's text overlaps or is cut off; something on the page is not in the source or in a cited official document. Tell the user about anything you added that the source did not contain.
