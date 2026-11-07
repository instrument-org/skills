# Images

A page travels as one file, so everyone you send it to also receives every picture on it. That makes each image a real cost, and images are the usual reason a mail client refuses to deliver a page.

## When to use a picture

Use a picture when the reader is choosing between physical things they need to recognize, when a shape or a layout is the subject, or when a screenshot is the evidence for a claim. A product photo in a comparison of bikes does real work. A stock photo of a laptop at the top of a page about software is only decoration.

If a picture doesn't do one of those jobs, leave it out. Whitespace, a clear heading and a well-set table look more trustworthy than a picture that's only there because pages usually have one.

## Size and compression

A page can weigh as much as it needs to, up to the 8 MB limit on a shared link. A page with a dozen product photos, or a dataset of thousands of rows, is carrying what the reader asked for. What isn't acceptable is an image saved carelessly, like a photo straight off a camera or a screenshot saved as an uncompressed PNG. It costs everyone who receives the page and adds nothing. `page.mjs` fails any image over 500 KB.

For a **photo**, crop it to the aspect ratio the layout uses, resize it to 720 pixels on the long edge, and save it as JPEG at quality 78. That usually comes to 40 to 80 KB. Go smaller when the box is smaller, and say why. For example, photos in the cells of a comparison table shown at `width="480"` should be 480 pixels wide at quality 72.

A **screenshot** keeps its detail, because the reader opens it full size. Every `figure` image larger than its box opens in the page's viewer, and the arrow keys step through the rest. Keep a screenshot up to 1600 pixels on the long edge and save it as JPEG at quality 80 or as WebP. A flat interface often comes out smaller as a PNG, so keep whichever file is smaller. Give it its real pixel size in `width` and `height`, and let the layout scale it down. Never crop a screenshot to even out a grid, because `.frames` letterboxes pictures of different shapes into equal cells.

## Embedding

Every image ends up inside the file as a `data:` URI. The page has to open from a USB stick, with no network, years from now, and a hosted copy can't load images from anywhere else. You never write the base64 yourself. Name the image in `src` (or in an SVG `href`, a `poster`, or a CSS `url()`) by a path relative to the page or by its URL, and `page.mjs` reads it, checks that it's an image under 500 KB, and puts the bytes in.

The path or URL doesn't survive in the page. To replace a picture, put its path back in `src` in place of the `data:` URI and run `page.mjs` again; changing the file beside the page does nothing on its own. If `page.mjs` can't read an image, finds it isn't an image, or finds it's over 500 KB, it leaves the `src` as written and fails, so save the image smaller and run again.

To resize a photo, save it to a file beside the page and name that file:

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

If a URL already serves the photo at the right size, you can put it in `src` as it is.

Give every `<img>` a `width` and `height`, so the text doesn't jump as the page loads, and real `alt` text that describes what the picture shows.

Base64 is a third larger than the bytes it encodes, so a 150 KB photo becomes a 200 KB attribute. Count the encoded size.

## When you have no photo

This happens often, and the two usual responses are both wrong. One leaves a hole where a picture should be. The other hotlinks a picture from a search result, which breaks the single file and often points the reader somewhere they didn't ask to go.

Draw a stand-in instead, as **inline SVG**. A few flat shapes in the page's own palette look deliberate rather than missing. They cost one to three kilobytes, need no encoding, and stay sharp at any size.

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

Choose this over a photo you aren't sure you're allowed to use. A diagram that's clearly a diagram never misleads the reader about what you actually saw, and a photo of the wrong model does.

Don't use a raster placeholder. Flat abstract shapes are what SVG is for, and a PNG of the same thing is larger, blurrier when scaled, and has to be base64-encoded on top.

## Photos of real things

When a page shows photos, they should be of the real things it names, taken from the maker's site or a licensed source, and credited. A drawn stand-in is for when there's no photo you may use, and it should look like the drawing it is.
