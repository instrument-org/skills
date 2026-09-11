"""A cast and a set, so a storyboard is composed rather than drawn. Import it
from a script of your own, build each panel as a list of pieces, and paste the
SVG it prints into the page:

    import sys; sys.path.insert(0, "<this directory>")
    from panels import FLOOR, clock, floor, panel, person

    F = FLOOR()
    print(panel([floor(F), person(150, F)["svg"], clock(340, 62, 8, 55)]))

Run this file directly (`python panels.py`) to print a sample panel and check
the kit runs here.

The same functions and the same arguments as `panels.mjs` beside it; take
whichever language the rest of the task is in. The two draw the same picture,
though not always the same digits: a number that lands on a whole value prints
without its decimal either way, and further decimals may differ in the last
place. Nothing in a panel depends on that.

People are thick round-capped strokes in one flat color, which reads as a
pictogram; the set is thin outline behind them. That contrast is what keeps a
composed scene looking deliberate rather than unfinished. One accent color per
panel, on the thing the beat is about, and nothing else.

Furniture a person sits in or stands behind comes in two pieces, `back` and
`front`, drawn either side of them. Without that their shins cross the cushion,
which is the one mistake that reads as a drawing error.
"""

import math

INK = "var(--color-gray-700)"
SOFT = "var(--color-gray-400)"
LINE = "var(--color-gray-300)"
PALE = "var(--color-gray-100)"
CARD = "var(--color-card)"
ACCENT = "var(--color-brand-600)"
ACCENT_PALE = "var(--color-brand-100)"


def _f(v) -> str:
    """A number the way JavaScript writes one: no trailing zero on a whole value."""
    return f"{v:g}" if isinstance(v, float) else str(v)


def _s(d: str, *, stroke=INK, width=2, fill="none", cap="round") -> str:
    return (
        f'<path d="{d}" fill="{fill}" stroke="{stroke}" stroke-width="{_f(width)}" '
        f'stroke-linecap="{cap}" stroke-linejoin="round"/>'
    )


def _esc(t: str) -> str:
    return t.replace("&", "&amp;").replace("<", "&lt;")


# --- the panel ------------------------------------------------------------------


def panel(parts: list, *, w=400, h=300, label="") -> str:
    """A panel of `w` by `h`. `label` becomes its aria-label: say what it shows."""
    aria = f' aria-label="{_esc(label)}"' if label else ""
    body = "".join(p for p in parts if p)
    return f'<svg viewBox="0 0 {_f(w)} {_f(h)}" class="block w-full" role="img"{aria}>{body}</svg>'


def FLOOR(h=300):
    """The floor line's y for a panel of height `h`, so any aspect keeps everyone
    on the ground. Every piece below takes it as its second argument."""
    return h - 32


# --- the set --------------------------------------------------------------------


def floor(floor_y, *, w=400, stroke=LINE) -> str:
    return _s(f"M 0 {_f(floor_y)} H {_f(w)}", stroke=stroke)


def door(x, floor_y, *, w=70, h=160, stroke=INK, open=False) -> str:
    top = floor_y - h
    leaf = (
        f'<rect x="{_f(x)}" y="{_f(top)}" width="{_f(w)}" height="{_f(h)}" rx="2" '
        f'fill="{CARD}" stroke="{stroke}" stroke-width="2"/>'
    )
    if open:
        return leaf + _s(f"M {_f(x + w)} {_f(top)} l 30 -12 v {_f(h + 24)} l -30 -12", stroke=stroke, fill=PALE)
    return leaf + f'<circle cx="{_f(x + w - 13)}" cy="{_f(top + h / 2)}" r="3.5" fill="{stroke}"/>'


def counter(x, floor_y, *, w=150, h=86, stroke=INK, fill=PALE) -> str:
    """Solid, so whoever stands behind it shows from the chest up. Draw it after them."""
    top = floor_y - h
    return (
        f'<rect x="{_f(x)}" y="{_f(top)}" width="{_f(w)}" height="{_f(h)}" rx="3" '
        f'fill="{fill}" stroke="{stroke}" stroke-width="2"/>'
    ) + _s(f"M {_f(x - 6)} {_f(top)} h {_f(w + 12)}", stroke=stroke, width=3)


def desk(x, floor_y, *, w=170, h=74, stroke=INK) -> str:
    """Filled top, so a person drawn before it is cut off at the desk edge."""
    top = floor_y - h
    return (
        f'<rect x="{_f(x)}" y="{_f(top)}" width="{_f(w)}" height="7" fill="{CARD}" '
        f'stroke="{stroke}" stroke-width="2"/>'
        + _s(f"M {_f(x + 12)} {_f(top + 7)} V {_f(floor_y)}", stroke=stroke)
        + _s(f"M {_f(x + w - 12)} {_f(top + 7)} V {_f(floor_y)}", stroke=stroke)
    )


def table(x, floor_y, *, w=120, stroke=INK) -> str:
    top = floor_y - 62
    return (
        f'<rect x="{_f(x)}" y="{_f(top)}" width="{_f(w)}" height="6" fill="{CARD}" '
        f'stroke="{stroke}" stroke-width="2"/>'
    ) + _s(f"M {_f(x + w / 2)} {_f(top + 6)} V {_f(floor_y)}", stroke=stroke, width=3)


def chair(x, floor_y, *, facing=1, stroke=INK, part="all") -> str:
    """Side view, seat at floor-46, which is where `sitter` puts its hips.
    `part`: "back" before the person, "front" after, "all" when nobody sits."""
    seat = floor_y - 46
    spine = x - 20 * facing
    back = _s(f"M {_f(spine)} {_f(seat)} V {_f(seat - 54)}", stroke=stroke, width=3) + _s(
        f"M {_f(spine)} {_f(seat)} V {_f(floor_y)}", stroke=stroke
    )
    front = _s(f"M {_f(x - 26)} {_f(seat)} h 52", stroke=stroke, width=3) + _s(
        f"M {_f(x + 18 * facing)} {_f(seat)} V {_f(floor_y)}", stroke=stroke
    )
    return {"all": back + front, "back": back, "front": front}[part]


def sofa(x, floor_y, *, w=150, stroke=INK, fill=PALE, part="all") -> str:
    seat = floor_y - 44
    back = (
        f'<rect x="{_f(x)}" y="{_f(seat - 46)}" width="{_f(w)}" height="46" rx="8" '
        f'fill="{fill}" stroke="{stroke}" stroke-width="2"/>'
    )
    front = (
        f'<rect x="{_f(x - 8)}" y="{_f(seat)}" width="{_f(w + 16)}" height="26" rx="8" '
        f'fill="{fill}" stroke="{stroke}" stroke-width="2"/>'
        + _s(f"M {_f(x - 2)} {_f(seat + 26)} V {_f(floor_y)}", stroke=stroke)
        + _s(f"M {_f(x + w + 2)} {_f(seat + 26)} V {_f(floor_y)}", stroke=stroke)
    )
    return {"all": back + front, "back": back, "front": front}[part]


def screen(x, y, *, w=86, h=58, stroke=INK, fill=CARD, lines=2, stand=True) -> str:
    """A monitor. `stand=False` makes it a laptop lid."""
    out = (
        f'<rect x="{_f(x)}" y="{_f(y)}" width="{_f(w)}" height="{_f(h)}" rx="5" '
        f'fill="{fill}" stroke="{stroke}" stroke-width="2"/>'
    )
    for i in range(lines):
        out += _s(f"M {_f(x + 12)} {_f(y + 16 + i * 13)} h {_f(max(16, w - 24 - i * 18))}", stroke=stroke, width=2.5)
    if stand:
        out += _s(f"M {_f(x + w / 2)} {_f(y + h)} v 9 m -13 0 h 26", stroke=stroke, width=2.5)
    return out


def phone(x, y, *, h=150, stroke=INK, rows=("bar", "bar", "button"), accent=ACCENT) -> str:
    """A phone at true proportion. `rows` fills the screen: "bar" and "short" are
    grey lines standing in for text, "field" an empty input, "button" the accent
    button, "tick" a done mark, and any other string is set as a word. Four or
    five rows fit; a word longer than about fourteen characters does not."""
    w = round(h * 0.48)
    out = (
        f'<rect x="{_f(x)}" y="{_f(y)}" width="{_f(w)}" height="{_f(h)}" rx="{_f(h * 0.08)}" '
        f'fill="{CARD}" stroke="{stroke}" stroke-width="2.5"/>'
    )
    cy = y + h * 0.16
    for row in rows:
        if row == "bar":
            out += _s(f"M {_f(x + w * 0.16)} {_f(cy)} h {_f(w * 0.68)}", stroke=SOFT, width=h * 0.035)
        elif row == "short":
            out += _s(f"M {_f(x + w * 0.16)} {_f(cy)} h {_f(w * 0.4)}", stroke=SOFT, width=h * 0.035)
        elif row == "button":
            out += (
                f'<rect x="{_f(x + w * 0.16)}" y="{_f(cy - h * 0.045)}" width="{_f(w * 0.68)}" '
                f'height="{_f(h * 0.09)}" rx="{_f(h * 0.02)}" fill="{accent}"/>'
            )
        elif row == "field":
            out += (
                f'<rect x="{_f(x + w * 0.16)}" y="{_f(cy - h * 0.045)}" width="{_f(w * 0.68)}" '
                f'height="{_f(h * 0.09)}" rx="{_f(h * 0.02)}" fill="none" stroke="{SOFT}" stroke-width="1.5"/>'
            )
        elif row == "tick":
            out += f'<circle cx="{_f(x + w / 2)}" cy="{_f(cy)}" r="{_f(h * 0.07)}" fill="{accent}"/>' + _s(
                f"M {_f(x + w / 2 - h * 0.03)} {_f(cy)} l {_f(h * 0.02)} {_f(h * 0.025)} l {_f(h * 0.045)} -{_f(h * 0.05)}",
                stroke="#fff",
                width=2,
            )
        else:
            out += (
                f'<text x="{_f(x + w / 2)}" y="{_f(cy + h * 0.02)}" text-anchor="middle" '
                f'font-size="{_f(h * 0.06)}" font-weight="600" fill="{stroke}" '
                f'style="font-family:inherit">{_esc(row)}</text>'
            )
        cy += h * 0.13
    return out


def box(x, y, *, w=34, h=30, stroke=INK, fill=PALE) -> str:
    """A parcel, a bag, anything carried."""
    return (
        f'<rect x="{_f(x)}" y="{_f(y)}" width="{_f(w)}" height="{_f(h)}" rx="2" '
        f'fill="{fill}" stroke="{stroke}" stroke-width="2"/>'
    ) + _s(f"M {_f(x + w / 2)} {_f(y)} v {_f(h)}", stroke=stroke, width=1.5)


def van(x, floor_y, *, w=200, stroke=INK, fill=PALE, facing=1) -> str:
    h = 96
    top = floor_y - h - 10
    body = (
        f'<path d="M {_f(x)} {_f(top + h)} V {_f(top + 10)} h {_f(w * 0.62)} '
        f'l {_f(w * 0.16)} {_f(h * 0.45)} h {_f(w * 0.22)} V {_f(top + h)} Z" '
        f'fill="{fill}" stroke="{stroke}" stroke-width="2" stroke-linejoin="round"/>'
    )
    wheels = "".join(
        f'<circle cx="{_f(cx)}" cy="{_f(floor_y - 10)}" r="14" fill="{CARD}" stroke="{stroke}" stroke-width="2.5"/>'
        for cx in (x + w * 0.2, x + w * 0.8)
    )
    win = (
        f'<path d="M {_f(x + w * 0.64)} {_f(top + 16)} h {_f(w * 0.11)} l {_f(w * 0.1)} '
        f'{_f(h * 0.3)} h -{_f(w * 0.21)} Z" fill="{CARD}" stroke="{stroke}" stroke-width="2"/>'
    )
    flip = f' transform="translate({_f(2 * x + w)} 0) scale(-1 1)"' if facing == -1 else ""
    return f"<g{flip}>{body}{win}{wheels}</g>"


def clock(x, y, hour, minute, *, r=21, stroke=SOFT) -> str:
    hh = math.radians((hour % 12) * 30 + minute * 0.5 - 90)
    mm = math.radians(minute * 6 - 90)
    return (
        f'<circle cx="{_f(x)}" cy="{_f(y)}" r="{_f(r)}" fill="{CARD}" stroke="{stroke}" stroke-width="2"/>'
        + _s(f"M {_f(x)} {_f(y)} L {x + math.cos(hh) * r * 0.48:.1f} {y + math.sin(hh) * r * 0.48:.1f}", stroke=stroke, width=2.5)
        + _s(f"M {_f(x)} {_f(y)} L {x + math.cos(mm) * r * 0.76:.1f} {y + math.sin(mm) * r * 0.76:.1f}", stroke=stroke, width=2)
    )


# --- the cast -------------------------------------------------------------------


def person(x, floor_y, *, facing=1, arm="down", tone=INK, scale=1) -> dict:
    """Standing. Returns {"svg", "hand"} so a thing can be put in the hand.
    arm: down | out | up | hold | pocket. facing: 1 right, -1 left.
    tone: INK for the subject, SOFT for anyone else, ACCENT for the one the
    beat is about. scale under one puts someone further away."""
    k = scale
    head_r, head_y = 14 * k, floor_y - 128 * k
    neck, hip, shoulder, limb = floor_y - 110 * k, floor_y - 62 * k, floor_y - 100 * k, 9 * k
    hand = {
        "down": (x + 15 * k * facing, hip + 4 * k),
        "out": (x + 40 * k * facing, shoulder + 6 * k),
        "up": (x + 24 * k * facing, shoulder - 34 * k),
        "hold": (x + 24 * k * facing, shoulder + 26 * k),
        "pocket": (x + 17 * k * facing, hip - 2 * k),
    }[arm]
    svg = (
        f'<circle cx="{_f(x)}" cy="{_f(head_y)}" r="{_f(head_r)}" fill="{tone}" stroke="{tone}" stroke-width="2"/>'
        + _s(f"M {_f(x)} {_f(neck)} V {_f(hip)}", stroke=tone, width=15 * k)
        + _s(f"M {_f(x)} {_f(hip)} L {_f(x - 10 * k)} {_f(floor_y)}", stroke=tone, width=limb)
        + _s(f"M {_f(x)} {_f(hip)} L {_f(x + 11 * k)} {_f(floor_y)}", stroke=tone, width=limb)
        + _s(f"M {_f(x)} {_f(shoulder + 3 * k)} L {_f(hand[0])} {_f(hand[1])}", stroke=tone, width=limb)
    )
    return {"svg": svg, "hand": hand}


def sitter(x, floor_y, *, facing=1, arm="lap", tone=INK, scale=1) -> dict:
    """Seated, hips at the seat height `chair` and `sofa` give. arm: lap | out | up."""
    k = scale
    seat = floor_y - 46 * k
    head_r, head_y, neck = 14 * k, seat - 96 * k, seat - 78 * k
    knee_x, limb = x + 40 * k * facing, 9 * k
    hand = {
        "lap": (x + 26 * k * facing, seat - 10 * k),
        "out": (x + 48 * k * facing, seat - 50 * k),
        "up": (x + 20 * k * facing, seat - 104 * k),
    }[arm]
    svg = (
        f'<circle cx="{_f(x)}" cy="{_f(head_y)}" r="{_f(head_r)}" fill="{tone}" stroke="{tone}" stroke-width="2"/>'
        + _s(f"M {_f(x)} {_f(neck)} V {_f(seat)}", stroke=tone, width=15 * k)
        + _s(f"M {_f(x)} {_f(seat)} H {_f(knee_x)} V {_f(floor_y)}", stroke=tone, width=limb)
        + _s(f"M {_f(x)} {_f(neck + 12 * k)} L {_f(hand[0])} {_f(hand[1])}", stroke=tone, width=limb)
    )
    return {"svg": svg, "hand": hand}


def closeup(x, bottom, *, facing=1, tone=INK, scale=1) -> str:
    """Head and shoulders, large: the close shot. The panel edge crops the body."""
    k = scale
    return (
        f'<path d="M {_f(x - 120 * k)} {_f(bottom)} q 20 -80 120 -80 q 100 0 120 80 Z" fill="{tone}"/>'
        f'<circle cx="{_f(x + 6 * k * facing)}" cy="{_f(bottom - 150 * k)}" r="{_f(44 * k)}" fill="{tone}"/>'
    )


# --- what they say, and what to notice --------------------------------------------


def bubble(x, y, text, tail, *, kind="say", tone=INK, fill=CARD, size=14) -> str:
    """`tail` is the point it comes from. `kind`: "say" or "think"."""
    w = max(76, round(len(text) * size * 0.53) + 24)
    h = size + 20
    ax, ay = x + w / 2, y + h
    tx, ty = tail
    out = (
        f'<rect x="{_f(x)}" y="{_f(y)}" width="{_f(w)}" height="{_f(h)}" rx="{_f(h / 2)}" '
        f'fill="{fill}" stroke="{tone}" stroke-width="2"/>'
    )
    if kind == "say":
        out += _s(f"M {_f(ax - 9)} {_f(ay - 3)} L {_f(tx)} {_f(ty)} L {_f(ax + 9)} {_f(ay - 3)} Z", stroke=tone, fill=fill)
    else:
        for i, f in enumerate((0.4, 0.72)):
            out += (
                f'<circle cx="{ax + (tx - ax) * f:.0f}" cy="{ay + (ty - ay) * f:.0f}" '
                f'r="{_f(5.5 - i * 2)}" fill="{fill}" stroke="{tone}" stroke-width="2"/>'
            )
    out += (
        f'<text x="{_f(ax)}" y="{y + h / 2 + size * 0.35:.0f}" text-anchor="middle" '
        f'font-size="{_f(size)}" fill="{tone}" style="font-family:inherit">{_esc(text)}</text>'
    )
    return out


def label(x, y, text, *, size=13, tone=SOFT, anchor="middle", weight=400) -> str:
    """A word in the scene, muted unless it is the accent."""
    return (
        f'<text x="{_f(x)}" y="{_f(y)}" text-anchor="{anchor}" font-size="{_f(size)}" '
        f'fill="{tone}" font-weight="{_f(weight)}" style="font-family:inherit">{_esc(text)}</text>'
    )


def dots(x, y, *, n=3, tone=SOFT, gap=13) -> str:
    """Waiting, or time passing."""
    return "".join(f'<circle cx="{_f(x + i * gap)}" cy="{_f(y)}" r="3.5" fill="{tone}"/>' for i in range(n))


def move(x1, y1, x2, y2, word, *, tone=ACCENT) -> str:
    """A camera move, drawn outside the picture's own logic: a thin accent arrow
    with a word. For a shot list."""
    a = math.atan2(y2 - y1, x2 - x1)
    head = "".join(
        _s(
            f"M {_f(x2)} {_f(y2)} L {_f(x2 - math.cos(a + k * 0.5) * 12)} {_f(y2 - math.sin(a + k * 0.5) * 12)}",
            stroke=tone,
            width=2,
        )
        for k in (1, -1)
    )
    return (
        _s(f"M {_f(x1)} {_f(y1)} L {_f(x2)} {_f(y2)}", stroke=tone, width=2)
        + head
        + label((x1 + x2) / 2, min(y1, y2) - 8, word, size=11, tone=tone, weight=600)
    )


if __name__ == "__main__":
    F = FLOOR()
    ash = person(150, F, arm="hold")
    print(
        panel(
            [
                floor(F),
                door(232, F, w=78, h=172),
                ash["svg"],
                box(ash["hand"][0] - 6, ash["hand"][1] - 4, w=30, h=34),
                clock(340, 62, 8, 55),
            ],
            label="Someone outside a closed door holding a bag, clock at 08:55",
        )
    )
