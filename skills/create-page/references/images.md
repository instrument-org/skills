# Images: earn the place, then pay for it properly

A page travels as one file, so every picture on it is carried by everyone the page is sent to. That makes an image a real cost rather than a free flourish, and it is the one thing that turns a page a mail client will deliver into one it will not.

## Does it earn its place

A picture earns its place when the reader is choosing between physical things they have to recognize, when a shape or a layout is the subject, or when a screenshot is the evidence for a claim. A product photo in a comparison of bikes is doing work; a stock photo of a laptop at the top of a page about software is decoration wearing the costume of content.

If the answer is no, the page is better without it. Whitespace, a heading, and a well-set table carry more authority than a picture that is there because pages usually have pictures.

## Pay for it properly

There is no ceiling on what a page may weigh. A page that carries a dozen product photos, or a dataset of thousands of rows, is carrying what the reader asked for. What there is no excuse for is a picture carrying bytes the reader's screen will never show, because those are paid by everyone the page is sent to and buy nothing.

The recipe: **crop to the aspect the layout uses, resize to 720 pixels on the long edge, and encode JPEG at quality 78.** A product photo done that way is usually 40 to 80 KB. One that comes out over about 200 KB was not resized.

Go stricter when the box is smaller, and say why: photos in the cells of a comparison table rendered at `width="480"` want 480 wide at quality 72, and a map's cards the same. Going stricter without a reason is just a worse picture.

Never ship an image larger than the box it renders in. A 960-wide file in a 480-wide cell costs the reader four times the bytes for pixels their screen will never show.

## Embedding it

Every image ends up inside the file as a `data:` URI, because the page has to open from a USB stick, with no network, years later, and a hosted copy loads no image from anywhere else. You never write the base64: name the image in `src` (or SVG `href`, `poster`, CSS `url()`) by a path relative to the page or by its URL, and `page.mjs` reads it, checks it is an image no larger than its box, and puts the bytes in. The path or URL does not survive into the page. An image it cannot read, that is not an image, or that is bigger than its box stays as written and fails, so resize it and run again.

Resize a photo to a file beside the page and name that file:

```python
import io, urllib.request
from PIL import Image

def save_photo(url: str, path: str, width: int = 720, quality: int = 78) -> None:
    raw = urllib.request.urlopen(
        urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    ).read()
    image = Image.open(io.BytesIO(raw)).convert("RGB")
    if image.width > width:
        height = round(image.height * width / image.width)
        image = image.resize((width, height), Image.LANCZOS)
    image.save(path, "JPEG", quality=quality, optimize=True, progressive=True)
```

A URL that already serves a photo at the right size can go in `src` as it is.

Give every `<img>` a `width` and `height` so the line does not reflow as the page paints, and real `alt` text saying what the picture shows, not what it is of.

Base64 costs a third more than the bytes it carries, so a 150 KB photo becomes a 200 KB attribute. Count the encoded size.

## When there is no photo

This is the common case, and the usual answers are both wrong: leaving a hole where a picture should be, or hotlinking one from a search result, which breaks the file and often points somewhere the reader did not ask to go.

Draw a stand-in instead, as **inline SVG**. A few flat shapes in the page's own palette read as deliberate rather than missing, cost one to three kilobytes, need no encoding at all, and stay sharp at any size.

```html
<svg
  viewBox="0 0 480 360"
  role="img"
  aria-label="Upright commuter bicycle, shown as a diagram"
>
  <rect width="480" height="360" class="wash" data-tone="muted" />
  <circle
    cx="140"
    cy="250"
    r="62"
    class="outline"
    style="--tone: var(--gray-400)"
    stroke-width="8"
  />
  <circle
    cx="340"
    cy="250"
    r="62"
    class="outline"
    style="--tone: var(--gray-400)"
    stroke-width="8"
  />
  <path
    d="M140 250 L215 160 L300 160 L340 250 M215 160 L250 250"
    class="outline"
    data-tone="accent"
    stroke-width="8"
    stroke-linejoin="round"
  />
</svg>
```

Prefer this to a photo you are not sure you may use. A diagram that is honestly a diagram never misleads a reader about what the page actually saw; a photo of the wrong model does.

Do not reach for a raster placeholder. A flat abstract shape is what SVG is for, and a PNG of the same thing is larger, blurrier when scaled, and has to be base64'd on top.

## Real things, real photos

Where a page carries photos, they are of the real things it names, found at their maker's or a licensed source and credited. A stand-in drawing is for when there is none you may use, and it is honestly a drawing.
