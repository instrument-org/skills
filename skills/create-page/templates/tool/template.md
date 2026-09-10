# Tool

One self-contained HTML page that does one thing to whatever the reader gives it. Type, drag, paste, choose; the answer changes as you go; there is nothing to submit and nothing to install. A calculator, a converter, a checker, a planner, a reshaper. Small, sharp, and finished.

Every other template in this family hands the reader an answer. This one hands them the thing that produces answers, because their question has a parameter in it and yours does not.

## When to reach for it

Reach for it when the answer to the question is a function rather than a fact: when it depends on numbers only the reader has, when they will ask it again next week with different inputs, or when the useful thing is not the answer but the feel of how the answer moves. "How much would it be if", "work out X for me", "convert this", "check whether", "find me a time", "is this any good", "clean this up" are the phrases.

Reach for it unprompted when you notice you are about to write the same calculation out three times with different numbers, or when a page you are writing has a paragraph beginning "of course this depends on".

Do not reach for it when the reader wants your judgment: a tool that produces a number is not a recommendation, and dressing a recommendation up as a slider hides the argument. Do not reach for it when the answer needs data the page cannot carry, since nothing here may reach the network. Do not reach for it for something that needs an account, a file on their disk, or a service. And do not build a tool that would be a worse version of something in the browser already.

## The shape

Each slot is an intent. Answer it in whatever form suits the material.

- **What it does.** Two or three sentences above the tool: what goes in, what comes out, and why this is worth a page. Not a manual: if it needs a manual it needs a redesign.
- **The tool.** Controls and answer in one card, with nothing between them. It recomputes as things change.
- **The answer it opens with, in prose.** The default result, written out as sentences, saying what it turns on. This is the part a reader gets who never touches a control, the part that survives printing, and the part that makes the page worth reading rather than only worth using. It is not optional.
- **How to read it.** Only when the output needs interpreting: a legend, a band, what counts as good. Cut it when the answer is a number and the number speaks.
- **What it does, and what it does not.** The method in a line, then the limits, which are the part that matters: what it assumes, where it is wrong, what it does not know, what it will not tell you. Ends with where the reader's input goes, which is nowhere.

## The rules that make a tool a tool

**It arrives with a real example already in it.** Every control starts at a value that produces a real answer, and the answer is on screen before anyone touches anything. A blank tool has to be learned before it helps, and most readers will not; a tool that opens on a worked example teaches itself in the time it takes to read it. Choose the example to be the interesting case rather than the easy one, and say in the prose why that case is the one.

**One thing, done completely.** Two tools on a page are two pages. The temptation is always to add the adjacent feature, and every one of them costs the reader the confidence that they have understood the whole thing.

**No submit.** Output follows input immediately. A button that means "now compute" is a button that means "I built this like a form".

**The answer is takeable.** Copy to clipboard on anything the reader will paste somewhere else, and a visible fallback when the clipboard is refused, which happens inside frames. Where output is long, it is selectable text on the page rather than only a button.

**Say where the input goes.** Which is: nowhere. Nothing is sent, nothing is stored, it works offline. That is a real property of this format and worth stating outright, because the text people most need to reshape is usually the text they least want to hand to a website.

**State the limits or you are claiming there are none.** Every tool is wrong somewhere: an assumption, a rounding, a case it does not handle, a question it is not answering. Name them. A calculator with a confident number and no caveats gets acted on.

## What varies here

Free, and expected to differ between two pages made a day apart: the controls, which may be fields, sliders, chips, selects, a textarea or a drop target; whether the output is a number, a table, a chart, a strip, a rendering or reformatted text; whether the reader's state lives in the URL; the density; and whether the page is mostly tool with a footnote or mostly explanation with a tool in it.

## What it may load, and what has to survive without it

Nothing beyond the starter's fonts, icon set and Tailwind build, unless the answer wants a chart, in which case Chart.js pinned to an exact version, and the same rule as everywhere: **the numbers the chart draws are on the page as a table too, always rendered.** A tool whose output disappears with a failed script tag was a website.

The arithmetic itself is never a dependency. Date and time zone work is `Intl`, which is in the browser and knows the real rules including daylight saving; formatting is `toLocaleString`; parsing is a regular expression you wrote. Everything a tool of this size needs is already there.

## Refusals

A tool that opens blank. A submit button. A tool that does two things. A number with no statement of what it assumes. A recommendation wearing a slider. Anything that reaches the network, uploads a file, or asks for a key. A chart with no table under it. Output the reader cannot copy. A control whose label is a variable name. A page that explains the tool for four paragraphs before showing it. Instructions that would not be needed if the thing were laid out better. Precision the inputs do not support, and a currency, a rate or a date presented as though it were current when it is an example.

## Honesty about the numbers

The defaults are the page's most dangerous content, because they look like research: an example interest rate is not a rate anyone is offering, an example price is not a price, an example paste is not a source. Say which is which in the footer, before somebody quotes one.

Where the answer depends on the date, fix the date rather than using today's, print it, and say why it matters. An overlap computed "now" is quietly a different answer next month, and a page that does not say which day it assumed cannot be checked. The same goes for a rate, a version, or a table of rules that changes: name the one it used.

And where the tool is exact, say that too. Arithmetic that is exact for its stated assumptions is worth more than a hedge, as long as the assumptions are on the page.
