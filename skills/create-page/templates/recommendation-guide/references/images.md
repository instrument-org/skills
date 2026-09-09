# Images: product pictures that travel with the file

A guide about things people can buy needs pictures of them. A reader scans the picks by their photos before reading a word, and a pick card without one reads as a rumor. Software guides are the exception: a screenshot rarely earns its space, and a ranked ledger carries them fine.

## Where a picture goes

- One per pick, on the pick card, above the name. Same aspect ratio across the set (4:3 or 1:1), `object-cover`, so the grid stays even when the sources differ.
- The top pick's photo may also sit in the verdict, beside or behind the name, larger than the others.
- Never decorative stock: no "person happy at desk". Every image is the thing being recommended, or it is left out.

```html
<img
  src="data:image/jpeg;base64,…"
  alt="FlexiSpot E7 Pro, standing height, with two monitors"
  class="aspect-[4/3] w-full rounded-lg object-cover"
  width="720"
  height="540"
/>
```

## Where a picture comes from

Prefer the maker's own product photo, from the product page you already read for the specs; it is the picture the reader will recognize in the store. A retailer's listing photo is the fallback. Say in the footer where each came from.

The file has to open anywhere, so the image goes into it as a data URI rather than a link: a link to a store's image breaks when the listing changes, and a relative path breaks the moment the file leaves its folder. Keep each image under about 80 KB: resize to 720 pixels wide and save as JPEG at quality 78. Four to six images add roughly 300 KB to the file, which is fine.

Python, with Pillow (`pip install pillow` when it is not already there):

```python
import base64, io, urllib.request
from PIL import Image

def inline_image(url: str, width: int = 720, quality: int = 78) -> str:
    raw = urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})).read()
    image = Image.open(io.BytesIO(raw)).convert("RGB")
    image.thumbnail((width, width * 4))
    out = io.BytesIO()
    image.save(out, "JPEG", quality=quality, optimize=True)
    return "data:image/jpeg;base64," + base64.b64encode(out.getvalue()).decode()
```

Node, with no dependencies, when the source is already small enough:

```js
const bytes = Buffer.from(await (await fetch(url)).arrayBuffer());
const dataUri = `data:image/jpeg;base64,${bytes.toString("base64")}`;
```

The `sharp-images` skill resizes and recompresses when Pillow is not an option.

## Honesty

A photo of a different product than the one named is a lie the reader cannot detect. When no picture of the actual product can be had, leave the slot empty and say so, or use a representative photo of the category with a caption that says it is representative, as the examples in this skill do because their research is illustrative.
