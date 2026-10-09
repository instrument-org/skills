"""Write an Excalidraw scene from named pieces, so a board's author never types
a coordinate twice. Import it from a script of your own and call `write`:

    import sys; sys.path.insert(0, "<this directory>")
    from board import SAND, arrow, box, write

    a = box(40, 0, 200, 80, "order lands", fill=SAND)
    b = box(340, 0, 200, 80, "stock check")
    arrow(a, b, label="then")
    write("scene.json", "How an order moves")

Then paste scene.json into the page's `#scene` block. Run this file directly
(`python board.py`) to write a sample scene and check the kit runs here.

The same functions, the same arguments and the same output as `board.mjs`
beside it; take whichever language the rest of the task is in.

Two references have to point both ways or Excalidraw drops them silently on the
way in: a container's text (containerId <-> boundElements) and an arrow's ends
(startBinding / endBinding <-> boundElements). Every function here makes both.
Everything else Excalidraw fills in for itself, so a board names only what it
decided.

State is module-level, which is what keeps the calls short: one run writes one
board, and `write` clears the buffer so a script may write several.
"""

import base64
import json
import pathlib
import sys

INK = "#1e1e1e"
RED = "#b4324f"
GREEN = "#0e7869"
MUTED = "#6d655f"
SAND = "#f6efe6"
SAGE = "#d8e6e1"
BLUSH = "#f3d9d9"
CREAM = "#fbf5e6"

_els: list[dict] = []
_files: dict[str, dict] = {}
_n = 0


def _id(prefix: str) -> str:
    global _n
    _n += 1
    return f"{prefix}{_n}"


def _put(el: dict) -> dict:
    _els.append(el)
    return el


def _shape(kind: str, x, y, w, h, **over) -> dict:
    el = {
        "id": _id(kind[0]),
        "type": kind,
        "x": x,
        "y": y,
        "width": w,
        "height": h,
        "strokeColor": INK,
        "backgroundColor": "transparent",
        "fillStyle": "solid",
        "boundElements": [],
    }
    if kind == "rectangle":
        el["roundness"] = {"type": 3}
    el.update(over)
    return _put(el)


def _bind(host: dict, label: str, size: int, color=None) -> dict:
    lines = len(label.split("\n"))
    t = _put({
        "id": _id("t"),
        "type": "text",
        "x": host["x"] + 12,
        "y": host["y"] + host["height"] / 2 - (size * 1.25 * lines) / 2,
        "width": max(20, host["width"] - 24),
        "height": size * 1.25 * lines,
        "text": label,
        "originalText": label,
        "fontSize": size,
        "fontFamily": 1,
        "textAlign": "center",
        "verticalAlign": "middle",
        "strokeColor": color if color is not None else host["strokeColor"],
        "containerId": host["id"],
    })
    host["boundElements"].append({"id": t["id"], "type": "text"})
    return t


# --- things ------------------------------------------------------------------


def box(x, y, w, h, label=None, *, fill="transparent", stroke=INK, size=20,
        color=None, square=False, dash=False, weight=None) -> dict:
    """A box, with a label that moves with it. `square` drops the rounded corners."""
    over = {"backgroundColor": fill, "strokeColor": stroke}
    if square:
        over["roundness"] = None
    if dash:
        over["strokeStyle"] = "dashed"
    if weight:
        over["strokeWidth"] = weight
    b = _shape("rectangle", x, y, w, h, **over)
    if label:
        _bind(b, label, size, color)
    return b


def ellipse(x, y, w, h, label=None, *, fill="transparent", stroke=INK, size=20, weight=None) -> dict:
    over = {"backgroundColor": fill, "strokeColor": stroke}
    if weight:
        over["strokeWidth"] = weight
    e = _shape("ellipse", x, y, w, h, **over)
    if label:
        _bind(e, label, size)
    return e


def diamond(x, y, w, h, label=None, *, fill="transparent", stroke=INK, size=18) -> dict:
    d = _shape("diamond", x, y, w, h, backgroundColor=fill, strokeColor=stroke)
    if label:
        _bind(d, label, size)
    return d


def text(x, y, s, *, size=20, color=INK, font=1, align="left", angle=0) -> dict:
    """Text on its own. `font`: 1 hand-drawn, 2 plain, 3 monospace."""
    lines = s.split("\n")
    w = max(len(line) for line in lines) * size * 0.55
    return _put({
        "id": _id("t"),
        "type": "text",
        "x": x - w / 2 if align == "center" else x - w if align == "right" else x,
        "y": y,
        "width": w,
        "height": size * 1.25 * len(lines),
        "text": s,
        "originalText": s,
        "fontSize": size,
        "fontFamily": font,
        "textAlign": align,
        "verticalAlign": "top",
        "strokeColor": color,
        "angle": angle,
    })


def line(x1, y1, x2, y2, *, stroke=INK, weight=2, dash=False) -> dict:
    """A straight line between two points, bound to nothing."""
    el = {
        "id": _id("l"),
        "type": "line",
        "x": x1,
        "y": y1,
        "width": abs(x2 - x1),
        "height": abs(y2 - y1),
        "points": [[0, 0], [x2 - x1, y2 - y1]],
        "strokeColor": stroke,
        "strokeWidth": weight,
    }
    if dash:
        el["strokeStyle"] = "dashed"
    return _put(el)


def _port(a: dict, b: dict, gap: int):
    """Where an arrow should leave `a` for `b`: the middle of the facing edge."""
    ax, ay = a["x"] + a["width"] / 2, a["y"] + a["height"] / 2
    bx, by = b["x"] + b["width"] / 2, b["y"] + b["height"] / 2
    if abs(bx - ax) >= abs(by - ay):
        s = 1 if bx - ax >= 0 else -1
        return ax + (s * a["width"]) / 2 + s * gap, ay
    s = 1 if by - ay >= 0 else -1
    return ax, ay + (s * a["height"]) / 2 + s * gap


def arrow(a: dict, b: dict, *, label=None, stroke=INK, size=16, dash=False, weight=None) -> dict:
    """An arrow from shape `a` to shape `b`, bound at both ends so it follows a drag."""
    gap = 6
    x1, y1 = _port(a, b, gap)
    x2, y2 = _port(b, a, gap)
    el = {
        "id": _id("a"),
        "type": "arrow",
        "x": x1,
        "y": y1,
        "width": abs(x2 - x1),
        "height": abs(y2 - y1),
        "points": [[0, 0], [x2 - x1, y2 - y1]],
        "strokeColor": stroke,
        "startBinding": {"elementId": a["id"], "focus": 0, "gap": gap},
        "endBinding": {"elementId": b["id"], "focus": 0, "gap": gap},
        "startArrowhead": None,
        "endArrowhead": "arrow",
        "boundElements": [],
    }
    if dash:
        el["strokeStyle"] = "dashed"
    if weight:
        el["strokeWidth"] = weight
    ar = _put(el)
    a["boundElements"].append({"id": ar["id"], "type": "arrow"})
    b["boundElements"].append({"id": ar["id"], "type": "arrow"})
    if label:
        t = _put({
            "id": _id("t"),
            "type": "text",
            "x": (x1 + x2) / 2 - 30,
            "y": (y1 + y2) / 2 - size * 0.625,
            "width": 60,
            "height": size * 1.25,
            "text": label,
            "originalText": label,
            "fontSize": size,
            "fontFamily": 1,
            "textAlign": "center",
            "verticalAlign": "middle",
            "strokeColor": stroke,
            "containerId": ar["id"],
        })
        ar["boundElements"].append({"id": t["id"], "type": "text"})
    return ar


def pic(x, y, w, h, svg: str) -> dict:
    """An SVG onto the board, as an image the reader can move, scale and export."""
    file_id = _id("f")
    _files[file_id] = {
        "id": file_id,
        "mimeType": "image/svg+xml",
        "dataURL": "data:image/svg+xml;base64," + base64.b64encode(svg.encode()).decode(),
        "created": 1757548800000,
    }
    return _put({
        "id": _id("i"),
        "type": "image",
        "x": x,
        "y": y,
        "width": w,
        "height": h,
        "fileId": file_id,
        "status": "saved",
        "scale": [1, 1],
        "boundElements": [],
    })


def frame(name: str, members: list[dict], *, pad=28) -> dict:
    """A named region around a set of things, sized from what it holds. Excalidraw
    moves a frame's members with it and can export one frame alone."""
    x0 = min(m["x"] for m in members) - pad
    y0 = min(m["y"] for m in members) - pad - 8
    x1 = max(m["x"] + m["width"] for m in members) + pad
    y1 = max(m["y"] + m["height"] for m in members) + pad
    f = _put({
        "id": _id("fr"),
        "type": "frame",
        "x": x0,
        "y": y0,
        "width": x1 - x0,
        "height": y1 - y0,
        "name": name,
        "boundElements": [],
    })
    inside = {m["id"] for m in members}
    for e in _els:
        if e["id"] in inside or e.get("containerId") in inside:
            e["frameId"] = f["id"]
    return f


def stroke(points: list, *, stroke=RED, weight=2) -> dict:
    """A hand-drawn stroke through the given points, as the marker would."""
    x0, y0 = points[0]
    xs = [p[0] for p in points]
    ys = [p[1] for p in points]
    return _put({
        "id": _id("d"),
        "type": "freedraw",
        "x": x0,
        "y": y0,
        "width": max(xs) - min(xs),
        "height": max(ys) - min(ys),
        "points": [[x - x0, y - y0] for x, y in points],
        "pressures": [],
        "simulatePressure": True,
        "strokeColor": stroke,
        "strokeWidth": weight,
    })


def ring(members: list[dict], *, stroke=RED, pad=22) -> dict:
    """A ring around one or more things: the marker's way of saying `these`."""
    x0 = min(m["x"] for m in members) - pad
    y0 = min(m["y"] for m in members) - pad
    x1 = max(m["x"] + m["width"] for m in members) + pad
    y1 = max(m["y"] + m["height"] for m in members) + pad
    # An ellipse through a box's corners is wider than the box, so it gets air.
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    w, h = (x1 - x0) * 1.2, (y1 - y0) * 1.35
    return _shape("ellipse", cx - w / 2, cy - h / 2, w, h, strokeColor=stroke, strokeWidth=2)


def note(x, y, w, h, label, *, stroke=RED, fill="#fbeaea", size=18) -> dict:
    """A marker note: a pale box with colored ink, for what the board says about itself."""
    return box(x, y, w, h, label, fill=fill, stroke=stroke, size=size)


# --- the file ------------------------------------------------------------------


def _audit() -> None:
    """Every reference resolves, and both ways. Raises rather than writing a scene
    whose labels or arrows Excalidraw would drop without saying so."""
    by = {e["id"]: e for e in _els}

    def claims(host_id, child_id):
        return any(b["id"] == child_id for b in by.get(host_id, {}).get("boundElements", []))

    for e in _els:
        if e.get("containerId") and not claims(e["containerId"], e["id"]):
            raise ValueError(f"text {e['id']} names container {e['containerId']}, which does not claim it back")
        for k in ("startBinding", "endBinding"):
            if e.get(k) and not claims(e[k]["elementId"], e["id"]):
                raise ValueError(f"arrow {e['id']} binds {e[k]['elementId']}, which does not claim it back")
        if e.get("frameId") and e["frameId"] not in by:
            raise ValueError(f"{e['id']} names a frame that is not here")
        if e["type"] == "image" and e["fileId"] not in _files:
            raise ValueError(f"image {e['id']} has no file")


def write(path: str, name: str, *, grid=None, background="#ffffff") -> dict:
    """Writes the scene and clears the buffer. `grid` is the spacing in board units
    for a plan, or None for everything else; `name` is what an export is called."""
    global _n
    _audit()
    scene = {
        "type": "excalidraw",
        "version": 2,
        "source": "tryinstrument.com",
        "elements": _els,
        "appState": {
            "viewBackgroundColor": background,
            "gridSize": grid,
            "gridModeEnabled": grid is not None,
            "name": name,
        },
        "files": _files,
    }
    out = json.dumps(scene, separators=(",", ":"))
    pathlib.Path(path).write_text(out)
    print(f"{path}: {len(_els)} elements, {len(_files)} file(s), {len(out) / 1024:.1f} KB")
    _els.clear()
    _files.clear()
    _n = 0
    return scene


if __name__ == "__main__":
    text(0, 0, "A sample board", size=28)
    a = box(0, 70, 200, 80, "a thing", fill=SAND)
    b = box(320, 70, 200, 80, "what it leads to", fill=SAGE)
    arrow(a, b, label="then")
    note(0, 220, 240, 70, "and what to notice")
    write(sys.argv[1] if len(sys.argv) > 1 else "sample.excalidraw.json", "A sample board")
