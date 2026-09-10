# Tool

One self-contained HTML page that does one thing to whatever the reader gives it. Type, drag, paste, choose; the answer changes as you go; there is nothing to submit and nothing to install. A calculator, a converter, a checker, a planner, a reshaper. Small, sharp, and finished.

Every other template in this family hands the reader an answer. This one hands them the thing that produces answers, because their question has a parameter in it and yours does not.

## When to reach for it

Reach for it when the answer to the question is a function rather than a fact: when it depends on numbers only the reader has, when they will ask it again next week with different inputs, or when the useful thing is not the answer but the feel of how the answer moves. "How much would it be if", "work out X for me", "convert this", "check whether", "is this any good", "clean this up" are the phrases.

Two of these are worth building and the rest usually are not. **The answer is not proportional**, so nobody can guess it and a table of three cases would mislead: that is a model the reader drives, and the page exists to let them find the cliff. Or **the data cannot leave**, which is the stronger case: a bank statement, a staff list, a spreadsheet of somebody's health readings. A single file that reads it in their own browser and forgets it is the honest answer to a question they could not otherwise ask anyone, and it is worth saying so in the opening line rather than the fine print.

If neither is true, a tool that does arithmetic anyone could do in a spreadsheet is a page nobody needed.

Reach for it unprompted when you notice you are about to write the same calculation out three times with different numbers, or when a page you are writing has a paragraph beginning "of course this depends on".

Do not reach for it when the reader wants your judgment: a tool that produces a number is not a recommendation, and dressing a recommendation up as a slider hides the argument. Do not reach for it when the answer needs data the page cannot carry, since nothing here may reach the network. Do not reach for it for something that needs an account, a file on their disk, or a service. And do not build a tool that would be a worse version of something in the browser already.

## The shape

**The page is the tool.** Three slots, and the first and last are small, because everything worth saying about a tool is something the tool is about to demonstrate.

- **A name and one line.** What goes in and what comes out. Not a manual, and not a thesis: whatever you were about to write in an opening paragraph, drag the slider instead.
- **The tool.** Controls and answer in one card, with nothing between them. It recomputes as things change. This is the page.
- **The fine print.** Four one-liners in two columns under the card, and all four earn their place: **where the input goes** (nowhere), **what it assumes**, **where it is wrong**, and **where the defaults came from**. Four sentences, not four sections. A reader who wants the limits finds them in one glance, and a reader who does not is already using the thing.

What used to be a prose section headed "the answer it opens with" is now the opening answer itself, written into the HTML. See below.

## The rules that make a tool a tool

**It arrives with a real example already in it.** Every control starts at a value that produces a real answer, and the answer is on screen before anyone touches anything. A blank tool has to be learned before it helps, and most readers will not; a tool that opens on a worked example teaches itself in the time it takes to read it. Choose the example to be the interesting case rather than the easy one.

**And that opening answer is written into the HTML, not only computed.** Put the default result in the output element as static markup; let the script replace it on load with the same figures. That one duplication is what buys a page that still answers with its scripts off, printed, or pasted into a mail client, and it is why this template no longer needs a prose section restating the default. The two copies have to agree, and the way to make agreeing automatic rather than careful is to render the page once and paste back what the script produced.

**Compute the comparison, do not leave it to the reader.** A tool that prints "3.5 min" and "24 min" in two places has told them nothing; a tool that writes "take one person off and the average wait goes from 3.5 minutes to 24" has explained something. Where the finding is a ratio, a difference or a threshold, have the script say it in a sentence. That sentence is usually the reason the page is worth sending to somebody.

**One thing, done completely.** Two tools on a page are two pages. The temptation is always to add the adjacent feature, and every one of them costs the reader the confidence that they have understood the whole thing.

**No submit.** Output follows input immediately. A button that means "now compute" is a button that means "I built this like a form".

**The answer is takeable.** Copy to clipboard on anything the reader will paste somewhere else, and a visible fallback when the clipboard is refused, which happens inside frames. Where output is long, it is selectable text on the page rather than only a button.

**Say where the input goes.** Which is: nowhere. Nothing is sent, nothing is stored, it works offline. That is a real property of this format and worth stating outright, because the text people most need to reshape is usually the text they least want to hand to a website.

**State the limits or you are claiming there are none.** Every tool is wrong somewhere: an assumption, a rounding, a case it does not handle, a question it is not answering. Name them. A calculator with a confident number and no caveats gets acted on.

## What varies here

Free, and expected to differ between two pages made a day apart: the controls, which may be fields, sliders, chips, selects, a textarea or a drop target; whether the output is a number, a table, a chart, a strip, a rendering or reformatted text; whether the reader's state lives in the URL; and the density.

Fixed: the page is the tool. One line above it, four lines below it, nothing else.

## What it may load, and what has to survive without it

Nothing beyond the starter's fonts, icon set and Tailwind build, unless the answer wants a chart, in which case Chart.js pinned to an exact version, and the same rule as everywhere: **the numbers the chart draws are on the page as a table too, always rendered.** A tool whose output disappears with a failed script tag was a website.

Before reaching for one, check the shape of what you are drawing: a bar per row, with a label and a value, is HTML and a percentage width. A page that loads nothing cannot be broken by a CDN, and most tool output is that shape.

The arithmetic itself is never a dependency. Date and time zone work is `Intl`, which is in the browser and knows the real rules including daylight saving; formatting is `toLocaleString`; parsing is a regular expression you wrote. Everything a tool of this size needs is already there.

## Refusals

A tool that opens blank, or one whose opening answer exists only in the script. A submit button. A tool that does two things. **Prose sections around it**; the page is the tool. A number with no statement of what it assumes. A recommendation wearing a slider. Anything that reaches the network, uploads a file, or asks for a key. A chart with no table under it. A chart library loaded to draw six bars. Output the reader cannot copy. A control whose label is a variable name. A page that explains the tool for four paragraphs before showing it. Instructions that would not be needed if the thing were laid out better. Precision the inputs do not support, and a currency, a rate or a date presented as though it were current when it is an example.

## Honesty about the numbers

The defaults are the page's most dangerous content, because they look like research: an example interest rate is not a rate anyone is offering, an example price is not a price, an example paste is not a source. That is the fourth line of the fine print, and it is there so somebody reads it before they quote one.

Where the answer depends on the date, fix the date rather than using today's, print it, and say why it matters. An overlap computed "now" is quietly a different answer next month, and a page that does not say which day it assumed cannot be checked. The same goes for a rate, a version, or a table of rules that changes: name the one it used.

And where the tool is exact, say that too. Arithmetic that is exact for its stated assumptions is worth more than a hedge, as long as the assumptions are on the page.
