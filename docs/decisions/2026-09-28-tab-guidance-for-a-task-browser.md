# Tab guidance for a task's browser

Status: accepted, 2026-09-28. Supersedes [`2026-08-04-drop-tab-guidance-until-multi-page-support.md`](2026-08-04-drop-tab-guidance-until-multi-page-support.md).

## What

The agent-browser skill describes the `tab` commands again, as what they do: `tab list`, `tab new --label`, `tab <id or label>`, `tab close`, and `click --new-tab`. Commands act on the active tab, refs belong to the tab they were read in, a tab handed to the task is the user's to keep, and tabs the task opens stay in the user's chat after it ends. The row that sent agents to `open` a link's URL instead of clicking it now says to click, since a `target=_blank` link navigates its own tab rather than doing nothing. Page popups (`window.open`) stay unavailable.

## Why

The app's browser now serves a task working for a chat as a whole browser over the tabs of that chat it holds, so the commands the 2026-08-04 decision stopped naming open, switch and close real tabs rather than silently acting on one page. Leaving them unnamed would keep agents working across several pages one navigation at a time.

## What stays true of a single page

A task no chat owns, and the conversation's own view of the page on screen, still get one page, and there the app refuses the tab commands with a message saying the browser has one tab. The skill tells the agent to work in the one page when it sees that answer, rather than naming which contexts have tabs.
