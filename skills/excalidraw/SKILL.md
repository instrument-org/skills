---
name: excalidraw
description: "Use when the person asks for a whiteboard, an Excalidraw drawing, or a sketch they want to rearrange themselves, or names a .excalidraw file to read or change. Writes and edits .excalidraw files, which Instrument opens as a live canvas both of you can edit. Not for a diagram that answers a question in a reply, a list, a plan or a document."
---

# Excalidraw

A `.excalidraw` file is JSON that Instrument opens as an editable canvas. The person and you can both change it while it is open: what you write lands on their canvas, merged with their own edits. That makes it right for a board they will move things around on, and wrong for an answer they only read. When they did not ask for a board, answer in the reply (a Mermaid fence for a diagram), or with the `instrument-page` skill for something longer.

## Writing a new file

```json
{
  "type": "excalidraw",
  "version": 2,
  "source": "instrument",
  "elements": [],
  "appState": { "viewBackgroundColor": "#ffffff" },
  "files": {}
}
```

Each element needs `id` (unique string), `type`, `x`, `y`, `width`, `height`, `version: 1`, `versionNonce` and `seed` (any integers), `isDeleted: false`, `angle: 0`, `strokeColor`, `backgroundColor`, `fillStyle: "solid"`, `strokeWidth: 2`, `roughness: 1`, `opacity: 100`, `groupIds: []`, `boundElements: null`, `updated` (ms timestamp), `locked: false`.

- Shapes: `rectangle`, `ellipse`, `diamond`. Sticky notes are rectangles with a pale `backgroundColor` (`#fff3bf`, `#d3f9d8`, `#d0ebff`).
- Text: `type: "text"`, `text` and `originalText` the same, `fontSize: 20`, `fontFamily: 5` (the hand-drawn font), `textAlign`, `verticalAlign`, `lineHeight: 1.25`. Size it at about `0.6 * fontSize` per character of the longest line wide and `1.25 * fontSize` per line tall; the canvas measures it again when it opens.
- Text inside a shape: give the text `containerId: <shape id>`, `textAlign: "center"`, `verticalAlign: "middle"`, and list it on the shape as `boundElements: [{ "type": "text", "id": <text id> }]`. Make the shape wide enough for the text plus 20 on each side.
- Arrows: `type: "arrow"`, `points: [[0, 0], [dx, dy]]` relative to `x`, `y`, with `startBinding` / `endBinding` `{ "elementId": <shape id>, "focus": 0, "gap": 8 }`, and each bound shape listing `{ "type": "arrow", "id": <arrow id> }` in its `boundElements`.

Lay boards out on a grid with room between things, 40 or more apart, so the person has space to move them.

## Changing a file

Read it first, and change only the elements you mean to. Keep every id. On an element you change, add 1 to `version`, pick a new `versionNonce`, and set `updated` to now; that is how the canvas tells your change from theirs. Delete by setting `isDeleted: true`, never by dropping the element. Write the whole file back in one write.

## Handing it over

Name the file in the files fence when you made it or changed it this turn, and not on later turns when you only talked about it. Don't render a preview image of it: Instrument shows the drawing itself.
